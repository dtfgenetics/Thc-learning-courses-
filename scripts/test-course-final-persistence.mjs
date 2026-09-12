import assert from 'node:assert/strict';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';

const learnerId = '11111111-1111-4111-8111-111111111111';
const attemptId = '22222222-2222-4222-8222-222222222222';
const calls = [];
const query = async (text, params) => {
  calls.push({ text, params });
  if (text.startsWith('insert into learners')) return { rows: [{ id: learnerId, external_subject: 'learner-course1' }] };
  if (text.includes('insert into assessment_attempt_items')) return { rows: [{ attempt_id: attemptId }, { attempt_id: attemptId }] };
  if (text.includes('from learners l') && text.includes('a.id = $2')) {
    return { rows: [{ id: attemptId, assessment_id: 'ASSESS-LH-TECH1-001-FINAL', assessment_version: '1.0.0', form_id: 'FORM-TEST', form_hash: 'hash', status: 'started', started_at: new Date('2026-09-11T20:00:00.000Z'), submitted_at: null, scored_at: null, score_percent: null, passed: null }] };
  }
  if (text.includes('from assessment_attempt_items') && text.includes('where attempt_id = $1')) {
    return { rows: [
      { position: 1, item_id: 'ITEM-LH-TECH1-001-001', item_version: 1, competency_id: 'COMP-SAFETY-WORK-001', response_json: 2, score: null, max_score: 1 },
      { position: 2, item_id: 'ITEM-LH-TECH1-001-002', item_version: 1, competency_id: 'COMP-SAFETY-WORK-001', response_json: null, score: null, max_score: 1 }
    ] };
  }
  if (text.includes('select count(*)::integer as count from updated')) return { rows: [{ count: 1 }] };
  if (text.includes('select * from finalized')) return { rows: [{ id: attemptId, assessment_id: 'ASSESS-LH-TECH1-001-FINAL', assessment_version: '1.0.0', form_id: 'FORM-TEST', form_hash: 'hash', status: 'scored', started_at: new Date('2026-09-11T20:00:00.000Z'), submitted_at: new Date('2026-09-11T20:30:00.000Z'), scored_at: new Date('2026-09-11T20:30:00.000Z'), score_percent: 100, passed: true }] };
  throw new Error(`Unexpected query: ${text}`);
};

const store = createPostgresLearnerStore({ query });
const attempt = {
  id: attemptId,
  learnerId: 'learner-course1',
  assessmentId: 'ASSESS-LH-TECH1-001-FINAL',
  assessmentVersion: '1.0.0',
  formId: 'FORM-TEST',
  formHash: 'hash',
  status: 'started',
  startedAt: '2026-09-11T20:00:00.000Z',
  submittedAt: null,
  scoredAt: null,
  scorePercent: null,
  passed: null,
  items: [
    { position: 1, itemId: 'ITEM-LH-TECH1-001-001', itemVersion: 1, competency: 'COMP-SAFETY-WORK-001', response: null, score: null, maxScore: 1 },
    { position: 2, itemId: 'ITEM-LH-TECH1-001-002', itemVersion: 1, competency: 'COMP-SAFETY-WORK-001', response: null, score: null, maxScore: 1 }
  ]
};

await store.createAssessmentAttempt('learner-course1', { attempt });
const createCall = calls.find((call) => call.text.includes('insert into assessment_attempt_items'));
assert.ok(createCall);
assert.match(createCall.text, /jsonb_to_recordset\(\$8::jsonb\)/);
assert.equal(createCall.text.includes('ITEM-LH-TECH1-001-001'), false, 'item IDs must be parameters, not SQL interpolation');
assert.equal(createCall.params[1], learnerId);
assert.equal(createCall.params[2], 'ASSESS-LH-TECH1-001-FINAL');

const loaded = await store.getAssessmentAttempt('learner-course1', { attemptId });
assert.equal(loaded.id, attemptId);
assert.equal(loaded.items.length, 2);
assert.equal(loaded.items[0].response, 2);
const ownerCall = calls.find((call) => call.text.includes('a.id = $2'));
assert.deepEqual(ownerCall.params, ['learner-course1', attemptId]);
assert.match(ownerCall.text, /l\.external_subject = \$1/);

await store.saveAssessmentResponses('learner-course1', { attemptId, responses: [{ itemId: 'ITEM-LH-TECH1-001-002', itemVersion: 1, response: 1 }] });
const responseCall = calls.find((call) => call.text.includes('select count(*)::integer as count from updated'));
assert.ok(responseCall);
assert.match(responseCall.text, /a\.status = 'started'/);
assert.match(responseCall.text, /l\.external_subject = \$2/);
assert.equal(responseCall.params[0], attemptId);
assert.equal(responseCall.params[1], 'learner-course1');
assert.equal(responseCall.text.includes('learner-course1'), false, 'external subject must not be interpolated');

const scored = {
  ...attempt,
  status: 'scored',
  submittedAt: '2026-09-11T20:30:00.000Z',
  scoredAt: '2026-09-11T20:30:00.000Z',
  scorePercent: 100,
  passed: true,
  items: attempt.items.map((row, index) => ({ ...row, response: index, score: 1 }))
};
const saved = await store.saveAssessmentScore('learner-course1', { attempt: scored });
assert.equal(saved.status, 'scored');
assert.equal(saved.passed, true);
const scoreCall = calls.find((call) => call.text.includes('select * from finalized'));
assert.ok(scoreCall);
assert.match(scoreCall.text, /a\.status = 'started'/);
assert.match(scoreCall.text, /submitted_at = \$4/);
assert.match(scoreCall.text, /score_percent = \$6/);
assert.match(scoreCall.text, /\(select count\(\*\) from updated_items\) = \$8/);
assert.equal(scoreCall.text.includes('response_json = input.response_json'), true);
assert.equal(scoreCall.text.includes('correct'), false, 'persistence layer must not write answer keys');

console.log('Course 1 final assessment persistence ownership, parameterization, autosave, and scoring contract passed.');
