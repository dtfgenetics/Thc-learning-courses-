import assert from 'node:assert/strict';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';

const learners = new Map();
const attempts = new Map();
const items = new Map();
const transactionEvents = [];
let learnerSequence = 0;

function iso(value) {
  return value == null ? null : new Date(value).toISOString();
}

function rowsForAttempt(attempt) {
  if (!attempt) return [];
  return [{
    id: attempt.id,
    assessment_id: attempt.assessmentId,
    assessment_version: attempt.assessmentVersion,
    form_id: attempt.formId,
    form_hash: attempt.formHash,
    status: attempt.status,
    started_at: attempt.startedAt,
    submitted_at: attempt.submittedAt,
    scored_at: attempt.scoredAt,
    score_percent: attempt.scorePercent,
    passed: attempt.passed
  }];
}

async function fakeQuery(text, params = []) {
  const sql = String(text).replace(/\s+/g, ' ').trim().toLowerCase();

  if (sql.startsWith('insert into learners')) {
    const subject = params[1];
    let learner = learners.get(subject);
    if (!learner) {
      learnerSequence += 1;
      learner = { id: `00000000-0000-4000-8000-${String(learnerSequence).padStart(12, '0')}`, external_subject: subject };
      learners.set(subject, learner);
    }
    return { rowCount: 1, rows: [learner] };
  }
  if (sql.startsWith('select id from learners where external_subject')) {
    const learner = learners.get(params[0]);
    return { rows: learner ? [{ id: learner.id }] : [] };
  }
  if (sql.startsWith('insert into assessment_attempts')) {
    const [id, learnerId, assessmentId, assessmentVersion, formId, formHash, status, startedAt] = params;
    if ([...attempts.values()].some((row) => row.learnerId === learnerId && row.assessmentId === assessmentId && row.formId === formId)) {
      throw new Error('duplicate-attempt-form');
    }
    const row = {
      id,
      learnerId,
      assessmentId,
      assessmentVersion: String(assessmentVersion),
      formId,
      formHash,
      status,
      startedAt,
      submittedAt: null,
      scoredAt: null,
      scorePercent: null,
      passed: null
    };
    attempts.set(id, row);
    items.set(id, []);
    return { rowCount: 1, rows: rowsForAttempt(row) };
  }
  if (sql.startsWith('insert into assessment_attempt_items')) {
    const [attemptId, position, itemId, itemVersion, competencyId, responseJson, score, maxScore] = params;
    const target = items.get(attemptId);
    if (!target) throw new Error('attempt-items-parent-missing');
    if (!competencyId) throw new Error('competency-required');
    target.push({
      attempt_id: attemptId,
      position,
      item_id: itemId,
      item_version: Number(itemVersion),
      competency_id: competencyId,
      response_json: responseJson == null ? null : JSON.parse(responseJson),
      score,
      max_score: maxScore
    });
    return { rowCount: 1, rows: [] };
  }
  if (sql.includes('from learners l join assessment_attempts a') && sql.includes('where l.external_subject = $1 and a.id = $2')) {
    const [subject, attemptId] = params;
    const learner = learners.get(subject);
    const attempt = attempts.get(attemptId);
    return { rows: learner && attempt?.learnerId === learner.id ? rowsForAttempt(attempt) : [] };
  }
  if (sql.startsWith('select position, item_id, item_version, competency_id, response_json, score, max_score from assessment_attempt_items')) {
    return { rows: [...(items.get(params[0]) ?? [])].sort((a, b) => a.position - b.position) };
  }
  if (sql.startsWith('update assessment_attempts') && sql.includes("status = 'submitted'")) {
    const [attemptId, learnerId, submittedAt] = params;
    const attempt = attempts.get(attemptId);
    if (!attempt || attempt.learnerId !== learnerId || attempt.status !== 'started') return { rowCount: 0, rows: [] };
    attempt.status = 'submitted';
    attempt.submittedAt = submittedAt;
    return { rowCount: 1, rows: rowsForAttempt(attempt) };
  }
  if (sql.startsWith('update assessment_attempt_items') && sql.includes('response_json')) {
    const [attemptId, itemId, itemVersion, responseJson] = params;
    const row = (items.get(attemptId) ?? []).find((value) => value.item_id === itemId && value.item_version === Number(itemVersion));
    if (!row) return { rowCount: 0, rows: [] };
    row.response_json = responseJson == null ? null : JSON.parse(responseJson);
    return { rowCount: 1, rows: [] };
  }
  if (sql.startsWith('update assessment_attempt_items') && sql.includes('set score =')) {
    const [attemptId, itemId, itemVersion, score] = params;
    const row = (items.get(attemptId) ?? []).find((value) => value.item_id === itemId && value.item_version === Number(itemVersion));
    if (!row) return { rowCount: 0, rows: [] };
    row.score = score;
    return { rowCount: 1, rows: [] };
  }
  if (sql.startsWith('update assessment_attempts') && sql.includes("status = 'scored'")) {
    const [attemptId, learnerId, scoredAt, scorePercent, passed] = params;
    const attempt = attempts.get(attemptId);
    if (!attempt || attempt.learnerId !== learnerId || attempt.status !== 'submitted') return { rowCount: 0, rows: [] };
    attempt.status = 'scored';
    attempt.scoredAt = scoredAt;
    attempt.scorePercent = scorePercent;
    attempt.passed = passed;
    return { rowCount: 1, rows: rowsForAttempt(attempt) };
  }

  throw new Error(`Unhandled SQL in fake persistence test: ${sql}`);
}

