import assert from 'node:assert/strict';
import { loadProductionApiOptions, validateProductionEnvironment } from '../apps/api/src/bootstrap.mjs';
import { createHandler } from '../apps/api/src/server.mjs';

assert.deepEqual(validateProductionEnvironment({ NODE_ENV: 'development' }), { mode: 'development' });

for (const env of [
  { NODE_ENV: 'production' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_PUBLIC_BASE_URL: 'http://academy.example.com', THC_API_ADMIN_TOKEN: 'x'.repeat(40), THC_REQUIRED_SCHEMA_VERSION: '1' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_PUBLIC_BASE_URL: 'https://academy.example.com', THC_API_ADMIN_TOKEN: 'short', THC_REQUIRED_SCHEMA_VERSION: '1' },
  { NODE_ENV: 'production', THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs', THC_PUBLIC_BASE_URL: 'https://academy.example.com', THC_API_ADMIN_TOKEN: 'x'.repeat(40) }
]) assert.throws(() => validateProductionEnvironment(env));

const productionEnv = {
  NODE_ENV: 'production',
  THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs',
  THC_PUBLIC_BASE_URL: 'https://academy.example.com',
  THC_API_ADMIN_TOKEN: 'A'.repeat(48),
  THC_REQUIRED_SCHEMA_VERSION: '1'
};
const options = await loadProductionApiOptions(productionEnv);
assert.equal(options.credentialStore.kind, 'test-persistent');
assert.equal(await options.credentialStore.ping(), true);
assert.equal(await options.credentialStore.schemaVersion(), '1');
assert.equal(options.requiredSchemaVersion, '1');
assert.equal(options.credentialWriter.kind, 'test-writer');
assert.equal(typeof options.authorize, 'function');
assert.doesNotThrow(() => createHandler(options));

assert.throws(() => createHandler({ env: { NODE_ENV: 'production' } }), /explicit persistent credentialStore/);

const authMissing = options.authorize({ headers: {} }, 'admin:read');
assert.equal(authMissing.ok, false);
assert.equal(authMissing.status, 401);
const authOk = options.authorize({ headers: { authorization: `Bearer ${productionEnv.THC_API_ADMIN_TOKEN}` } }, 'admin:read');
assert.equal(authOk.ok, true);

console.log('Production API bootstrap and schema readiness contract passed.');
