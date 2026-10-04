import assert from 'node:assert/strict';
import {
  startSecureCredentialAssessment,
  getSecureCredentialAssessmentStatus,
  saveSecureCredentialAssessmentResponses,
  submitSecureCredentialAssessment
} from '../apps/api/src/secure-credential-assessment-service.mjs';

const credential={
  id:'CRED-TEST-SECURE-001',
  credentialProgram:'CREDPROG-TEST-SECURE-001',
  governance:{releaseApprovalStatus:'approved'},
  extensions:{operationalUseAuthorized:true}
};
const program={
  id:'CREDPROG-TEST-SECURE-001',
  assessmentModel:{credentialAssessment:'ASSESS-CRED-TEST-SECURE-001'}
};
const assessment={
  id:'ASSESS-CRED-TEST-SECURE-001',
  title:'Secure Credential Test',
  version:'2.0.0',
  purpose:'credential',
  totalItems:2,
  passingScorePercent:50,
  timeLimitMinutes:60,
  maxAttempts:2,
  cooldownHours:0,
  competencies:['COMP-A','COMP-B'],
  extensions:{operationalUseAuthorized:true,configuredScoreIsProvisional:false,blueprintWeightsStatus:'finalized'}
};
const privateItems=[
  {secureItemId:'SECITEM-TEST-A-001',revision:'1',status:'approved-operational',sourceClass:'private-operational',competency:'COMP-A',prompt:'Private A?',choices:['a','b'],scoringKey:1,presentation:{mode:'single-select'}},
  {secureItemId:'SECITEM-TEST-B-001',revision:'1',status:'approved-operational',sourceClass:'private-operational',competency:'COMP-B',prompt:'Private B?',choices:['x','y'],scoringKey:0,presentation:{mode:'single-select'}}
];
const forms=[], exposures=[];
const secureAssessmentStore={
  kind:'private-operational-assessment-store',
  async selectOperationalItems(){return structuredClone(privateItems);},
  async getOperationalItems({assignments}){
    return assignments.map((a)=>{
      const item=privateItems.find((x)=>x.secureItemId===a.secureItemId&&Number(x.revision)===Number(a.revision));
      if(!item) throw new Error('missing private item');
      return structuredClone(item);
    });
  },
  async recordForm(x){forms.push(structuredClone(x));},
  async recordExposure(x){exposures.push(structuredClone(x));}
};
const attempts=new Map();
const learnerStore={
  async findOpenAssessmentAttempt(subject,{assessmentId}){
    return [...attempts.values()].find((x)=>x.learnerId===subject&&x.assessmentId===assessmentId&&x.status==='started')??null;
  },
  async getLearnerProfile(){return {learnerReference:'THC-LRN-TEST-001',certificateName:'Test Learner'};},
  async listApplications(){return [{applicationReference:'THC-APP-TEST-001',programId:program.id,status:'active'}];},
  async listCourseEvidence(subject,{assessmentId}){
    return {assessmentAttempts:[...attempts.values()].filter((x)=>x.learnerId===subject&&x.assessmentId===assessmentId)};
  },
  async createAssessmentAttempt(subject,{attempt}){
    const stored={...structuredClone(attempt),learnerId:subject,learnerReference:'THC-LRN-TEST-001',applicationReference:'THC-APP-TEST-001'};
    attempts.set(stored.id,stored);
    return structuredClone(stored);
  },
  async getAssessmentAttempt(subject,{attemptId}){
    const x=attempts.get(attemptId);
    return x?.learnerId===subject?structuredClone(x):null;
  },
  async saveAssessmentResponses(subject,{attemptId,responses}){
    const x=attempts.get(attemptId);
    assert.equal(x.learnerId,subject);
    for(const r of responses){
      const row=x.items.find((i)=>i.itemId===r.itemId&&Number(i.itemVersion)===Number(r.itemVersion));
      row.response=structuredClone(r.response);
    }
    return {attemptId,saved:responses.length};
  },
  async saveAssessmentScore(subject,{attempt}){
    assert.equal(attempts.get(attempt.id).learnerId,subject);
    const saved={...structuredClone(attempt),learnerId:subject};
    attempts.set(saved.id,saved);
    return structuredClone(saved);
  }
};

const blocked=await startSecureCredentialAssessment({
  learnerStore,secureAssessmentStore,subject:'learner-1',
  credential:{...credential,governance:{releaseApprovalStatus:'not-requested'}},program,assessment
});
assert.equal(blocked.status,409);
assert.equal(blocked.body.error,'credential-assessment-not-authorized');

const started=await startSecureCredentialAssessment({learnerStore,secureAssessmentStore,subject:'learner-1',credential,program,assessment,now:'2026-10-04T03:00:00.000Z'});
assert.equal(started.status,201);
assert.equal(started.body.items.length,2);
assert.equal(forms.length,1);
assert.equal(exposures.length,1);
assert.equal(exposures[0].candidateRef,'THC-LRN-TEST-001');
assert.ok(!JSON.stringify(started.body).includes('scoringKey'));
assert.ok(!JSON.stringify(started.body).includes('rationale'));

const attemptId=started.body.attempt.id;
const status=await getSecureCredentialAssessmentStatus({learnerStore,secureAssessmentStore,subject:'learner-1',attemptId,assessment});
assert.equal(status.status,200);
assert.equal(status.body.editable,true);
assert.ok(!JSON.stringify(status.body).includes('scoringKey'));

const resumed=await startSecureCredentialAssessment({learnerStore,secureAssessmentStore,subject:'learner-1',credential,program,assessment,now:'2026-10-04T03:05:00.000Z'});
assert.equal(resumed.status,200);
assert.equal(resumed.body.resumed,true);
assert.equal(resumed.body.attempt.id,attemptId);
assert.equal(forms.length,1,'resume must not create another private form');
assert.equal(exposures.length,1,'resume must not double-count exposure');

const saved=await saveSecureCredentialAssessmentResponses({
  learnerStore,secureAssessmentStore,subject:'learner-1',attemptId,
  responses:[
    {itemId:'SECITEM-TEST-A-001',itemVersion:1,response:1},
    {itemId:'SECITEM-TEST-B-001',itemVersion:1,response:1}
  ],
  now:'2026-10-04T03:10:00.000Z'
});
assert.equal(saved.status,200);
assert.equal(saved.body.saved,2);

const submitted=await submitSecureCredentialAssessment({
  learnerStore,secureAssessmentStore,subject:'learner-1',attemptId,assessment,now:'2026-10-04T03:11:00.000Z'
});
assert.equal(submitted.status,200);
assert.equal(submitted.body.attempt.scorePercent,50);
assert.equal(submitted.body.attempt.passed,true);
assert.ok(!JSON.stringify(submitted.body).includes('scoringKey'));

const scored=attempts.get(attemptId);
assert.equal(scored.status,'scored');
assert.equal(scored.scorePercent,50);
assert.equal(scored.items[0].score,1);
assert.equal(scored.items[1].score,0);

const after=await getSecureCredentialAssessmentStatus({learnerStore,secureAssessmentStore,subject:'learner-1',attemptId,assessment});
assert.equal(after.body.attempt.status,'scored');
assert.equal(after.body.editable,false);
assert.equal(after.body.attempt.passed,true);

console.log('Secure credential assessment lifecycle: PASS');
