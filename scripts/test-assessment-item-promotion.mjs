import assert from 'node:assert/strict';
import { evaluateAssessmentItemPromotion } from './lib/assessment-item-promotion.mjs';

const item = {
  id: 'ITEM-TEST-001',
  version: 1,
  status: 'draft',
  purpose: 'summative',
  competency: 'COMP-TEST-001',
  objective: 'LO-TEST-001',
  bloomLevel: 'apply',
  difficulty: 'moderate',
  type: 'multiple-choice',
  stem: 'Which option is correct?',
  choices: ['A', 'B'],
  correct: 0,
  rationale: 'A is correct for this fixture.',
  references: ['REF-TEST-001']
};

const noReview = evaluateAssessmentItemPromotion({ item, reviews: [], referenceIds: new Set(['REF-TEST-001']) });
assert.equal(noReview.eligible, false);
assert.ok(noReview.failures.includes('exact-version approved assessment review is required'));

const wrongVersion = evaluateAssessmentItemPromotion({
  item,
  reviews: [{ id: 'REVIEW-TEST-001', objectId: item.id, objectVersion: 2, reviewType: 'assessment', status: 'approved' }],
  referenceIds: new Set(['REF-TEST-001'])
});
assert.equal(wrongVersion.eligible, false);

const missingReference = evaluateAssessmentItemPromotion({
  item,
  reviews: [{ id: 'REVIEW-TEST-001', objectId: item.id, objectVersion: 1, reviewType: 'assessment', status: 'approved' }],
  referenceIds: new Set()
});
assert.equal(missingReference.eligible, false);
assert.ok(missingReference.failures.some((failure) => failure.startsWith('unresolved references:')));

const eligible = evaluateAssessmentItemPromotion({
  item,
  reviews: [{ id: 'REVIEW-TEST-001', objectId: item.id, objectVersion: 1, reviewType: 'assessment', status: 'approved' }],
  referenceIds: new Set(['REF-TEST-001'])
});
assert.equal(eligible.eligible, true);
assert.equal(eligible.approvedReviewId, 'REVIEW-TEST-001');
assert.equal(eligible.promoted.status, 'active');
assert.equal(item.status, 'draft');

const retired = evaluateAssessmentItemPromotion({
  item: { ...item, status: 'retired' },
  reviews: [{ id: 'REVIEW-TEST-001', objectId: item.id, objectVersion: 1, reviewType: 'assessment', status: 'approved' }],
  referenceIds: new Set(['REF-TEST-001'])
});
assert.equal(retired.eligible, false);
assert.ok(retired.failures.includes('item status retired cannot be promoted'));

console.log('Guarded assessment item promotion tests passed.');
