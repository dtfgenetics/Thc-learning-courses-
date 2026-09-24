import assert from 'node:assert/strict';
import fs from 'node:fs';
const q=JSON.parse(fs.readFileSync('registry/sop-package-review-queue.json','utf8'));
assert.equal(q.packages.length,17);
assert.equal(q.summary.scientificTechnicalReviewPacketsPrepared,17);
assert.equal(q.summary.facilityValidationPlansPrepared,17);
for(const p of q.packages){
  assert.ok(fs.existsSync(p.scientificTechnicalReviewPacket),`${p.id}: scientific review packet missing`);
  assert.ok(fs.existsSync(p.facilityMethodValidationPlan),`${p.id}: facility validation plan missing`);
  const s=fs.readFileSync(p.scientificTechnicalReviewPacket,'utf8');
  const v=fs.readFileSync(p.facilityMethodValidationPlan,'utf8');
  assert.match(s,/Claim-by-claim review/);
  assert.match(s,/NOT APPROVED — REVIEW PENDING/);
  assert.match(v,/Failure \/ stop conditions/);
  assert.match(v,/NOT VALIDATED — EXECUTION PENDING/);
  assert.equal(p.scientificTechnicalReview,'not-started');
  assert.equal(p.facilityMethodValidation,'not-started');
  assert.equal(p.releaseState,'blocked');
}
console.log('SOP review/validation preparation: PASS (17/17 scientific review packets and validation plans prepared; execution remains open).');
