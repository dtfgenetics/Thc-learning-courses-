import assert from 'node:assert/strict';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';
import { loadPerformanceDefinition } from '../packages/domain/performance-definitions.mjs';

const assessmentId = 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP';
const definition = loadPerformanceDefinition({ assessmentId });
assert.ok(definition, 'expected canonical performance assessment definition');
assert.equal(definition.id, assessmentId);
assert.equal(loadPerformanceDefinition({ assessmentId: 'INVALID-ID' }), null);

const calls = [];
const learnerId = '11111111-1111-1111-1111-111111111111';
const evaluatedAt = '2026-09-06T20:00:00.000Z';
const updatedAt = new Date('2026-09-06T20:00:01.000Z');
const store = createPostgresLearnerStore({
  query: async (text, params) => {
    calls.push({ text, params });
    if (text.includes('insert into learners')) return { rows: [{ id: learnerId, external_subject: 'learner-assessor-test' }] };
    if (text.includes('insert into performance_assessment_results')) {
      return {
        rows: [{
          assessment_id: assessmentId,
          assessment_version: String(definition.version),
          status: 'passed',
          score_percent: '91.00',
          critical_error_count: 0,
          evaluator_id: 'ASSESSOR-TEST-001',
          rubric_id: assessmentId,
          rubric_version: String(definition.version),
          delivery_mode: 'supervised-lab',
          evaluated_at: new Date(evaluatedAt),
          updated_at: updatedAt
        }]
      };
    }
    throw new Error(`unexpected query: ${text}`);
  }
});

const result = await store.recordPerformanceAssessmentResult('learner-assessor-test', {
  assessmentId,
  assessmentVersion: String(definition.version),
  status: 'passed',
  scorePercent: 91,
  criticalErrorCount: 0,
  evidence: { observation: 'validated-test-evidence' },
  evaluatorId: 'ASSESSOR-TEST-001',
  rubricId: assessmentId,
  rubricVersion: String(definition.version),
  deliveryMode: 'supervised-lab',
  evaluatedAt
});

assert.equal(result.assessmentId, assessmentId);
assert.equal(result.status, 'passed');
assert.equal(result.scorePercent, 91);
assert.equal(result.criticalErrorCount, 0);
assert.equal(result.evidenceVerified, true);
assert.equal(result.rubricId, assessmentId);
assert.equal(result.rubricVersion, String(definition.version));
assert.equal(result.deliveryMode, 'supervised-lab');
assert.equal(result.evaluatedAt, evaluatedAt);
assert.equal(Object.prototype.hasOwnProperty.call(result, 'evaluatorId'), false, 'learner-facing result must not expose evaluator identity');

const writeCall = calls.find((call) => call.text.includes('insert into performance_assessment_results'));
assert.ok(writeCall, 'expected performance result persistence query');
assert.equal(writeCall.params[1], assessmentId);
assert.equal(writeCall.params[2], String(definition.version));
assert.equal(writeCall.params[3], 'passed');
assert.equal(writeCall.params[4], 91);
assert.equal(writeCall.params[5], 0);
assert.equal(writeCall.params[7], 'ASSESSOR-TEST-001');
assert.equal(writeCall.params[8], assessmentId);
assert.equal(writeCall.params[9], String(definition.version));
assert.equal(writeCall.params[10], 'supervised-lab');
assert.equal(writeCall.text.includes('on conflict (learner_id, assessment_id, assessment_version)'), true, 'write must be deterministic per learner/assessment/version');

await assert.rejects(
  () => store.recordPerformanceAssessmentResult('learner-assessor-test', { assessmentId, assessmentVersion: '1.0.0' }),
  /status required/
);
await assert.rejects(
  () => store.recordPerformanceAssessmentResult('learner-assessor-test', {
    assessmentId,
    assessmentVersion: '1.0.0',
    status: 'passed',
    scorePercent: 101,
    evaluatorId: 'ASSESSOR',
    rubricId: 'RUBRIC',
    rubricVersion: '1.0.0',
    deliveryMode: 'supervised-lab'
  }),
  /scorePercent must be between 0 and 100/
);

console.log('Assessor performance definition loading and trusted persistence tests passed.');
