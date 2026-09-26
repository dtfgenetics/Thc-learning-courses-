import assert from 'node:assert/strict';
import { enforceProductionAuthAssurance, loadProductionApiOptions, validateProductionEnvironment } from '../apps/api/src/bootstrap.mjs';
import { createHandler } from '../apps/api/src/server.mjs';

assert.deepEqual(validateProductionEnvironment({ NODE_ENV: 'development' }), { mode: 'development' });

const noMfa = enforceProductionAuthAssurance(() => ({ ok: true, subject: 'admin-no-mfa', scopes: ['admin:read'], mfaVerified: false }));
assert.deepEqual(noMfa({ headers: {} }, 'admin:read'), { ok: false, status: 403, error: 'admin-mfa-required' });
const learnerWithoutMfa = enforceProductionAuthAssurance(() => ({ ok: true, subject: 'learner', scopes: ['learner:read'], mfaVerified: false }));
assert.equal(learnerWithoutMfa({ headers: {} }, 'learner:read').ok, true);

for (const env of [
  { NODE_ENV: 'production' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter-completion.mjs' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter-completion.mjs', THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs', THC_PUBLIC_BASE_URL: 'http://academy.example.com', THC_REQUIRED_SCHEMA_VERSION: '3' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter-completion.mjs', THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs', THC_PUBLIC_BASE_URL: 'https://academy.example.com' }
]) assert.throws(() => validateProductionEnvironment(env));

const productionEnv = {
  NODE_ENV: 'production',
  THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter-completion.mjs',
  THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs',
  THC_PUBLIC_BASE_URL: 'https://academy.example.com',
  THC_REQUIRED_SCHEMA_VERSION: '7'
};
const options = await loadProductionApiOptions(productionEnv);
assert.equal(options.credentialStore.kind, 'test-persistent');
assert.equal(await options.credentialStore.ping(), true);
assert.equal(await options.credentialStore.schemaVersion(), '7');
assert.equal(options.requiredSchemaVersion, '7');
assert.equal(options.credentialWriter.kind, 'test-writer');
assert.equal(typeof options.credentialWriter.issueCredential, 'function');
assert.equal(typeof options.credentialWriter.transitionById, 'function');
assert.equal(options.credentialSigner, null, 'signer stays unavailable until a managed signing module is configured');
assert.equal(typeof options.learnerStore.listCourseEvidence, 'function');
assert.equal(typeof options.learnerStore.listCredentialEvidence, 'function');
for (const method of ['findOpenAssessmentAttempt', 'getAssessmentAttempt', 'createAssessmentAttempt', 'saveAssessmentResponses', 'saveAssessmentScore']) {
  assert.equal(typeof options.learnerStore[method], 'function', `production learner store must provide ${method}()`);
}
for (const method of ['getPracticalSubmission', 'savePracticalSubmission']) assert.equal(typeof options.learnerStore[method], 'function', `production learner store must provide ${method}()`);
assert.equal(options.practicalEvaluatorStore.kind, 'test-practical-evaluator');
for (const method of ['listCourseLearners', 'listCourseReportRows', 'getEvaluation', 'saveEvaluation', 'claimEvaluator', 'releaseEvaluator', 'setEvaluatorAssignment']) {
  assert.equal(typeof options.practicalEvaluatorStore[method], 'function', `production practical evaluator store must provide ${method}()`);
}
assert.equal(options.enrollmentCompletionStore.kind, 'test-enrollment-completion');
for (const method of ['setEnrollmentAcademicStatus', 'listEnrollmentAcademicHistory']) {
  assert.equal(typeof options.enrollmentCompletionStore[method], 'function', `production enrollment completion store must provide ${method}()`);
}
assert.equal(typeof options.authorize, 'function');
assert.doesNotThrow(() => createHandler(options));

assert.throws(() => createHandler({ env: { NODE_ENV: 'production' } }), /explicit persistent credentialStore/);

const authMissing = options.authorize({ headers: {} }, 'admin:read');
assert.equal(authMissing.ok, false);
assert.equal(authMissing.status, 401);
const authOk = options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'admin:read');
assert.equal(authOk.ok, true);
assert.equal(authOk.subject, 'external-user-001');
assert.equal(authOk.mfaVerified, true);
for (const scope of ['admin:write', 'learner:read', 'learner:write', 'evaluator:read', 'evaluator:write']) assert.ok(authOk.scopes.includes(scope));
const evaluatorAuth = options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'evaluator:write');
assert.equal(evaluatorAuth.ok, true);
const adminWrite = options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'admin:write');
assert.equal(adminWrite.ok, true);

console.log('Production persistence, schema v7 readiness, learner practical submissions, automatic academic enrollment completion, assessment/evidence, evaluator queue/assignment/reporting, authentication adapter, and admin MFA assurance contracts passed.');
