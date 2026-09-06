import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer, createDevelopmentCredentialStore } from '../apps/api/src/server.mjs';
import { createFixedWindowRateLimiter } from '../apps/api/src/rate-limit.mjs';
import { createServiceTokenAuthorizer } from '../apps/api/src/security.mjs';

const ADMIN_TOKEN = 'test-admin-token-0123456789-abcdefghijklmnopqrstuvwxyz';
const READ_ONLY_TOKEN = 'test-read-token-0123456789-abcdefghijklmnopqrstuvwxyz';

function makeStore() {
  const store = createDevelopmentCredentialStore();
  store.register({
    id: 'issued-credential-001',
    verificationId: 'verify-public-001',
    status: 'valid',
    credentialDefinitionVersion: '1.0.0',
    courseId: 'COURSE-CULT-FOUNDATIONS-001',
    courseVersion: '1.0.0',
    issuer: { id: 'THC-ACADEMY', name: 'THC Academy' },
    issuedAt: '2026-09-05T12:00:00.000Z',
    expiresAt: null,
    learnerId: 'private-learner-id',
    subjectHash: 'private-subject-hash',
    payloadJson: { private: true }
  });
  return store;
}

function authorizer() {
  return createServiceTokenAuthorizer({
    tokens: [
      { token: ADMIN_TOKEN, subject: 'admin-test', scopes: ['admin:read'] },
      { token: READ_ONLY_TOKEN, subject: 'reader-test', scopes: ['credential:read'] }
    ]
  });
}

async function startServer(options = {}) {
  const server = createApiServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { response, body };
}

const logs = [];
const primary = await startServer({
  credentialStore: makeStore(),
  limiter: createFixedWindowRateLimiter({ limit: 100, windowMs: 60_000 }),
  authorize: authorizer(),
  logger: (entry) => logs.push(entry)
});

try {
  const health = await request(primary.baseUrl, '/healthz');
  assert.equal(health.response.status, 200);
  assert.equal(health.body.ok, true);
  assert.match(health.response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
  assert.equal(health.response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(health.response.headers.get('content-security-policy'), /default-src 'none'/);

  const publicCredential = await request(primary.baseUrl, '/api/v1/credentials/verify-public-001');
  assert.equal(publicCredential.response.status, 200);
  assert.equal(publicCredential.body.verificationId, 'verify-public-001');
  assert.equal('learnerId' in publicCredential.body, false);
  assert.equal('subjectHash' in publicCredential.body, false);
  assert.equal(JSON.stringify(publicCredential.body).includes('private-learner-id'), false);
  assert.equal(JSON.stringify(publicCredential.body).includes('private-subject-hash'), false);

  const noAuth = await request(primary.baseUrl, '/api/v1/admin/diagnostics');
  assert.equal(noAuth.response.status, 401);
  assert.match(noAuth.response.headers.get('www-authenticate'), /^Bearer/);

  const wrongScope = await request(primary.baseUrl, '/api/v1/admin/diagnostics', {
    headers: { authorization: `Bearer ${READ_ONLY_TOKEN}` }
  });
  assert.equal(wrongScope.response.status, 403);
  assert.equal(wrongScope.body.error, 'insufficient-scope');

  const authorized = await request(primary.baseUrl, '/api/v1/admin/diagnostics', {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  assert.equal(authorized.response.status, 200);
  assert.equal(authorized.body.authenticatedSubject, 'admin-test');
  assert.equal(authorized.body.storageAdapter, 'development-memory');

  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(logs.length >= 5);
  for (const entry of logs) {
    assert.equal(entry.event, 'http.request.completed');
    assert.ok(entry.requestId);
    assert.ok(entry.route);
    const serialized = JSON.stringify(entry);
    assert.equal(serialized.includes(ADMIN_TOKEN), false);
    assert.equal(serialized.includes(READ_ONLY_TOKEN), false);
    assert.equal(serialized.includes('verify-public-001'), false);
    assert.equal('authorization' in entry, false);
  }
} finally {
  primary.server.close();
  await once(primary.server, 'close');
}

const limited = await startServer({
  credentialStore: makeStore(),
  limiter: createFixedWindowRateLimiter({ limit: 2, windowMs: 60_000 }),
  authorize: authorizer(),
  logger: () => {}
});

try {
  const first = await request(limited.baseUrl, '/api/v1/credentials/verify-public-001');
  const second = await request(limited.baseUrl, '/api/v1/credentials/verify-public-001');
  const third = await request(limited.baseUrl, '/api/v1/credentials/verify-public-001');
  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 200);
  assert.equal(third.response.status, 429);
  assert.equal(third.body.error, 'rate-limit-exceeded');
  assert.equal(third.response.headers.get('ratelimit-remaining'), '0');
  assert.ok(Number(third.response.headers.get('retry-after')) >= 1);
} finally {
  limited.server.close();
  await once(limited.server, 'close');
}

assert.throws(
  () => createServiceTokenAuthorizer({ tokens: [{ token: 'too-short', scopes: ['admin:read'] }] }),
  /at least 32 characters/
);

const unconfigured = createServiceTokenAuthorizer();
assert.deepEqual(unconfigured({ headers: {} }, 'admin:read'), {
  ok: false,
  status: 503,
  error: 'authentication-not-configured'
});

console.log('API security, privacy, rate limiting and observability tests passed');
