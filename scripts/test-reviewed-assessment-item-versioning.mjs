import assert from 'node:assert/strict';
import {
  substantiveItemChanged,
  hasApprovedAssessmentReview,
  isVersionAdvanced,
  evaluateReviewedItemChange
} from './check-reviewed-assessment-item-versioning.mjs';

const base = {
  id: 'ITEM-TEST-001',
  version: 1,
  status: 'draft',
  purpose: 'summative',
  competency: 'COMP-TEST-001',
  objective: 'LO-TEST-001',
  bloomLevel: 'apply',
  difficulty: 'moderate',
  type: 'multiple-choice',
  stem: 'Which response best demonstrates the intended competency in this test item?',
  choices: ['A useful response', 'A distractor', 'Another distractor', 'A final distractor'],
  correct: 0,
  rationale: 'The keyed response is supported by the stated competency and evidence.',
  references: ['REF-TEST-001']
};

const approved = [{
  objectId: base.id,
  objectVersion: base.version,
  reviewType: 'assessment',
  status: 'approved'
}];
const requested = [{
  objectId: base.id,
  objectVersion: base.version,
  reviewType: 'assessment',
  status: 'changes-requested'
}];

assert.equal(substantiveItemChanged(base, { ...base, status: 'active' }), false, 'status-only promotion is not substantive');
assert.equal(substantiveItemChanged(base, { ...base, stem: `${base.stem} Revised.` }), true, 'stem edits are substantive');
assert.equal(substantiveItemChanged(base, { ...base, choices: [...base.choices.slice(0, 3), 'Rewritten distractor'] }), true, 'choice edits are substantive');
assert.equal(substantiveItemChanged(base, { ...base, rationale: `${base.rationale} Additional evidence.` }), true, 'rationale edits are substantive');
assert.equal(hasApprovedAssessmentReview(base, approved), true);
assert.equal(hasApprovedAssessmentReview(base, requested), false);
assert.equal(isVersionAdvanced(1, 2), true);
assert.equal(isVersionAdvanced(2, 1), false);
assert.equal(isVersionAdvanced('1.0.2', '1.0.3'), true);
assert.equal(isVersionAdvanced('1.1.0', '1.0.9'), false);
assert.equal(isVersionAdvanced(1, 1), false);
assert.equal(evaluateReviewedItemChange(base, { ...base, status: 'active' }, approved), null, 'status-only change remains allowed');
assert.match(
  evaluateReviewedItemChange(base, { ...base, stem: `${base.stem} Revised.` }, approved),
  /without advancing version/,
  'same-version substantive edit must fail'
);
assert.equal(
  evaluateReviewedItemChange(base, { ...base, version: 2, stem: `${base.stem} Revised.` }, approved),
  null,
  'versioned substantive edit is allowed and will require a new exact-version review'
);
assert.equal(
  evaluateReviewedItemChange(base, { ...base, stem: `${base.stem} Revised.` }, requested),
  null,
  'non-approved prior review does not create a stale approval risk'
);
assert.match(
  evaluateReviewedItemChange(base, { ...base, id: 'ITEM-TEST-RENAMED', version: 2 }, approved),
  /identity changed in place/,
  'reviewed identity cannot be replaced in place'
);

console.log('reviewed assessment version-integrity tests passed');
