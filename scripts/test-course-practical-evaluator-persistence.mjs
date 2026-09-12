import assert from 'node:assert/strict';
import { createPostgresPracticalEvaluatorStore } from '../apps/api/src/postgres-practical-evaluator-store.mjs';

const calls = [];
let learnerExists = true;
const storedRow = {
  assessment_id: 'PRACTICAL-LH-TECH1-001-WORKFLOW',
  assessment_version: '1.0.0',
  status: 'failed',
  score_percent: '92.00',
  critical_error_count: 1,
  evidence_json: {
    evaluatorNotes: 'Private evaluator note',
    learnerFeedback: 'Practice identity discrepancy escalation.',
    domainScores: [], criticalErrors: [], history: []
  },
  evaluator_id: 'assessor-001',
  evaluated_at: new Date('2026-09-12T12:00:00.000Z'),
  updated_at: new Date('2026-09-12T12:01:00.000Z')
};

async function query(text, params) {
  calls.push({ text, params });
  if (text.includes('select id from learners')) return { rows: learnerExists ? [{ id: '00000000-0000-0000-0000-000000000001' }] : [] };
  if (text.includes('from performance_assessment_results') && text.includes('select assessment_id')) return { rows: [storedRow] };
  if (text.includes('insert into performance_assessment_results')) return { rows: [storedRow] };
  throw new Error(`unexpected query: ${text}`);
}

const store = createPostgresPracticalEvaluatorStore({ query });
const fetched = await store.getEvaluation('learner-external-001', {
  assessmentId: storedRow.assessment_id,
  assessmentVersion: storedRow.assessment_version
});
assert.equal(fetched.learnerExists, true);
assert.equal(fetched.evaluation.evidence.evaluatorNotes, 'Private evaluator note');
assert.equal(fetched.evaluation.evaluatorId, 'assessor-001');

const writeRecord = {
  assessmentId: storedRow.assessment_id,
  assessmentVersion: storedRow.assessment_version,
  status: 'failed',
  scorePercent: 92,
  criticalErrorCount: 1,
  evidence: storedRow.evidence_json,
  evaluatorId: 'assessor-001',
  evaluatedAt: '2026-09-12T12:00:00.000Z'
};
const saved = await store.saveEvaluation('learner-external-001', writeRecord);
assert.equal(saved.learnerExists, true);
assert.equal(saved.evaluation.status, 'failed');

const learnerLookup = calls.find((call) => call.text.includes('select id from learners'));
assert.deepEqual(learnerLookup.params, ['learner-external-001']);
const evaluationLookup = calls.find((call) => call.text.includes('from performance_assessment_results') && call.text.includes('select assessment_id'));
assert.deepEqual(evaluationLookup.params, ['00000000-0000-0000-0000-000000000001', storedRow.assessment_id, storedRow.assessment_version]);
const write = calls.find((call) => call.text.includes('insert into performance_assessment_results'));
assert.ok(write, 'evaluation UPSERT query must run');
assert.ok(write.text.includes('on conflict (learner_id, assessment_id, assessment_version)'));
assert.ok(write.text.includes("'course-practical-evaluation-saved'"), 'authoritative evaluation saves must create an audit event');
assert.equal(write.text.includes('Private evaluator note'), false, 'private evaluator text must never be interpolated into SQL text');
assert.equal(write.text.includes('learner-external-001'), false, 'learner identity must be parameterized');
assert.equal(write.params[6], JSON.stringify(storedRow.evidence_json));
assert.equal(write.params[7], 'assessor-001');
assert.equal(write.params[9], 'learner-external-001');
assert.equal(write.text.includes('evaluatorNotes'), false, 'audit SQL metadata must not copy private evaluator notes');

learnerExists = false;
const missing = await store.getEvaluation('missing-learner', {
  assessmentId: storedRow.assessment_id,
  assessmentVersion: storedRow.assessment_version
});
assert.deepEqual(missing, { learnerExists: false, evaluation: null });
const writeMissing = await store.saveEvaluation('missing-learner', writeRecord);
assert.deepEqual(writeMissing, { learnerExists: false, evaluation: null });

console.log('Course 1 practical evaluator PostgreSQL parameterization, audit-event, privacy, and learner-resolution contracts passed.');
