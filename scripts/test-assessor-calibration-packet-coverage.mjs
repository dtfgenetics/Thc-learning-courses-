import assert from 'node:assert/strict';
import fs from 'node:fs';

const r=JSON.parse(fs.readFileSync('registry/assessor-calibration-packet-coverage.json','utf8'));
assert.equal(r.summary.total,15);
assert.equal(r.summary.technicianI,7);
assert.equal(r.summary.technicianII,8);
assert.equal(r.summary.evidenceComplete,0);
for(const row of r.assessments){
  assert.ok(fs.existsSync(row.source),row.assessmentId+': source missing');
  assert.ok(fs.existsSync(row.packet),row.assessmentId+': packet missing');
  const src=JSON.parse(fs.readFileSync(row.source,'utf8'));
  assert.equal(String(src.version),String(row.assessmentVersion),row.assessmentId+': assessment version drift');
  const packet=fs.readFileSync(row.packet,'utf8');
  assert.ok(packet.includes('Exact version:** `'+row.assessmentVersion+'`'),row.assessmentId+': packet version mismatch');
  assert.match(packet,/critical-failure/i,row.assessmentId+': critical-failure calibration rule missing');
  assert.match(packet,/NOT COMPLETE — EVIDENCE PENDING/,row.assessmentId+': packet must remain fail-closed');
}
console.log('Assessor calibration packet coverage: PASS (15/15 exact-version practical/capstone packets prepared; paired-scoring evidence pending).');
