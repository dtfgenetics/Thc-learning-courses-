import assert from 'node:assert/strict';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';
import { PersistenceUnavailableError } from '../apps/api/src/persistence-errors.mjs';

const calls = [];
const learnerId = '11111111-1111-4111-8111-111111111111';
const store = createPostgresLearnerStore({
  query: async (text, params) => {
    calls.push({ text, params });
    if (text.includes('select id from learners')) return { rows: [{ id: learnerId }] };
    if (text.includes('from assessment_attempts')) {
      return { rows: [{
        assessment_id: 'ASSESS-LH-TECH1-001-FINAL',
        assessment_version: '1.0.0',
        form_id: 'FORM-C1-001',
        status: 'scored',
        started_at: new Date('2026-09-10T13:00:00.000Z'),
        submitted_at: new Date('2026-09-10T13:45:00.000Z'),
        scored_at: new Date('2026-09-10T14:00:00.000Z'),
        score_percent: '84.50',
        passed: true,
        response_json: { shouldNeverBeSelected: true }
      }] };
    }
    if (text.includes('from performance_assessment_results')) {
      return { rows: [{
        assessment_id: 'PRACTICAL-LH-TECH1-001-WORKFLOW',
        assessment_version: '1.0.0',
        status: 'passed',
        score_percent: '90.00',
        critical_error_count: 0,
        evaluated_at: new Date('2026-09-11T12:00:00.000Z'),
        updated_at: new Date('2026-09-11T12:05:00.000Z'),
        evidence_json: { shouldNeverBeSelected: true }
      }] };
    }
    throw new Error(`unexpected query: ${text}`);
  }
});

const evidence = await store.listCourseEvidence('learner-course-001', {
  assessmentId: 'ASSESS-LH-TECH1-001-FINAL',
  performanceAssessmentId: 'PRACTICAL-LH-TECH1-001-WORKFLOW'
});
assert.equal(evidence.assessmentAttempts.length, 1);
assert.equal(evidence.assessmentAttempts[0].scorePercent, 84.5);
assert.equal(evidence.performanceAssessment.status, 'passed');
assert.equal(evidence.performanceAssessment.scorePercent, 90);
assert.equal(Object.prototype.hasOwnProperty.call(evidence.assessmentAttempts[0], 'response_json'), false);
assert.equal(Object.prototype.hasOwnProperty.call(evidence.performanceAssessment, 'evidence_json'), false);

const attemptCall = calls.find((call) => call.text.includes('from assessment_attempts'));
assert.deepEqual(attemptCall.params, [learnerId, 'ASSESS-LH-TECH1-001-FINAL']);
assert.match(attemptCall.text, /where learner_id = \$1 and assessment_id = \$2/);
assert.equal(attemptCall.text.includes('response_json'), false, 'course evidence query must not select learner responses');
assert.equal(attemptCall.text.includes('assessment_attempt_items'), false, 'course evidence query must not read item responses');

const practicalCall = calls.find((call) => call.text.includes('from performance_assessment_results'));
assert.deepEqual(practicalCall.params, [learnerId, 'PRACTICAL-LH-TECH1-001-WORKFLOW']);
assert.match(practicalCall.text, /where learner_id = \$1 and assessment_id = \$2/);
assert.equal(practicalCall.text.includes('evidence_json'), false, 'course evidence query must not select practical evidence payload');

const noLearnerCalls = [];
const noLearnerStore = createPostgresLearnerStore({
  query: async (text, params) => {
    noLearnerCalls.push({ text, params });
    if (text.includes('select id from learners')) return { rows: [] };
    throw new Error('evidence tables must not be queried when learner does not exist');
  }
});
const empty = await noLearnerStore.listCourseEvidence('missing-learner', {
  assessmentId: 'ASSESS-LH-TECH1-001-FINAL',
  performanceAssessmentId: 'PRACTICAL-LH-TECH1-001-WORKFLOW'
});
assert.deepEqual(empty.assessmentAttempts, []);
assert.equal(empty.performanceAssessment, null);
assert.equal(noLearnerCalls.length, 1);

await assert.rejects(() => store.listCourseEvidence('learner-course-001', {}), /assessmentId required/);

const failing = createPostgresLearnerStore({ query: async () => { throw new Error('private database detail'); } });
await assert.rejects(
  () => failing.listCourseEvidence('learner-course-001', { assessmentId: 'ASSESS-LH-TECH1-001-FINAL' }),
  PersistenceUnavailableError
);

console.log('Course-level learner evidence persistence scoping tests passed.');