async function withTransaction(callback) {
  transactionEvents.push('begin');
  const learnersBefore = new Map(learners);
  const attemptsBefore = new Map([...attempts].map(([key, value]) => [key, { ...value }]));
  const itemsBefore = new Map([...items].map(([key, value]) => [key, value.map((row) => ({ ...row }))]));
  try {
    const result = await callback(fakeQuery);
    transactionEvents.push('commit');
    return result;
  } catch (error) {
    learners.clear(); for (const [key, value] of learnersBefore) learners.set(key, value);
    attempts.clear(); for (const [key, value] of attemptsBefore) attempts.set(key, value);
    items.clear(); for (const [key, value] of itemsBefore) items.set(key, value);
    transactionEvents.push('rollback');
    throw error;
  }
}

const store = createPostgresLearnerStore({ query: fakeQuery, withTransaction });
assert.equal(typeof store.createAssessmentAttempt, 'function');
assert.equal(typeof store.getAssessmentAttempt, 'function');
assert.equal(typeof store.saveSubmittedAssessmentAttempt, 'function');
assert.equal(typeof store.saveScoredAssessmentAttempt, 'function');

const started = {
  id: '11111111-1111-4111-8111-111111111111',
  learnerId: 'subject-alice',
  assessmentId: 'ASSESS-CULT-FOUNDATIONS-FINAL-001',
  assessmentVersion: '1.0.0',
  formId: 'FORM-FOUNDATIONS-TEST-001',
  formHash: 'sha256:test-form',
  status: 'started',
  startedAt: '2026-09-06T20:00:00.000Z',
  submittedAt: null,
  scoredAt: null,
  items: [
    { position: 1, itemId: 'ITEM-ENV-001', itemVersion: 1, competency: 'COMP-ENV-VPD-001', response: null, score: null, maxScore: 1 },
    { position: 2, itemId: 'ITEM-WATER-001', itemVersion: 2, competency: 'COMP-WATER-001', response: null, score: null, maxScore: 1 }
  ]
};

let stored = await store.createAssessmentAttempt('subject-alice', started);
assert.equal(stored.status, 'started');
assert.equal(stored.items.length, 2);
assert.equal(stored.items[1].itemVersion, 2);
assert.deepEqual(transactionEvents.slice(-2), ['begin', 'commit']);

stored = await store.getAssessmentAttempt('subject-alice', started.id);
assert.equal(stored.id, started.id);
assert.equal(stored.items[0].competency, 'COMP-ENV-VPD-001');
assert.equal(await store.getAssessmentAttempt('subject-bob', started.id), null, 'learner isolation must hide attempts owned by another subject');

const submitted = {
  ...stored,
  status: 'submitted',
  submittedAt: '2026-09-06T20:05:00.000Z',
  items: stored.items.map((item, index) => ({ ...item, response: index === 0 ? 1 : [0, 2] }))
};
stored = await store.saveSubmittedAssessmentAttempt('subject-alice', submitted);
assert.equal(stored.status, 'submitted');
assert.equal(stored.items[0].response, 1);
assert.deepEqual(stored.items[1].response, [0, 2]);

const scored = {
  ...stored,
  status: 'scored',
  scoredAt: '2026-09-06T20:06:00.000Z',
  scorePercent: 50,
  passed: false,
  items: stored.items.map((item, index) => ({ ...item, score: index === 0 ? 1 : 0 }))
};
stored = await store.saveScoredAssessmentAttempt('subject-alice', scored);
assert.equal(stored.status, 'scored');
assert.equal(stored.scorePercent, 50);
assert.equal(stored.passed, false);
assert.equal(stored.items[0].score, 1);
assert.equal(stored.items[1].score, 0);

await assert.rejects(
  () => store.saveSubmittedAssessmentAttempt('subject-alice', submitted),
  /assessment-attempt-transition-conflict/
);

const badAttempt = {
  ...started,
  id: '22222222-2222-4222-8222-222222222222',
  formId: 'FORM-FOUNDATIONS-TEST-002',
  items: [{ position: 1, itemId: 'ITEM-BAD-001', itemVersion: 1, competency: null, response: null, score: null, maxScore: 1 }]
};
const attemptsBeforeBadCreate = attempts.size;
await assert.rejects(() => store.createAssessmentAttempt('subject-alice', badAttempt), /competency required/);
assert.equal(attempts.size, attemptsBeforeBadCreate, 'failed item insert must roll back parent attempt');
assert.equal(transactionEvents.at(-1), 'rollback');

assert.throws(() => createPostgresLearnerStore({ query: fakeQuery }), /withTransaction/);

console.log('Atomic PostgreSQL assessment attempt persistence lifecycle passed.');
