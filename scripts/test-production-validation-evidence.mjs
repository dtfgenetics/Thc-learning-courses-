import assert from 'node:assert/strict';
import fs from 'node:fs';
const readiness=JSON.parse(fs.readFileSync('registry/system-readiness.json','utf8'));
const contract=JSON.parse(fs.readFileSync('registry/production-validation-evidence.json','utf8'));
assert.equal(contract.status,'evidence-pending');
assert.ok(contract.controls.length>=12);
const ids=new Set();
for(const control of contract.controls){
  assert.ok(!ids.has(control.id),`duplicate control ${control.id}`); ids.add(control.id);
  assert.equal(control.status,'pending',`${control.id}: status must remain pending without real evidence`);
  assert.ok(control.requiredEvidence.length>=4,`${control.id}: insufficient evidence definition`);
  assert.deepEqual(control.evidenceRefs,[],`${control.id}: do not invent deployment evidence refs`);
  for(const [area,gate] of control.readiness){
    assert.equal(readiness.areas?.[area]?.gates?.[gate],false,`${area}.${gate} must remain false while ${control.id} evidence is pending`);
  }
}
for(const id of ['production-postgres','admin-mfa','row-level-authorization','practical-submission-workflow','backup-restore','monitoring-alerting','credential-signing','revocation-persistence']) assert.ok(ids.has(id),id);
assert.match(contract.advancementRule,/real deployment-backed evidence/i);
assert.ok(contract.prohibitedEvidence.some((x)=>/green CI alone/i.test(x)));
console.log('Production validation evidence contract passed.');
