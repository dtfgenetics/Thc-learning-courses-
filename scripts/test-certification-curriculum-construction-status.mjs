import assert from 'node:assert/strict';
import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('registry/certification-curriculum-construction-status.json','utf8'));
assert.equal(r.summary.totalCourses,15);
assert.equal(r.summary.machineConstructionComplete,15);
assert.equal(r.summary.constructionLayerComplete,true);
assert.equal(r.summary.certificationEvidenceValidated,0);
for(const c of r.courses){
  const s=JSON.parse(fs.readFileSync(c.statusFile,'utf8'));
  assert.equal(s.courseId,c.courseId);
  assert.equal(s.version,c.version);
  assert.equal(s.machineResolvableWorkComplete,true,`${c.courseId}: course ledger no longer reports machine completion`);
}
console.log('Certification curriculum construction status: PASS (15/15 dedicated course construction ledgers machine-complete; credential validation remains separate).');
