import assert from 'node:assert/strict';
import { loadProductionApiOptions, validateProductionEnvironment } from '../apps/api/src/bootstrap.mjs';
import { createHandler } from '../apps/api/src/server.mjs';

assert.deepEqual(validateProductionEnvironment({ NODE_ENV: 'development' }), { mode: 'development' });

for (const env of [
  { NODE_ENV: 'production' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs', THC_PUBLIC_BASE_URL: 'http://academy.example.com', THC_REQUIRED_SCHEMA_VERSION: '5' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs', THC_PUBLIC_BASE_URL: 'https://academy.example.com' }
]) assert.throws(() => validateProductionEnvironment(env));

const productionEnv = {
  NODE_ENV: 'production',
  THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs',
  THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs',
  THC_PUBLIC_BASE_URL: 'https://academy.example.com',
  THC_REQUIRED_SCHEMA_VERSION: '5'
};
const options = await loadProductionApiOptions(productionEnv);
assert.equal(options.credentialStore.kind, 'test-persistent');
assert.equal(await options.credentialStore.ping(), true);
assert.equal(await options.credentialStore.schemaVersion(), '5');
assert.equal(typeof options.credentialStore.listStatusHistoryByVerificationId, 'function');
assert.equal(options.requiredSchemaVersion, '5');
assert.equal(options.credentialWriter.kind, 'test-writer');
assert.equal(typeof options.credentialWriter.transitionById, 'function');
assert.equal(typeof options.learnerStore.listCredentialEvidence, 'function');
assert.equal(typeof options.learnerStore.recordPerformanceAssessmentResult, 'function');
assert.equal(typeof options.authorize, 'function');
assert.doesNotThrow(() => createHandler(options));

const defaultOidcOptions = await loadProductionApiOptions({
  NODE_ENV: 'production',
  THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs',
  THC_PUBLIC_BASE_URL: 'https://academy.example.com',
  THC_REQUIRED_SCHEMA_VERSION: '5',
  THC_OIDC_ISSUER: 'https://identity.example.com/',
  THC_OIDC_AUDIENCE: 'https://academy.example.com/api',
  THC_OIDC_JWKS_URI: 'https://identity.example.com/.well-known/jwks.json',
  THC_OIDC_ALGORITHMS: 'RS256'
});
assert.equal(typeof defaultOidcOptions.authorize, 'function');

assert.throws(() => createHandler({ env: { NODE_ENV: 'production' } }), /explicit persistent credentialStore/);

const authMissing = await options.authorize({ headers: {} }, 'admin:read');
assert.equal(authMissing.ok, false);
assert.equal(authMissing.status, 401);
const authOk = await options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'admin:read');
assert.equal(authOk.ok, true);
assert.equal(authOk.subject, 'external-user-001');
assert.ok(authOk.scopes.includes('learner:read'));

console.log('Production schema v5 persistence, lifecycle writer/history, learner evidence/performance writes, and authentication adapter contract passed.');
