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
  assert.equal(status.machineResolvableWorkComplete,false,`Technician II Course ${n}: machine completion remains open until runtime/deployment/manual QA is reconciled`);
  assert.equal(status.publicLessons,4,`Technician II Course ${n}: expected four public lessons`);
  assert.equal(status.publicLearningItems,n===8?16:36,`Technician II Course ${n}: public item count mismatch`);
  assert.ok(typeof status.machineCompletionBoundary==='string'&&status.machineCompletionBoundary.length>180,`Technician II Course ${n}: missing substantive completion boundary`);
  assert.ok(Array.isArray(status.evidence)&&status.evidence.length>=6,`Technician II Course ${n}: incomplete machine evidence list`);
  for(const rel of status.evidence) assert.ok(fs.existsSync(path.join(root,rel)),`Technician II Course ${n}: evidence path missing: ${rel}`);
  assert.ok(Array.isArray(status.nextMachineActions)&&status.nextMachineActions.length>=4,`Technician II Course ${n}: machine work list incomplete`);
  assert.ok(Array.isArray(status.nextHumanActions)&&status.nextHumanActions.length>=8,`Technician II Course ${n}: human/evidence gate list incomplete`);

  assert.equal(deployment.courseId,course.id,`Technician II Course ${n}: deployment evidence id mismatch`);
  assert.equal(deployment.publicRouteReadbackVerified,true);
  assert.equal(deployment.representativeLessonReadbackVerified,true);
  assert.equal(deployment.representativeAssessmentReadbackVerified,true);
  assert.equal(deployment.trainingCredentialBoundaryObserved,true);
  assert.equal(deployment.responsiveManualQaApproved,false,`Technician II Course ${n}: manual responsive/accessibility QA must not be fabricated`);
  assert.equal(deployment.exactDeploymentBuildId,null,`Technician II Course ${n}: build id must remain null until verified`);
  assert.equal(deployment.exactDeploymentSourceSha,null,`Technician II Course ${n}: source SHA must remain null until verified`);
}
console.log('Technician II Courses 1-8 completion/deployment evidence boundary: PASS');
