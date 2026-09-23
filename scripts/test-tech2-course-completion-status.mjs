import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

for(let n=1;n<=8;n++){
  const n3=String(n).padStart(3,'0');
  const course=read(`content/courses/COURSE-LH-TECH2-${n3}.json`);
  const status=read(`registry/tech2-course${n}-completion-status.json`);
  const deployment=read(`registry/tech2-course${n}-deployment-evidence.json`);
  const release=read(`content/public-releases/PUBLIC-RELEASE-LH-TECH2-${n3}.json`);

  assert.equal(status.courseId,course.id,`Technician II Course ${n}: completion registry id mismatch`);
  assert.equal(status.canonicalCourseState,course.status,`Technician II Course ${n}: canonical state mismatch`);
  assert.equal(status.publicAcademicPackage,release.publicationState,`Technician II Course ${n}: public package state mismatch`);
  assert.equal(status.certificationEvidenceValidated,false,`Technician II Course ${n}: cannot claim validated certification evidence`);
  assert.equal(status.goldStandardPackageComplete,false,`Technician II Course ${n}: cannot claim gold-standard completion before human/evidence gates close`);
  if(status.machineResolvableWorkComplete===true){
    assert.equal((status.nextMachineActions??[]).length,0,`Technician II Course ${n}: machine completion cannot retain open machine actions`);
    assert.equal(status.deployedMachineSurfaceQa?.state,'verified',`Technician II Course ${n}: machine completion requires deployed surface QA`);
    assert.match(status.deployedMachineSurfaceQa?.sourceSha??'',/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i,`Technician II Course ${n}: machine completion requires exact deployment SHA`);
  }
  assert.equal(status.publicLessons,4,`Technician II Course ${n}: expected four public lessons`);
  assert.equal(status.publicLearningItems,n===8?16:36,`Technician II Course ${n}: public item count mismatch`);
  assert.ok(typeof status.machineCompletionBoundary==='string'&&status.machineCompletionBoundary.length>180,`Technician II Course ${n}: missing substantive completion boundary`);
  assert.ok(Array.isArray(status.evidence)&&status.evidence.length>=6,`Technician II Course ${n}: incomplete machine evidence list`);
  for(const rel of status.evidence) assert.ok(fs.existsSync(path.join(root,rel)),`Technician II Course ${n}: evidence path missing: ${rel}`);
  assert.ok(Array.isArray(status.nextMachineActions),`Technician II Course ${n}: machine work queue missing`);
  if(status.machineResolvableWorkComplete!==true) assert.ok(status.nextMachineActions.length>0,`Technician II Course ${n}: incomplete course must list remaining machine work`);
  if(status.deploymentIdentity?.state==='verified' && status.deployedMachineSurfaceQa?.state==='verified'){
    assert.ok(!(status.nextMachineActions??[]).some(action=>/deployed responsive\/manual|defects exposed by deployed QA/i.test(String(action))),`Technician II Course ${n}: cannot retain resolved deployed-QA actions`);
    assert.doesNotMatch(status.machineCompletionBoundary,/exact deployment build\/source SHA verification/i,`Technician II Course ${n}: boundary cannot list verified deployment identity as unfinished`);
    assert.match(status.machineCompletionBoundary,/deployment build\/source identity and machine learner-surface QA are verified/i,`Technician II Course ${n}: boundary must record verified deployment state`);
  }
  assert.ok(Array.isArray(status.nextHumanActions)&&status.nextHumanActions.length>=8,`Technician II Course ${n}: human/evidence gate list incomplete`);
  assert.equal(status.visualLayer?.primaryConcepts,n===8?8:4,`Technician II Course ${n}: primary visual concept count mismatch`);
  assert.equal(status.visualLayer?.reviewCandidates,status.visualLayer?.primaryConcepts,`Technician II Course ${n}: all primary visuals should be built as review candidates`);
  assert.equal(status.visualLayer?.plannedOnly,0,`Technician II Course ${n}: no primary visual should remain plan-only`);
  assert.equal(status.visualLayer?.approvedForLearnerRender,status.visualLayer?.primaryConcepts,`Technician II Course ${n}: all governed WebP primary visuals are owner-approved for learner render`);
  assert.equal(status.visualLayer?.rasterReplacementsRequired,0,`Technician II Course ${n}: no primary raster replacement should remain required`);
  assert.equal(status.visualLayer?.rasterReplacementsReleased,status.visualLayer?.primaryConcepts,`Technician II Course ${n}: released raster count mismatch`);
  assert.equal(status.visualLayer?.rasterCandidateReleaseApproved,status.visualLayer?.primaryConcepts,`Technician II Course ${n}: raster approval count mismatch`);
  assert.ok(fs.existsSync(path.join(root,status.visualLayer.registry)),`Technician II Course ${n}: visual registry missing`);
  assert.ok(fs.existsSync(path.join(root,status.visualLayer.reviewWorklist)),`Technician II Course ${n}: visual review worklist missing`);

  assert.equal(deployment.courseId,course.id,`Technician II Course ${n}: deployment evidence id mismatch`);
  assert.equal(deployment.publicRouteReadbackVerified,true);
  assert.equal(deployment.representativeLessonReadbackVerified,true);
  assert.equal(deployment.representativeAssessmentReadbackVerified,true);
  assert.equal(deployment.trainingCredentialBoundaryObserved,true);
  assert.equal(deployment.responsiveManualQaApproved,false,`Technician II Course ${n}: manual responsive/accessibility QA must not be fabricated`);
  const identityRecorded = deployment.exactDeploymentBuildId !== null || deployment.exactDeploymentSourceSha !== null;
  if (identityRecorded) {
    assert.match(deployment.exactDeploymentBuildId ?? '', /^[A-Za-z0-9._:@/-]{1,160}$/, `Technician II Course ${n}: build id must be controlled text`);
    assert.match(deployment.exactDeploymentSourceSha ?? '', /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i, `Technician II Course ${n}: source SHA must be full length`);
    assert.match(deployment.evidenceState ?? '', /build-identity-verified/, `Technician II Course ${n}: evidence state must record verified identity`);
    assert.equal(deployment.curriculumSourceShaPinnedByDeployment, true, `Technician II Course ${n}: exact deployment identity must record pinned curriculum SHA`);
    assert.equal(deployment.curriculumSource, `dtfgenetics/Thc-learning-courses-@${deployment.exactDeploymentSourceSha}`, `Technician II Course ${n}: curriculum source must match exact deployment source SHA`);
  } else {
    assert.equal(deployment.exactDeploymentBuildId,null,`Technician II Course ${n}: build id must remain null until verified`);
    assert.equal(deployment.exactDeploymentSourceSha,null,`Technician II Course ${n}: source SHA must remain null until verified`);
  }
}
console.log('Technician II Courses 1-8 completion/deployment evidence boundary: PASS');
