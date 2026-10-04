import assert from 'node:assert/strict';
import { scoreAttempt } from '../packages/domain/assessment-runtime.mjs';

function submittedAttempt(response) {
  return {
    id: 'ATTEMPT-HARDENING-001',
    learnerId: 'learner-test',
    assessmentId: 'ASSESS-HARDENING-001',
    assessmentVersion: '1.0.0',
    formId: 'FORM-HARDENING-001',
    formHash: 'test',
    status: 'submitted',
    startedAt: '2026-09-27T12:00:00.000Z',
    expiresAt: null,
    submittedAt: '2026-09-27T12:10:00.000Z',
    scoredAt: null,
    items: [{
      position: 1,
      itemId: 'ITEM-HARDENING-NUMERIC-001',
      itemVersion: 1,
      competency: 'COMP-HARDENING-001',
      response,
      score: null,
      maxScore: 1
    }]
  };
}

const exactItem = { id:'ITEM-HARDENING-NUMERIC-001', version:1, type:'numeric', correct:10, competency:'COMP-HARDENING-001' };
const tolerantItem = { ...exactItem, extensions:{ numericTolerance:0.25 } };

assert.equal(scoreAttempt(submittedAttempt(10), [exactItem], 80).passed, true);
assert.equal(scoreAttempt(submittedAttempt(10.01), [exactItem], 80).scorePercent, 0);
assert.equal(scoreAttempt(submittedAttempt(10.2), [tolerantItem], 80).scorePercent, 100);
assert.equal(scoreAttempt(submittedAttempt(10.25), [tolerantItem], 80).scorePercent, 100);
assert.equal(scoreAttempt(submittedAttempt(10.251), [tolerantItem], 80).scorePercent, 0);

assert.throws(() => scoreAttempt(submittedAttempt(10), [{ ...tolerantItem, extensions:{ numericTolerance:-1 } }], 80), /Invalid numeric tolerance/);
for (const invalid of [-1, 101, Number.NaN, 'not-a-number']) {
  assert.throws(() => scoreAttempt(submittedAttempt(10), [exactItem], invalid), /invalid passing score percent/);
}

const thresholdAttempt = {
  ...submittedAttempt(10),
  items:[
    { position:1,itemId:'ITEM-A',itemVersion:1,competency:'COMP-HARDENING-001',response:0,score:null,maxScore:1 },
    { position:2,itemId:'ITEM-B',itemVersion:1,competency:'COMP-HARDENING-001',response:1,score:null,maxScore:1 }
  ]
};
const thresholdBank = [
  { id:'ITEM-A',version:1,type:'multiple-choice',correct:0,competency:'COMP-HARDENING-001' },
  { id:'ITEM-B',version:1,type:'multiple-choice',correct:0,competency:'COMP-HARDENING-001' }
];
assert.equal(scoreAttempt(thresholdAttempt, thresholdBank, 50).passed, true);
assert.equal(scoreAttempt(thresholdAttempt, thresholdBank, 50.01).passed, false);

console.log('Assessment runtime hardening tests passed.');
