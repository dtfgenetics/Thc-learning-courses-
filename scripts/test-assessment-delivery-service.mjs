import assert from 'node:assert/strict';
import { createAssessmentDeliveryService } from '../apps/api/src/assessment-delivery.mjs';

const assessmentId = 'ASSESS-CULT-FOUNDATIONS-FINAL-001';
const devService = createAssessmentDeliveryService({ root: process.cwd(), allowDraft: true });
const { attempt, selected } = devService.start({ learnerId: 'subject-test', assessmentId, seed: 'secure-delivery-test' });

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

const selectedByKey = new Map(selected.map((item) => [`${item.id}@${item.version}`, item]));
const shuffledChoiceItems = publicStarted.items.filter((publicItem) => {
  const canonical = selectedByKey.get(`${publicItem.itemId}@${publicItem.itemVersion}`);
  return Array.isArray(canonical?.choices) && JSON.stringify(canonical.choices) !== JSON.stringify(publicItem.choices);
});
assert.ok(shuffledChoiceItems.length > 0, 'randomizeChoices=true should change the visible order for at least one selected item');
assert.deepEqual(devService.publicView(attempt).items, publicStarted.items, 'choice order must be stable across resume/read');

const responses = publicStarted.items.map((publicItem) => {
  const canonical = selectedByKey.get(`${publicItem.itemId}@${publicItem.itemVersion}`);
  let response;
  if (canonical.type === 'numeric') {
    response = canonical.correct;
  } else if (canonical.type === 'multiple-response') {
    response = canonical.correct.map((canonicalIndex) => publicItem.choices.indexOf(canonical.choices[canonicalIndex]));
  } else {
    response = publicItem.choices.indexOf(canonical.choices[canonical.correct]);
  }
  return { itemId: publicItem.itemId, itemVersion: publicItem.itemVersion, response };
});

const { submitted, scored, competencyResults } = devService.submitAndScore({ attempt, responses });
assert.equal(submitted.status, 'submitted');
assert.equal(scored.status, 'scored');
assert.equal(scored.scorePercent, 100, 'displayed choice indexes must translate back to canonical answers before scoring');
assert.equal(scored.passed, true);
assert.equal(competencyResults.length, 12);

const publicScored = devService.publicView(scored);
assert.equal(publicScored.status, 'scored');
assert.equal(publicScored.scorePercent, 100);
assert.equal(publicScored.passed, true);
assert.equal(publicScored.competencies.length, 12);
for (let index = 0; index < publicScored.items.length; index += 1) {
  const item = publicScored.items[index];
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'correct'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'rationale'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'references'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'score'), false);
  assert.deepEqual(item.response, responses[index].response, 'resume projection must translate canonical stored responses back to displayed order');
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
const choiceItem = publicStarted.items.find((item) => Array.isArray(item.choices));
assert.throws(
  () => devService.submit({
    attempt,
    responses: [{ itemId: choiceItem.itemId, itemVersion: choiceItem.itemVersion, response: choiceItem.choices.length }]
  }),
  /invalid-response-value/
);

const productionService = createAssessmentDeliveryService({ root: process.cwd(), allowDraft: false });
assert.throws(
  () => productionService.start({ learnerId: 'subject-test', assessmentId, seed: 'production-deny-draft' }),
  /assessment-not-active/
);

console.log('Secure assessment delivery service and stable choice randomization tests passed.');
