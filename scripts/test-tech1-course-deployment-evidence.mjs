import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

for(let n=2;n<=7;n++){
  const status=read(`registry/course${n}-completion-status.json`);
  const evidence=read(`registry/course${n}-deployment-evidence.json`);
  assert.equal(evidence.courseId,status.courseId,`Course ${n} deployment evidence id mismatch`);
  assert.equal(evidence.publicRouteReadbackVerified,true,`Course ${n} public route readback must be verified`);
  assert.equal(evidence.representativeLessonReadbackVerified,true,`Course ${n} representative lesson readback must be verified`);
  assert.equal(evidence.representativeAssessmentReadbackVerified,true,`Course ${n} representative assessment readback must be verified`);
  assert.equal(evidence.trainingCredentialBoundaryObserved,true,`Course ${n} public page must preserve the training/credential boundary`);
  assert.equal(evidence.responsiveManualQaApproved,false,`Course ${n} must not falsely claim manual responsive QA approval`);
  assert.equal(evidence.exactDeploymentBuildId,null,`Course ${n} build id must remain null until actually verified`);
  assert.equal(evidence.exactDeploymentSourceSha,null,`Course ${n} source SHA must remain null until actually verified`);
  for(const key of ['courseUrl','representativeLessonUrl','representativeAssessmentUrl']){
    assert.match(evidence[key]??'',/^https:\/\/dtfseeds\.com\//,`Course ${n} ${key} must use the public dtfseeds.com route`);
  }
}
console.log('Technician I Courses 2-7 deployment evidence boundary: PASS');
