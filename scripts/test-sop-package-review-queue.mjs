import assert from 'node:assert/strict';
import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('registry/sop-package-review-queue.json','utf8'));
assert.equal(r.packages.length,17);
assert.equal(r.summary.packageCount,17);
assert.equal(r.summary.releaseBlocked,17);
assert.equal(r.summary.independentReleaseApproved,0);
for(const p of r.packages){
 assert.equal(p.version,'0.1.0');
 assert.equal(p.authoringState,'draft-controlled-package-created');
 assert.equal(p.releaseState,'blocked');
 assert.equal(p.scientificTechnicalReview,'not-started');
 assert.equal(p.accessibilityManualReview,'not-started');
 assert.equal(p.facilityMethodValidation,'not-started');
 assert.equal(p.independentReleaseReview,'not-started');
 assert.ok(fs.existsSync(p.manifest),`${p.id}: manifest missing`);
}
console.log('SOP package review queue: PASS (17 exact-version drafts queued; release remains fail-closed).');
