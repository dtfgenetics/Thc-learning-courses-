import assert from 'node:assert/strict';
import { loadProductionApiOptions, validateProductionEnvironment } from '../apps/api/src/bootstrap.mjs';
import { createHandler } from '../apps/api/src/server.mjs';

assert.deepEqual(validateProductionEnvironment({ NODE_ENV: 'development' }), { mode: 'development' });

for (const env of [
  { NODE_ENV: 'production' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs', THC_PUBLIC_BASE_URL: 'http://academy.example.com', THC_REQUIRED_SCHEMA_VERSION: '2' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs', THC_PUBLIC_BASE_URL: 'https://academy.example.com' }
]) assert.throws(() => validateProductionEnvironment(env));

const productionEnv = {
  NODE_ENV: 'production',
  THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs',
  THC_AUTH_ADAPTER_MODULE: './scripts/fixtures/test-auth-adapter.mjs',
  THC_PUBLIC_BASE_URL: 'https://academy.example.com',
  THC_REQUIRED_SCHEMA_VERSION: '2'
};
const options = await loadProductionApiOptions(productionEnv);
assert.equal(options.credentialStore.kind, 'test-persistent');
assert.equal(await options.credentialStore.ping(), true);
assert.equal(await options.credentialStore.schemaVersion(), '2');
assert.equal(options.requiredSchemaVersion, '2');
assert.equal(options.credentialWriter.kind, 'test-writer');
assert.equal(typeof options.learnerStore.listCredentialEvidence, 'function');
assert.equal(typeof options.authorize, 'function');
assert.doesNotThrow(() => createHandler(options));

assert.throws(() => createHandler({ env: { NODE_ENV: 'production' } }), /explicit persistent credentialStore/);

const authMissing = options.authorize({ headers: {} }, 'admin:read');
assert.equal(authMissing.ok, false);
assert.equal(authMissing.status, 401);
const authOk = options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'admin:read');
assert.equal(authOk.ok, true);
assert.equal(authOk.subject, 'external-user-001');
assert.ok(authOk.scopes.includes('learner:read'));

console.log('Production persistence, schema readiness, learner evidence, and authentication adapter contract passed.');
