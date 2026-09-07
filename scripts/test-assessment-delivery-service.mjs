import assert from 'node:assert/strict';
import { createAssessmentDeliveryService } from '../apps/api/src/assessment-delivery.mjs';

const assessmentId = 'ASSESS-CULT-FOUNDATIONS-FINAL-001';
const devService = createAssessmentDeliveryService({ root: process.cwd(), allowDraft: true });
const { attempt } = devService.start({ learnerId: 'subject-test', assessmentId, seed: 'secure-delivery-test' });

assert.equal(attempt.status, 'started');
assert.equal(attempt.assessmentId, assessmentId);
assert.equal(attempt.items.length, 60);
assert.equal(new Set(attempt.items.map((item) => `${item.itemId}@${item.itemVersion}`)).size, 60);

const publicStarted = devService.publicView(attempt);
assert.equal(publicStarted.items.length, 60);
for (const item of publicStarted.items) {
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'correct'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'rationale'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'references'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'score'), false);
  assert.ok(item.stem);
}

const responses = attempt.items.map((item) => ({
  itemId: item.itemId,
  itemVersion: item.itemVersion,
  response: 0
}));
const { submitted, scored, competencyResults } = devService.submitAndScore({ attempt, responses });
assert.equal(submitted.status, 'submitted');
assert.equal(scored.status, 'scored');
assert.equal(typeof scored.scorePercent, 'number');
assert.equal(typeof scored.passed, 'boolean');
assert.equal(competencyResults.length, 12);

const publicScored = devService.publicView(scored);
assert.equal(publicScored.status, 'scored');
assert.equal(publicScored.scorePercent, scored.scorePercent);
assert.equal(publicScored.passed, scored.passed);
assert.equal(publicScored.competencies.length, 12);
for (const item of publicScored.items) {
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'correct'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'rationale'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'references'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'score'), false);
}

assert.throws(
  () => devService.submitAndScore({
    attempt,
    responses: [...responses, { itemId: 'ITEM-NOT-IN-FORM', itemVersion: 1, response: 0 }]
  }),
  /response-item-mismatch/
);
assert.throws(
  () => devService.submitAndScore({
    attempt,
    responses: [responses[0], responses[0]]
  }),
  /duplicate-response-item/
);

const productionService = createAssessmentDeliveryService({ root: process.cwd(), allowDraft: false });
assert.throws(
  () => productionService.start({ learnerId: 'subject-test', assessmentId, seed: 'production-deny-draft' }),
  /assessment-not-active/
);

console.log('Secure assessment delivery service tests passed.');
