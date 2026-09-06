import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';
import { createPostgresCredentialStore } from '../apps/api/src/postgres-credential-store.mjs';

const SECRET_ERROR_TEXT = 'postgres://user:super-secret-password@db.internal/database';
const logs = [];
const store = createPostgresCredentialStore({
  query: async () => {
    throw new Error(SECRET_ERROR_TEXT);
  }
});

const server = createApiServer({
  credentialStore: store,
  env: { NODE_ENV: 'production' },
  logger: (entry) => logs.push(entry)
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

async function get(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  return { response, body: JSON.parse(await response.text()) };
}

try {
  const health = await get('/healthz');
  assert.equal(health.response.status, 200, 'liveness must not depend on PostgreSQL');
  assert.equal(health.body.ok, true);

  const ready = await get('/readyz');
  assert.equal(ready.response.status, 503);
  assert.equal(ready.body.error, 'service-unavailable');

  const verification = await get('/api/v1/credentials/VERIFY-FAIL-001');
  assert.equal(verification.response.status, 503);
  assert.equal(verification.body.error, 'service-unavailable');
  assert.equal(JSON.stringify(verification.body).includes(SECRET_ERROR_TEXT), false);

  await new Promise((resolve) => setImmediate(resolve));
  const serializedLogs = JSON.stringify(logs);
  assert.equal(serializedLogs.includes(SECRET_ERROR_TEXT), false, 'database error messages/secrets must not be logged');
  assert.ok(logs.some((entry) => entry.event === 'http.request.failed' && entry.statusCode === 503));
  assert.ok(logs.some((entry) => entry.route === 'GET /api/v1/credentials/:verificationId'));
} finally {
  server.close();
  await once(server, 'close');
}

const missingReadinessServer = createApiServer({
  credentialStore: {
    kind: 'test-no-ping',
    async getByVerificationId() { return null; },
    async count() { return 0; }
  },
  logger: () => {}
});
missingReadinessServer.listen(0, '127.0.0.1');
await once(missingReadinessServer, 'listening');
try {
  const address = missingReadinessServer.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/readyz`);
  const body = JSON.parse(await response.text());
  assert.equal(response.status, 503);
  assert.equal(body.error, 'readiness-check-unavailable');
} finally {
  missingReadinessServer.close();
  await once(missingReadinessServer, 'close');
}

console.log('API database failure handling and readiness tests passed');
