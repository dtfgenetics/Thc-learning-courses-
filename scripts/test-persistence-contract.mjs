import assert from 'node:assert/strict';
import { createApiServer } from '../apps/api/src/server.mjs';
import { createPostgresCredentialStore, mapCredentialRow } from '../apps/api/src/postgres-credential-store.mjs';
import { createPostgresLearnerStore } from '../apps/api/src/postgres-learner-store.mjs';
import { PersistenceUnavailableError } from '../apps/api/src/persistence-errors.mjs';

assert.throws(
  () => createApiServer({ env: { NODE_ENV: 'production' }, logger: () => {} }),
  /explicit persistent credentialStore/,
  'production must not fall back to the in-memory development store'
);

const calls = [];
const row = {
  id: '3ec945df-f4cf-4b6f-ae8e-0df43c6ac101',
  verification_id: 'VERIFY-POSTGRES-001',
  subject_hash: 'private-subject-hash',
  credential_definition_id: 'CRED-CULT-FOUNDATIONS-001',
  credential_definition_version: '1.0.0',
  course_id: 'COURSE-CULT-FOUNDATIONS-001',
  course_version: '1.0.0',
  status: 'valid',
  issued_at: new Date('2026-09-05T12:00:00.000Z'),
  expires_at: null,
  payload_json: { issuer: { name: 'Teaching Healthy Cultivation', url: 'https://dtfseeds.com/' }, privateEvidence: true },
  payload_hash: 'payload-hash'
};
const statusRows = [
  { status:'valid', reason:'initial-validation', actor_id:'SYSTEM', created_at:new Date('2026-09-05T12:01:00.000Z') },
  { status:'suspended', reason:'manual-review', actor_id:'ADMIN-1', created_at:new Date('2026-09-06T12:01:00.000Z') },
  { status:'valid', reason:'review-cleared', actor_id:'ADMIN-2', created_at:new Date('2026-09-06T13:01:00.000Z') }
];

const store = createPostgresCredentialStore({
  query: async (text, params) => {
    calls.push({ text, params });
    if (text === 'select 1 as ok') return { rows: [{ ok: 1 }] };
    if (text.includes('join credential_status_events')) return { rows: statusRows };
    if (text.includes('where verification_id = $1')) return { rows: [row] };
    if (text.includes('count(*)')) return { rows: [{ count: 7 }] };
    throw new Error('unexpected query');
  }
});

assert.equal(await store.ping(), true);
const credential = await store.getByVerificationId('VERIFY-POSTGRES-001');
assert.equal(store.kind, 'postgres');
assert.equal(credential.verificationId, 'VERIFY-POSTGRES-001');
assert.equal(credential.credentialDefinitionVersion, '1.0.0');
assert.equal(credential.courseId, 'COURSE-CULT-FOUNDATIONS-001');
assert.equal(credential.issuer.name, 'Teaching Healthy Cultivation');
assert.equal(credential.issuedAt, '2026-09-05T12:00:00.000Z');
assert.equal(credential.expiresAt, null);
assert.equal(credential.subjectHash, 'private-subject-hash');
const verificationCall = calls.find((call) => call.text.includes('where verification_id = $1') && !call.text.includes('join credential_status_events'));
assert.deepEqual(verificationCall.params, ['VERIFY-POSTGRES-001']);
assert.equal(verificationCall.text.includes('VERIFY-POSTGRES-001'), false, 'verification id must be parameterized, not interpolated');

const history = await store.listStatusHistoryByVerificationId('VERIFY-POSTGRES-001');
assert.equal(history.length, 3);
assert.deepEqual(history[1], { status:'suspended', reason:'manual-review', actorId:'ADMIN-1', createdAt:'2026-09-06T12:01:00.000Z' });
const historyCall = calls.find((call) => call.text.includes('join credential_status_events'));
assert.deepEqual(historyCall.params, ['VERIFY-POSTGRES-001']);
assert.equal(historyCall.text.includes('VERIFY-POSTGRES-001'), false, 'history verification id must be parameterized');
assert.equal(await store.count(), 7);

assert.equal(mapCredentialRow(null), null);
assert.throws(() => createPostgresCredentialStore(), /requires a query/);
const jsonPayloadRow = { ...row, payload_json: JSON.stringify(row.payload_json) };
assert.equal(mapCredentialRow(jsonPayloadRow).issuer.name, 'Teaching Healthy Cultivation');

const failingStore = createPostgresCredentialStore({ query: async () => { throw new Error('private database detail'); } });
await assert.rejects(() => failingStore.ping(), PersistenceUnavailableError);
await assert.rejects(() => failingStore.getByVerificationId('VERIFY-FAIL'), PersistenceUnavailableError);
await assert.rejects(() => failingStore.listStatusHistoryByVerificationId('VERIFY-FAIL'), PersistenceUnavailableError);
await assert.rejects(() => failingStore.count(), PersistenceUnavailableError);

const learnerCalls = [];
const learnerStore = createPostgresLearnerStore({
  query: async (text, params) => {
    learnerCalls.push({ text, params });
    if (text.includes('select id from learners')) return { rows: [{ id: '11111111-1111-1111-1111-111111111111' }] };
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
            evaluated_at: new Date('2026-09-02T16:00:00.000Z'),
            updated_at: new Date('2026-09-02T16:05:00.000Z')
          },
          {
            assessment_id: 'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION',
            assessment_version: '1.0.0',
            status: 'passed',
            score_percent: '90.00',
            critical_error_count: 0,
            evaluator_id: 'PRIVATE-EVALUATOR-002',
            rubric_id: 'RUBRIC-TECH2-B-001',
            rubric_version: null,
            delivery_mode: 'supervised-lab',
            evaluated_at: new Date('2026-09-02T17:00:00.000Z'),
            updated_at: new Date('2026-09-02T17:05:00.000Z')
          }
        ]
      };
    }
    if (text.includes('from learner_portfolio_artifacts')) return { rows: [] };
    throw new Error(`unexpected learner query: ${text}`);
  }
});

const learnerEvidence = await learnerStore.listCredentialEvidence('external-learner-001', { credentialDefinitionId: 'CRED-CULT-TECH-II-001' });
assert.equal(learnerEvidence.performanceAssessments.length, 2);
const verifiedPerformance = learnerEvidence.performanceAssessments.find((entry) => entry.assessmentId === 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP');
assert.equal(verifiedPerformance.evidenceVerified, true);
assert.equal(verifiedPerformance.rubricId, 'RUBRIC-TECH2-A-001');
assert.equal(verifiedPerformance.rubricVersion, '1.0.0');
assert.equal(verifiedPerformance.deliveryMode, 'supervised-lab');
assert.equal(verifiedPerformance.evaluatedAt, '2026-09-02T16:00:00.000Z');
assert.equal(Object.prototype.hasOwnProperty.call(verifiedPerformance, 'evaluatorId'), false, 'evaluator identity must not leave persistence adapter learner evidence');
const incompletePerformance = learnerEvidence.performanceAssessments.find((entry) => entry.assessmentId === 'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION');
assert.equal(incompletePerformance.evidenceVerified, false, 'missing rubric version must prevent verified evidence status');
const performanceQuery = learnerCalls.find((call) => call.text.includes('from performance_assessment_results'));
assert.equal(performanceQuery.text.includes('evaluator_id'), true);
assert.equal(performanceQuery.text.includes('rubric_version'), true);
assert.equal(performanceQuery.text.includes('delivery_mode'), true);

console.log('PostgreSQL credential persistence, lifecycle history, performance provenance, and production fail-closed tests passed');
