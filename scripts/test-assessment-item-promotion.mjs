import assert from 'node:assert/strict';
import { evaluateAssessmentItemPromotion } from './lib/assessment-item-promotion.mjs';
import { evaluateFoundationsPilotCandidate } from './lib/foundations-pilot-candidate.mjs';

const item = {
  id: 'ITEM-TEST-001',
  version: 1,
  status: 'pilot',
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

const approvedReview = { id: 'REVIEW-TEST-001', objectId: item.id, objectVersion: 1, reviewType: 'assessment', status: 'approved' };
const pilotPolicy = {
  activation: {
    minimumResponsesPerItem: 30,
    requiredDiscriminationMethod: 'point-biserial-item-rest',
    minimumDiscrimination: 0,
    requireNoOpenChallenges: true,
    requireResponseAccountingConsistency: true
  },
  reviewSignals: {}
};
const qualifiedPilot = {
  id: 'PILOT-ITEM-TEST-001-V1',
  itemId: item.id,
  itemVersion: 1,
  status: 'complete',
  sampleSize: 30,
  percentCorrect: 0.6,
  discrimination: { method: 'point-biserial-item-rest', value: 0.2 },
  distractorSelection: [
    { choiceIndex: 0, count: 18, proportion: 0.6 },
    { choiceIndex: 1, count: 12, proportion: 0.4 }
  ],
  omitRate: 0,
  medianResponseTimeSeconds: 20,
  responseTimeAnomalyRate: 0,
  challengeHistory: [],
  analystId: 'tester',
  completedAt: '2026-09-07T00:00:00Z'
};

const noReview = evaluateAssessmentItemPromotion({
  item,
  reviews: [],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [qualifiedPilot],
  pilotPolicy
});
assert.equal(noReview.eligible, false);
assert.ok(noReview.failures.includes('exact-version approved assessment review is required'));

const wrongVersion = evaluateAssessmentItemPromotion({
  item,
  reviews: [{ ...approvedReview, objectVersion: 2 }],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [qualifiedPilot],
  pilotPolicy
});
assert.equal(wrongVersion.eligible, false);

const missingReference = evaluateAssessmentItemPromotion({
  item,
  reviews: [approvedReview],
  referenceIds: new Set(),
  pilotRecords: [qualifiedPilot],
  pilotPolicy
});
assert.equal(missingReference.eligible, false);
assert.ok(missingReference.failures.some((failure) => failure.startsWith('unresolved references:')));

const noPilot = evaluateAssessmentItemPromotion({
  item,
  reviews: [approvedReview],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [],
  pilotPolicy
});
assert.equal(noPilot.eligible, false);
assert.ok(noPilot.failures.includes('policy-qualified exact-version pilot evidence is required'));

const weakPilot = evaluateAssessmentItemPromotion({
  item,
  reviews: [approvedReview],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [{ ...qualifiedPilot, sampleSize: 12 }],
  pilotPolicy
});
assert.equal(weakPilot.eligible, false);
assert.ok(weakPilot.failures.includes('policy-qualified exact-version pilot evidence is required'));

const wrongPilotVersion = evaluateAssessmentItemPromotion({
  item,
  reviews: [approvedReview],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [{ ...qualifiedPilot, itemVersion: 2 }],
  pilotPolicy
});
assert.equal(wrongPilotVersion.eligible, false);

const eligible = evaluateAssessmentItemPromotion({
  item,
  reviews: [approvedReview],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [qualifiedPilot],
  pilotPolicy
});
assert.equal(eligible.eligible, true);
assert.equal(eligible.approvedReviewId, 'REVIEW-TEST-001');
assert.equal(eligible.qualifiedPilotEvidenceId, 'PILOT-ITEM-TEST-001-V1');
assert.equal(eligible.promoted.status, 'active');
assert.equal(item.status, 'pilot');

const retired = evaluateAssessmentItemPromotion({
  item: { ...item, status: 'retired' },
  reviews: [approvedReview],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [qualifiedPilot],
  pilotPolicy
});
assert.equal(retired.eligible, false);
assert.ok(retired.failures.includes('item status retired cannot be promoted'));

const cueDefectiveItem = {
  ...item,
  id: 'ITEM-TEST-002',
  status: 'pilot',
  stem: 'A reviewed assessment item has four answer choices. Which current response should remain eligible for activation?',
  choices: [
    'The correct response is intentionally much longer and more detailed than every distractor, creating a strong test-wise cue that can reveal the key without demonstrating the competency',
    'A short distractor',
    'Another short distractor',
    'A final short distractor'
  ],
  correct: 0,
  rationale: 'This fixture deliberately makes the keyed answer a high-severity length outlier so current item QA must block it.'
};
const cueDefectiveReview = { ...approvedReview, id: 'REVIEW-TEST-002', objectId: cueDefectiveItem.id };
const cueDefectivePilot = { ...qualifiedPilot, id: 'PILOT-ITEM-TEST-002-V1', itemId: cueDefectiveItem.id };

const legacyReviewedPilotCandidate = evaluateFoundationsPilotCandidate({
  item: cueDefectiveItem,
  reviews: [cueDefectiveReview],
  referenceIds: new Set(['REF-TEST-001'])
});
assert.equal(legacyReviewedPilotCandidate.eligible, false);
assert.ok(legacyReviewedPilotCandidate.highSeverityFlags.some((flag) => flag.code === 'keyed-choice-uniquely-longest'));
assert.ok(legacyReviewedPilotCandidate.failures.some((failure) => failure.startsWith('current item QA has high-severity construction flags:')));

const legacyReviewedActivation = evaluateAssessmentItemPromotion({
  item: cueDefectiveItem,
  reviews: [cueDefectiveReview],
  referenceIds: new Set(['REF-TEST-001']),
  pilotRecords: [cueDefectivePilot],
  pilotPolicy
});
assert.equal(legacyReviewedActivation.eligible, false);
assert.ok(legacyReviewedActivation.highSeverityFlags.some((flag) => flag.code === 'keyed-choice-uniquely-longest'));
assert.ok(legacyReviewedActivation.failures.some((failure) => failure.startsWith('current item QA has high-severity construction flags:')));
assert.equal(legacyReviewedActivation.promoted, null);

console.log('Guarded assessment item promotion tests passed.');
