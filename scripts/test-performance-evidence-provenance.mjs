import assert from 'node:assert/strict';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';

const calls = [];
const evaluatedAt = new Date('2026-09-06T18:00:00.000Z');
const updatedAt = new Date('2026-09-06T18:05:00.000Z');

const store = createPostgresLearnerStore({
  query: async (text, params) => {
    calls.push({ text, params });
    if (text.includes('select id from learners')) return { rows: [{ id: 'learner-db-001' }] };
    if (text.includes('from assessment_attempts')) return { rows: [] };
    if (text.includes('from learner_competencies')) return { rows: [] };
    if (text.includes('from performance_assessment_results')) {
      return {
        rows: [
          {
            assessment_id: 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP',
            assessment_version: '1.0.0',
            status: 'passed',
            score_percent: '88.00',
            critical_error_count: 0,
            evaluator_id: 'PRIVATE-EVALUATOR-001',
            rubric_id: 'RUBRIC-TECH2-A-001',
            rubric_version: '1.0.0',
            delivery_mode: 'supervised-lab',
            evaluated_at: evaluatedAt,
            updated_at: updatedAt
          },
          {
            assessment_id: 'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION',
            assessment_version: '1.0.0',
            status: 'passed',
            score_percent: '90.00',
            critical_error_count: 0,
            evaluator_id: 'PRIVATE-EVALUATOR-002',
            rubric_id: null,
            rubric_version: null,
            delivery_mode: 'virtual-facility',
            evaluated_at: evaluatedAt,
            updated_at: updatedAt
          }
        ]
      };
    }
    if (text.includes('from learner_portfolio_artifacts')) return { rows: [] };
    throw new Error(`unexpected query: ${text}`);
  }
});

const evidence = await store.listCredentialEvidence('external-learner-001', {
  credentialDefinitionId: 'CRED-CULT-TECH-II-001'
});

assert.equal(evidence.performanceAssessments.length, 2);
const verified = evidence.performanceAssessments[0];
assert.equal(verified.assessmentId, 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP');
assert.equal(verified.scorePercent, 88);
assert.equal(verified.evidenceVerified, true);
assert.equal(verified.rubricId, 'RUBRIC-TECH2-A-001');
assert.equal(verified.rubricVersion, '1.0.0');
assert.equal(verified.deliveryMode, 'supervised-lab');
assert.equal(verified.evaluatedAt, evaluatedAt.toISOString());
assert.equal(Object.prototype.hasOwnProperty.call(verified, 'evaluatorId'), false, 'learner evidence must not expose evaluator identity');

const incomplete = evidence.performanceAssessments[1];
assert.equal(incomplete.evidenceVerified, false, 'missing rubric provenance must prevent verified status');

const performanceQuery = calls.find((call) => call.text.includes('from performance_assessment_results'));
assert.ok(performanceQuery, 'performance assessment query was not executed');
for (const field of ['evaluator_id', 'rubric_id', 'rubric_version', 'delivery_mode', 'evaluated_at']) {
  assert.equal(performanceQuery.text.includes(field), true, `performance query must load ${field}`);
}
assert.deepEqual(performanceQuery.params, ['learner-db-001']);

console.log('Performance assessment provenance persistence contract passed.');
