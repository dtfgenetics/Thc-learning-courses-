import assert from 'node:assert/strict';
import fs from 'node:fs';

const r=JSON.parse(fs.readFileSync('registry/standard-setting-preparation-coverage.json','utf8'));
assert.equal(r.summary.courses,15);
assert.equal(r.summary.conventionalFinals,13);
assert.equal(r.summary.integratedPerformance,2);
assert.equal(r.summary.evidenceComplete,0);
assert.equal(r.summary.approved,0);
for(const row of r.courses){
  const course=JSON.parse(fs.readFileSync('content/courses/'+row.courseId+'.json','utf8'));
  assert.equal(String(course.version),String(row.courseVersion),row.courseId+': course version drift');
  if(row.standardSettingType==='conventional-final'){
    assert.ok(row.assessmentId,row.courseId+': final assessment missing');
    const a=JSON.parse(fs.readFileSync('content/assessments/'+row.assessmentId+'.json','utf8'));
    assert.equal(String(a.version),String(row.assessmentVersion),row.courseId+': final assessment version drift');
    assert.equal(row.intakeScript,'scripts/create-standard-setting-evidence-record.mjs');
  }else{
    assert.equal(row.standardSettingType,'integrated-performance');
    assert.equal(row.intakeScript,'scripts/create-integrated-performance-standard-setting-record.mjs');
  }
  assert.equal(row.executionState,'prepared-prerequisites-pending');
}
assert.match(r.boundary,/development thresholds remain provisional/i);
console.log('Standard-setting preparation coverage: PASS (13 conventional + 2 integrated paths exact-version prepared; no passing standard fabricated).');
