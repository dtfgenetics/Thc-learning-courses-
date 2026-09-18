import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

for (let n=2;n<=7;n++) {
  const status=read(`registry/course${n}-completion-status.json`);
  const course=read(`content/courses/COURSE-LH-TECH1-00${n}.json`);
  assert.equal(status.courseId,course.id,`Course ${n} completion registry id mismatch`);
  assert.equal(status.academicPublication,course.status,`Course ${n} publication state must match canonical course status`);
  assert.equal(status.certificationEvidenceValidated,false,`Course ${n} must not claim validated certification evidence before real approval`);
  assert.equal(status.goldStandardPackageComplete,false,`Course ${n} must not claim gold-standard completion before human/evidence gates close`);
  assert.ok(typeof status.machineCompletionBoundary==='string' && status.machineCompletionBoundary.length>120,`Course ${n} needs a substantive machine-completion boundary`);
  assert.ok(Array.isArray(status.evidence) && status.evidence.length>=3,`Course ${n} needs machine evidence paths`);
  for (const rel of status.evidence) assert.ok(fs.existsSync(path.join(root,rel)),`Course ${n} completion evidence missing: ${rel}`);
  assert.ok(Array.isArray(status.nextMachineActions) && status.nextMachineActions.length>0,`Course ${n} needs next machine actions`);
  assert.ok(Array.isArray(status.nextHumanActions) && status.nextHumanActions.length>0,`Course ${n} needs explicit human/evidence gates`);
}
console.log('Technician I Course 2-7 fail-closed completion registries: PASS');
