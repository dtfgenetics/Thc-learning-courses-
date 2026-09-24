import assert from 'node:assert/strict';
import fs from 'node:fs';

const r=JSON.parse(fs.readFileSync('registry/certification-validation-execution-readiness.json','utf8'));
assert.equal(r.summary.waves,7);
assert.equal(r.summary.wavesPrepared,7);
assert.equal(r.summary.humanOrFieldEvidenceComplete,0);
assert.equal(r.summary.wavesApproved,0);
assert.equal(r.summary.productionControls,13);
assert.equal(r.summary.productionControlsApproved,0);
assert.equal(r.summary.candidateGovernanceOperationallyAuthorized,false);
assert.equal(r.waves.length,7);
for(const wave of r.waves){
  assert.equal(wave.preparationState,'ready');
  assert.ok(wave.nextExecution);
  assert.ok(Array.isArray(wave.evidence) && wave.evidence.length>0);
  for(const p of wave.evidence) assert.ok(fs.existsSync(p),wave.name+': missing evidence/preparation artifact '+p);
}
assert.equal(r.waves.find(x=>x.wave===6).evidenceState,'blocked-until-prerequisites');
assert.equal(r.waves.find(x=>x.wave===7).evidenceState,'blocked-until-prerequisites');
console.log('Certification validation execution readiness: PASS (7/7 waves prepared; real evidence and approvals remain fail-closed).');
