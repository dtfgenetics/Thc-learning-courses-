import assert from 'node:assert/strict';
import fs from 'node:fs';

const p=JSON.parse(fs.readFileSync('registry/candidate-privacy-legal-review-preparation.json','utf8'));
const c=JSON.parse(fs.readFileSync('registry/candidate-governance-controls.json','utf8'));
assert.equal(p.controlsId,c.id);
assert.equal(String(p.controlsVersion),String(c.version));
assert.equal(p.reviewAreas.length,9);
assert.equal(c.operationalUseAuthorized,false);
assert.equal(c.controls.privacyRetention.retentionScheduleApproved,false);
assert.equal(p.approvalRecordRequired.privacyLegal,true);
assert.equal(p.approvalRecordRequired.retentionScheduleApproved,true);
assert.equal(p.approvalRecordRequired.operationalUseAuthorizedOnlyAfterApproval,true);
assert.match(p.boundary,/does not provide legal advice or legal approval/i);
for(const area of p.reviewAreas){
  assert.ok(area.questions.length>=3,area.id+': insufficient review questions');
  assert.ok(area.requiredEvidence.length>=3,area.id+': insufficient evidence requirements');
}
console.log('Candidate privacy/legal review preparation: PASS (9 review areas prepared; privacy/legal approval and operational use remain fail-closed).');
