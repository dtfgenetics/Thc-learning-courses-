import assert from 'node:assert/strict';
import fs from 'node:fs';

const r=JSON.parse(fs.readFileSync('registry/tech2-assessor-calibration-packets.json','utf8'));
assert.equal(r.assessments.length,8);
for(const row of r.assessments){
  assert.ok(fs.existsSync(row.source),row.assessmentId+': source missing');
  assert.ok(fs.existsSync(row.packet),row.assessmentId+': packet missing');
  const src=JSON.parse(fs.readFileSync(row.source,'utf8'));
  assert.equal(String(src.version),String(row.assessmentVersion),row.assessmentId+': packet registry version drift');
  const packet=fs.readFileSync(row.packet,'utf8');
  assert.ok(packet.includes('Exact version:** `'+row.assessmentVersion+'`'),row.assessmentId+': exact version missing from packet');
  assert.match(packet,/critical-failure/i,row.assessmentId+': critical-failure calibration rule missing');
  assert.match(packet,/NOT COMPLETE — EVIDENCE PENDING/,row.assessmentId+': packet must remain fail-closed');
}
console.log('Technician II assessor calibration packets: PASS (8/8 exact-version packets prepared; paired-scoring evidence still required).');
