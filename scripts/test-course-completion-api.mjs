import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';
import { loadCourseAcademicCompletionBundle, evaluateCourseAcademicCompletion } from '../apps/api/src/course-enrollment-completion-service.mjs';

const COURSE_ID='COURSE-LH-TECH1-001';
const bundle=loadCourseAcademicCompletionBundle(COURSE_ID);
assert.ok(bundle,'Course 1 completion bundle must resolve');
assert.equal(bundle.modules.length,6);
assert.equal(bundle.lessons.length,18);

const firstModule=bundle.modules[0];
const partialLessonIds=(firstModule.lessons??[]).slice(0,2);
let progress=partialLessonIds.map((lessonId,index)=>({
  lessonId,
  lessonVersion:'1.0.0',
  status:'completed',
  completedAt:`2026-09-0${index+1}T12:00:00.000Z`
}));
let academic=evaluateCourseAcademicCompletion({bundle,progress,evidence:{}});
assert.equal(academic.complete,false);
assert.equal(academic.instruction.complete,false);
assert.equal(academic.instruction.modules.length,6);
assert.equal(academic.instruction.modules[0].completedLessonCount,2);
assert.equal(academic.instruction.modules[0].complete,false);
assert.equal(academic.instruction.modules[0].completionPercent,67);
assert.equal(academic.instruction.modules.slice(1).every((row)=>row.completedLessonCount===0),true);
assert.deepEqual(academic.missingRequirements,['instruction','course-final','course-practical']);

progress=bundle.lessons.map((lesson,index)=>({
  lessonId:lesson.id,
  lessonVersion:String(lesson.version),
  status:'completed',
  completedAt:`2026-09-${String((index%28)+1).padStart(2,'0')}T12:00:00.000Z`
}));
const evidence={
  assessmentAttempts:[{
    assessmentId:bundle.assessment.id,
    assessmentVersion:String(bundle.assessment.version),
    status:'scored',
    passed:true,
    scorePercent:90,
    scoredAt:'2026-09-20T12:00:00.000Z'
  }],
  performanceAssessment:{
    assessmentId:bundle.performanceAssessmentId,
    status:'passed',
    scorePercent:92,
    criticalErrorCount:0,
    evaluatedAt:'2026-09-21T12:00:00.000Z'
  }
};
academic=evaluateCourseAcademicCompletion({bundle,progress,evidence});
assert.equal(academic.complete,true);
assert.equal(academic.instruction.complete,true);
assert.equal(academic.instruction.completionPercent,100);
assert.equal(academic.instruction.modules.every((row)=>row.complete===true),true);
assert.equal(academic.snapshot.completedModuleCount,6);
assert.equal(academic.snapshot.requiredModuleCount,6);

const course2Bundle=loadCourseAcademicCompletionBundle('COURSE-LH-TECH1-002');
assert.ok(course2Bundle,'Technician I Course 2 completion bundle must resolve');
assert.deepEqual(course2Bundle.completionModuleIds,['MOD-LH-TECH1-002-OBSERVATION'],'Course 2 academic completion must use its dedicated certification teaching module rather than draft development dependencies');
assert.equal(course2Bundle.modules.length,1);
assert.equal(course2Bundle.lessons.length,4);
assert.equal(course2Bundle.performanceAssessmentId,null,'credential practical mapping must not be treated as an academic-practical requirement');
const course2Progress=course2Bundle.lessons.map((lesson,index)=>({
  lessonId:lesson.id,
  lessonVersion:String(lesson.version),
  status:'completed',
  completedAt:`2026-09-${String((index%28)+1).padStart(2,'0')}T10:00:00.000Z`
}));
const course2Evidence={
  assessmentAttempts:[{
    assessmentId:course2Bundle.assessment.id,
    assessmentVersion:String(course2Bundle.assessment.version),
    status:'scored',
    passed:true,
    scorePercent:88,
    scoredAt:'2026-09-24T10:00:00.000Z'
  }]
};
const course2Academic=evaluateCourseAcademicCompletion({bundle:course2Bundle,progress:course2Progress,evidence:course2Evidence});
assert.equal(course2Academic.complete,true,'published academic courses without a linked academic practical must be completable with instruction plus final');
assert.deepEqual(course2Academic.missingRequirements,[]);
assert.equal(course2Academic.snapshot.performanceAssessmentStatus,'not-required');

const credentialStore={
  kind:'test-persistent',
  async ping(){return true;},
  async schemaVersion(){return '2';},
  async getByVerificationId(){return null;}
};
const learnerStore={
  kind:'test-course-completion',
  async listProgress(subject){assert.equal(subject,'learner-001'); return structuredClone(progress);},
  async listCourseEvidence(subject,{assessmentId,performanceAssessmentId}){
    assert.equal(subject,'learner-001');
    assert.equal(assessmentId,bundle.assessment.id);
    assert.equal(performanceAssessmentId,bundle.performanceAssessmentId);
    return structuredClone(evidence);
  }
};
const authorize=(req,scope)=>{
  if(req.headers.authorization!=='Bearer learner-token') return {ok:false,status:401,error:'authentication-required'};
  if(scope!=='learner:read') return {ok:false,status:403,error:'insufficient-scope'};
  return {ok:true,subject:'learner-001',scopes:['learner:read']};
};

const server=createApiServer({
  env:{NODE_ENV:'production'},
  credentialStore,
  learnerStore,
  requiredSchemaVersion:'2',
  authorize,
  logger:()=>{}
});
server.listen(0,'127.0.0.1');
await once(server,'listening');

try{
  const base=`http://127.0.0.1:${server.address().port}`;
  let response=await fetch(`${base}/api/v1/me/courses/${COURSE_ID}/completion`);
  assert.equal(response.status,401);

  response=await fetch(`${base}/api/v1/me/courses/${COURSE_ID}/completion`,{
    headers:{authorization:'Bearer learner-token',accept:'application/json'}
  });
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.course.id,COURSE_ID);
  assert.equal(body.complete,true);
  assert.equal(body.instruction.complete,true);
  assert.equal(body.instruction.completionPercent,100);
  assert.equal(body.instruction.modules.length,6);
  assert.equal(body.finalAssessment.status,'passed');
  assert.equal(body.performanceAssessment.status,'passed');
  assert.deepEqual(body.missingRequirements,[]);
  assert.equal(body.completionRecordedAt,'2026-09-21T12:00:00.000Z');
  const serialized=JSON.stringify(body);
  assert.equal(serialized.includes('credential'),false,'academic course completion must not imply credential issuance');

  response=await fetch(`${base}/api/v1/me/courses/COURSE-NOT-REAL/completion`,{
    headers:{authorization:'Bearer learner-token'}
  });
  assert.equal(response.status,404);
} finally {
  server.close();
  await once(server,'close');
}

console.log('Authoritative lesson/module/course completion projection and API tests passed, including courses with and without a linked academic practical.');
