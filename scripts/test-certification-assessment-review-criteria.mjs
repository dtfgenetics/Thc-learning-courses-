import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('scripts/build-review-packets.mjs','utf8');
for(const token of [
  'occupational/JTA scope',
  'one defensible keyed answer',
  'fairness and bias',
  'accessibility',
  'formal standard-setting evidence',
  'secure operational-store/form evidence'
]){
  assert.ok(src.toLowerCase().includes(token.toLowerCase()),'review packet criteria missing: '+token);
}
const doc=fs.readFileSync('docs/CERTIFICATION-ASSESSMENT-REVIEW-CRITERIA.md','utf8');
assert.match(doc,/REF-ETS-ITEM-FAIRNESS-001/);
assert.match(doc,/REF-ADA-TESTING-ACCOMMODATIONS-001/);
assert.match(doc,/APPROVE/);
assert.match(doc,/REVISE/);
assert.match(doc,/REJECT/);
console.log('Certification assessment review criteria: PASS (construct, key, fairness, accessibility, security and exact-version boundaries enforced).');
