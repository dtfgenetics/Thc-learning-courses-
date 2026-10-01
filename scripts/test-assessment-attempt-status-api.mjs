import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';
import { loadPublishedCourseAssessment } from '../apps/api/src/course-assessment-service.mjs';
import { presentCourseAssessmentItem } from '../packages/domain/course-assessment-runtime.mjs';

const attempts=new Map();
const learnerStore={
  async getLearnerProfile(subject){return {learnerReference:`THC-LRN-${subject}`,displayName:'Test Learner',certificateName:'Test Learner'};},
  async listApplications(){return [{applicationReference:'THC-APP-TEST-001',programId:'CREDPROG-CULT-TECH-I-001',status:'active'}];},
  async findOpenAssessmentAttempt(subject,{assessmentId}){
    return [...attempts.values()].find((row)=>row.learnerId===subject&&row.assessmentId===assessmentId&&['started','submitted'].includes(row.status))??null;
  },
  async getAssessmentAttempt(subject,{attemptId}){
    const row=attempts.get(attemptId);
    return row?.learnerId===subject?structuredClone(row):null;
  },
  async createAssessmentAttempt(subject,{attempt,programId}){
    const profile=await this.getLearnerProfile(subject);
    const application=(await this.listApplications(subject)).find((row)=>row.programId===programId&&row.status==='active');
    const stored=structuredClone({...attempt,learnerId:subject,learnerReference:profile.learnerReference,certificateName:profile.certificateName,applicationReference:application?.applicationReference??null});
    attempts.set(attempt.id,stored);
    return structuredClone(stored);
  },
  async saveAssessmentResponses(subject,{attemptId,responses}){
    const attempt=attempts.get(attemptId);
    assert.equal(attempt.learnerId,subject);
    for(const response of responses){
      const item=attempt.items.find((row)=>row.itemId===response.itemId&&Number(row.itemVersion)===Number(response.itemVersion));
      item.response=structuredClone(response.response);
    }
    return {attemptId,saved:responses.length};
  },
  async saveAssessmentScore(subject,{attempt}){
    assert.equal(attempts.get(attempt.id)?.learnerId,subject);
    const stored=structuredClone({...attempt,learnerId:subject});
    attempts.set(attempt.id,stored);
    return structuredClone(stored);
  }
};
const credentialStore={kind:'test-persistent',async ping(){return true;},async schemaVersion(){return '2';},async getByVerificationId(){return null;}};
const authorize=(req,scope)=>{
  const token=req.headers.authorization;
  if(token!=='Bearer learner-token'&&token!=='Bearer other-token') return {ok:false,status:401,error:'authentication-required'};
  if(!['learner:read','learner:write'].includes(scope)) return {ok:false,status:403,error:'insufficient-scope'};
  return {ok:true,subject:token==='Bearer learner-token'?'learner-course1':'other-learner',scopes:['learner:read','learner:write']};
};

const server=createApiServer({env:{NODE_ENV:'production'},credentialStore,learnerStore,requiredSchemaVersion:'2',authorize,logger:()=>{}});
server.listen(0,'127.0.0.1');
await once(server,'listening');

try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const start=await fetch(`${base}/api/v1/me/courses/COURSE-LH-TECH1-001/assessment-attempts`,{
    method:'POST',headers:{authorization:'Bearer learner-token',accept:'application/json'}
  });
  assert.equal(start.status,200);
  const started=await start.json();

  let response=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}`,{
    headers:{authorization:'Bearer learner-token',accept:'application/json'}
  });
  assert.equal(response.status,200);
  let body=await response.json();
  assert.equal(body.editable,true);
  assert.equal(body.resumed,true);
  assert.equal(body.attempt.status,'started');
  assert.equal(body.learner.applicationReference,'THC-APP-TEST-001');
  assert.equal(body.items.length,36);
  let serialized=JSON.stringify(body);
  for(const forbidden of ['"correct"','"rationale"','answerKey','scoringKey']) assert.equal(serialized.includes(forbidden),false,`active status leaked ${forbidden}`);

  response=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}`,{
    headers:{authorization:'Bearer other-token'}
  });
  assert.equal(response.status,404,'another learner must not be able to read the attempt');

  const originalExpiry=attempts.get(started.attempt.id).expiresAt;
  attempts.get(started.attempt.id).expiresAt='2000-01-01T00:00:00.000Z';
  response=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}`,{
    headers:{authorization:'Bearer learner-token',accept:'application/json'}
  });
  assert.equal(response.status,200);
  body=await response.json();
  assert.equal(body.editable,false,'expired attempt must not be reported as editable');
  assert.equal(body.expired,true);
  assert.equal(body.finalizeRequired,true);
  attempts.get(started.attempt.id).expiresAt=originalExpiry;

  const bundle=loadPublishedCourseAssessment('COURSE-LH-TECH1-001');
  const byId=new Map(bundle.itemBank.map((item)=>[item.id,item]));
  const responses=started.items.map((safeItem)=>{
    const source=byId.get(safeItem.id);
    const presented=presentCourseAssessmentItem(source,{formId:started.attempt.formId,response:source.correct,randomizeChoices:bundle.assessment.randomizeChoices!==false});
    return {itemId:safeItem.id,itemVersion:safeItem.version,response:presented.response};
  });
  const save=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}/responses`,{
    method:'PUT',
    headers:{authorization:'Bearer learner-token','content-type':'application/json'},
    body:JSON.stringify({responses})
  });
  assert.equal(save.status,200);

  const submit=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}/submit`,{
    method:'POST',headers:{authorization:'Bearer learner-token'}
  });
  assert.equal(submit.status,200);

  response=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}`,{
    headers:{authorization:'Bearer learner-token'}
  });
  assert.equal(response.status,200);
  body=await response.json();
  assert.equal(body.attempt.status,'scored');
  assert.equal(body.attempt.scorePercent,100);
  assert.equal(body.attempt.passed,true);
  assert.equal(body.learner.applicationReference,'THC-APP-TEST-001');
  assert.equal(Object.hasOwn(body,'items'),false,'scored status must not return attempt items');
  serialized=JSON.stringify(body);
  for(const forbidden of ['responses','correct','rationale','answerKey','scoringKey']) assert.equal(serialized.includes(`"${forbidden}"`),false,`scored status leaked ${forbidden}`);

  const postScoreEdit=await fetch(`${base}/api/v1/me/assessment-attempts/${started.attempt.id}/responses`,{
    method:'PUT',
    headers:{authorization:'Bearer learner-token','content-type':'application/json'},
    body:JSON.stringify({responses:[responses[0]]})
  });
  assert.equal(postScoreEdit.status,409,'scored attempt must remain immutable');

  const missing=await fetch(`${base}/api/v1/me/assessment-attempts/00000000-0000-4000-8000-000000000000`,{
    headers:{authorization:'Bearer learner-token'}
  });
  assert.equal(missing.status,404);
} finally {
  server.close();
  await once(server,'close');
}

console.log('Learner assessment-attempt status, recovery, privacy and scored immutability tests passed.');
