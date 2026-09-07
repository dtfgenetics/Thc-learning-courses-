import assert from 'node:assert/strict';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';

const learnerId = '11111111-1111-4111-8111-111111111111';
const attemptId = '22222222-2222-4222-8222-222222222222';
const scoredAt = '2026-09-07T01:00:00.000Z';
const calls = [];
let transactionCount = 0;

const attempt = {
  id: attemptId,
  learnerId: 'subject-learner',
  assessmentId: 'ASSESS-TEST-001',
  assessmentVersion: '1.0.0',
  formId: 'FORM-TEST-001',
  formHash: 'form-hash',
  status: 'scored',
  startedAt: '2026-09-07T00:00:00.000Z',
  submittedAt: '2026-09-07T00:50:00.000Z',
  scoredAt,
  scorePercent: 66.67,
  passed: false,
  items: [
    { position: 1, itemId: 'ITEM-A-001', itemVersion: 1, competency: 'COMP-A-001', competencyVersion: '1.0.0', response: 0, score: 1, maxScore: 1 },
    { position: 2, itemId: 'ITEM-A-002', itemVersion: 1, competency: 'COMP-A-001', competencyVersion: '1.0.0', response: 1, score: 0, maxScore: 1 },
    { position: 3, itemId: 'ITEM-B-001', itemVersion: 2, competency: 'COMP-B-001', competencyVersion: '2.1.0', response: 2, score: 1, maxScore: 1 }
  ]
};

const attemptRow = {
  id: attemptId,
  assessment_id: attempt.assessmentId,
  assessment_version: attempt.assessmentVersion,
  form_id: attempt.formId,
  form_hash: attempt.formHash,
  status: 'scored',
  started_at: new Date(attempt.startedAt),
  submitted_at: new Date(attempt.submittedAt),
  scored_at: new Date(scoredAt),
  score_percent: '66.67',
  passed: false
};
const itemRows = attempt.items.map((item) => ({
  position: item.position,
  item_id: item.itemId,
  item_version: item.itemVersion,
  competency_id: item.competency,
  competency_version: item.competencyVersion,
  response_json: item.response,
  score: item.score,
  max_score: item.maxScore
}));

const query = async (text, params = []) => {
  calls.push({ text, params });
  if (text.includes('select id from learners where external_subject')) return { rows: [{ id: learnerId }] };
  if (text.startsWith('update assessment_attempt_items')) return { rowCount: 1, rows: [] };
  if (text.startsWith('update assessment_attempts')) return { rowCount: 1, rows: [attemptRow] };
  if (text.startsWith('insert into learner_competencies')) return { rowCount: 1, rows: [] };
  if (text.includes('join assessment_attempts a')) return { rows: [attemptRow] };
  if (text.includes('from assessment_attempt_items')) return { rows: itemRows };
  throw new Error(`unexpected query: ${text}`);
};

const store = createPostgresLearnerStore({
  query,
  withTransaction: async (callback) => {
    transactionCount += 1;
    return callback(query);
  }
});

const saved = await store.saveScoredAssessmentAttempt('subject-learner', attempt);
assert.equal(transactionCount, 1, 'score and competency mastery must share one transaction');
assert.equal(saved.status, 'scored');
assert.equal(saved.items[0].competencyVersion, '1.0.0');
assert.equal(saved.items[2].competencyVersion, '2.1.0');

const masteryWrites = calls.filter((call) => call.text.startsWith('insert into learner_competencies'));
assert.equal(masteryWrites.length, 2, 'one mastery row should be written per competency version');
assert.deepEqual(masteryWrites[0].params, [learnerId, 'COMP-A-001', '1.0.0', 'developing', attemptId, scoredAt]);
assert.deepEqual(masteryWrites[1].params, [learnerId, 'COMP-B-001', '2.1.0', 'demonstrated', attemptId, scoredAt]);
for (const write of masteryWrites) {
  assert.match(write.text, /on conflict \(learner_id, competency_id, curriculum_version\)/);
  assert.match(write.text, /learner_competencies\.mastery_level/);
  assert.match(write.text, />=/, 'mastery upsert must not downgrade stronger prior evidence');
}

const unversioned = structuredClone(attempt);
unversioned.items[0].competencyVersion = null;
await assert.rejects(
  () => store.saveScoredAssessmentAttempt('subject-learner', unversioned),
  /competency version required/
);

console.log('Versioned competency mastery persistence tests passed.');
