import assert from 'node:assert/strict';
import { createAssessmentAttemptHistoryReader } from '../apps/api/src/assessment-attempt-history.mjs';
import { PersistenceUnavailableError } from '../apps/api/src/persistence-errors.mjs';

const calls = [];
const listAssessmentAttempts = createAssessmentAttemptHistoryReader({
  query: async (text, params) => {
    calls.push({ text, params });
    return {
      rows: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          assessment_id: 'ASSESS-TEST-001',
          assessment_version: '1.0.0',
          form_id: 'FORM-TEST-002',
          status: 'scored',
          started_at: new Date('2026-09-06T10:00:00.000Z'),
          submitted_at: new Date('2026-09-06T10:30:00.000Z'),
          scored_at: new Date('2026-09-06T10:31:00.000Z'),
          score_percent: '85.50',
          passed: true
        },
        {
          id: '00000000-0000-4000-8000-000000000001',
          assessment_id: 'ASSESS-TEST-001',
          assessment_version: '1.0.0',
          form_id: 'FORM-TEST-001',
          status: 'voided',
          started_at: new Date('2026-09-05T10:00:00.000Z'),
          submitted_at: null,
          scored_at: null,
          score_percent: null,
          passed: null
        }
      ]
    };
  }
});

const rows = await listAssessmentAttempts('subject-learner', 'ASSESS-TEST-001');
assert.equal(rows.length, 2);
assert.equal(rows[0].status, 'scored');
assert.equal(rows[0].scorePercent, 85.5);
assert.equal(rows[0].passed, true);
assert.equal(rows[0].startedAt, '2026-09-06T10:00:00.000Z');
assert.deepEqual(calls[0].params, ['subject-learner', 'ASSESS-TEST-001']);
assert.equal(calls[0].text.includes('$1'), true);
assert.equal(calls[0].text.includes('$2'), true);
assert.equal(calls[0].text.includes('subject-learner'), false, 'subject must be parameterized');
assert.equal(calls[0].text.includes('ASSESS-TEST-001'), false, 'assessment id must be parameterized');

await assert.rejects(() => listAssessmentAttempts('', 'ASSESS-TEST-001'), /externalSubject required/);
await assert.rejects(() => listAssessmentAttempts('subject-learner', 'not-valid'), /valid assessmentId required/);
assert.throws(() => createAssessmentAttemptHistoryReader(), /requires query/);

const failing = createAssessmentAttemptHistoryReader({ query: async () => { throw new Error('private database detail'); } });
await assert.rejects(() => failing('subject-learner', 'ASSESS-TEST-001'), PersistenceUnavailableError);

console.log('Assessment attempt history reader tests passed.');
