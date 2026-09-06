import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

async function requestReadiness(schemaVersion) {
  const credentialStore = {
    kind: 'test-persistent',
    async ping() { return true; },
    async schemaVersion() { return schemaVersion; },
    async getByVerificationId() { return null; }
  };
  const server = createApiServer({
    env: { NODE_ENV: 'production' },
    credentialStore,
    requiredSchemaVersion: '3',
    authorize: () => ({ ok: false, status: 401, error: 'authentication-required' }),
    logger: () => {}
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/readyz`);
    return { status: response.status, body: await response.json() };
  } finally {
    server.close();
    await once(server, 'close');
  }
}

const matching = await requestReadiness('3');
assert.equal(matching.status, 200);
assert.equal(matching.body.ok, true);
assert.equal(matching.body.schemaVersion, '3');

const stale = await requestReadiness('2');
assert.equal(stale.status, 503);
assert.equal(stale.body.error, 'database-schema-version-mismatch');
assert.equal(stale.body.requiredSchemaVersion, '3');
assert.equal(stale.body.actualSchemaVersion, '2');

const missing = await requestReadiness(null);
assert.equal(missing.status, 503);
assert.equal(missing.body.error, 'database-schema-version-mismatch');
assert.equal(missing.body.actualSchemaVersion, null);

console.log('Database schema readiness gate passed.');
