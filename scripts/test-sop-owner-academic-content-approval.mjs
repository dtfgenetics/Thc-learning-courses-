import assert from 'node:assert/strict';
import fs from 'node:fs';
const a=JSON.parse(fs.readFileSync('registry/sop-owner-academic-content-approval.json','utf8'));
const q=JSON.parse(fs.readFileSync('registry/sop-package-review-queue.json','utf8'));
assert.equal(a.packages.length,17);
assert.equal(q.summary.ownerAcademicContentApproved,17);
for(const p of a.packages){
  assert.equal(p.contentState,'owner-approved-for-source-backed-academic-development');
  assert.equal(p.operationalReleaseState,'blocked');
  assert.ok(fs.existsSync(p.manifest),`${p.id}: manifest missing`);
}
for(const p of q.packages){
  assert.equal(p.ownerAcademicContentApproval,'approved-for-source-backed-academic-development');
  assert.equal(p.releaseState,'blocked');
  assert.equal(p.independentReleaseReview,'not-started');
}
assert.ok(a.notAuthorizedByThisApproval.some(x=>/pilot/i.test(x)));
assert.ok(a.notAuthorizedByThisApproval.some(x=>/WCAG/i.test(x)));
assert.ok(a.notAuthorizedByThisApproval.some(x=>/credential issuance/i.test(x)));
console.log('SOP owner academic-content approval: PASS (17/17 accepted for source-backed academic development; operational/certification validation remains separate).');
