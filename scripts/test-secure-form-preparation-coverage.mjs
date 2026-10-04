import assert from 'node:assert/strict';
import fs from 'node:fs';

const r=JSON.parse(fs.readFileSync('registry/secure-form-preparation-coverage.json','utf8'));
assert.equal(r.summary.conventionalFinalCourses,13);
assert.equal(r.summary.integratedPerformanceNotApplicable,2);
assert.equal(r.summary.secureFormEvidenceApproved,0);
for(const row of r.courses){
  const c=JSON.parse(fs.readFileSync('content/courses/'+row.courseId+'.json','utf8'));
  const a=JSON.parse(fs.readFileSync('content/assessments/'+row.assessmentId+'.json','utf8'));
  assert.equal(String(c.version),String(row.courseVersion),row.courseId+': course version drift');
  assert.equal(String(a.version),String(row.assessmentVersion),row.courseId+': assessment version drift');
  assert.equal(row.intakeScript,'scripts/create-secure-form-equivalence-record.mjs');
  assert.equal(row.approvalScript,'scripts/approve-secure-form-equivalence.mjs');
  assert.equal(row.executionState,'prepared-prerequisites-pending');
}
assert.match(r.privacyBoundary,/remain outside this repository/i);
assert.match(r.boundary,/does not approve forms/i);
console.log('Secure-form preparation coverage: PASS (13/13 conventional finals exact-version prepared; secure content remains private; evidence approval pending).');
