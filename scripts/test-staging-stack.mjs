import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';
import { createApiServer, createDevelopmentCredentialStore } from '../apps/api/src/server.mjs';
import { createServiceTokenAuthorizer } from '../apps/api/src/security.mjs';

const adminToken = 'staging-smoke-admin-token-0123456789abcdef';
const web = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
const api = createApiServer({
  env: { ...process.env, NODE_ENV: 'development' },
  credentialStore: createDevelopmentCredentialStore(),
  authorize: createServiceTokenAuthorizer({
    tokens: [{ token: adminToken, subject: 'staging-smoke', scopes: ['admin:read'] }]
  }),
  logger: () => {}
});

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function close(server) {
  server.close();
  await once(server, 'close');
}

const webBase = await listen(web);
const apiBase = await listen(api);

try {
  const webHealth = await fetch(`${webBase}/healthz`);
  assert.equal(webHealth.status, 200);
  assert.equal((await webHealth.json()).ok, true);

  const catalogResponse = await fetch(`${webBase}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.ok(catalog.courses.length > 0, 'staging catalog must contain courses');

  const lessonId = catalog.courses
    .flatMap((course) => course.modules)
    .flatMap((module) => module.lessons)
    .map((lesson) => lesson.id)
    .find(Boolean);
  assert.ok(lessonId, 'staging catalog must contain at least one lesson');
  const lessonResponse = await fetch(`${webBase}/api/lessons/${lessonId}`);
  assert.equal(lessonResponse.status, 200);

  const apiHealth = await fetch(`${apiBase}/healthz`);
  assert.equal(apiHealth.status, 200);
  assert.equal((await apiHealth.json()).ok, true);

  const apiReady = await fetch(`${apiBase}/readyz`);
  assert.equal(apiReady.status, 200);
  assert.equal((await apiReady.json()).ok, true);

  const unauthenticated = await fetch(`${apiBase}/api/v1/admin/diagnostics`);
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.headers.get('www-authenticate') ?? '', /Bearer/);

  const invalidToken = await fetch(`${apiBase}/api/v1/admin/diagnostics`, {
    headers: { authorization: 'Bearer definitely-not-the-token' }
  });
  assert.equal(invalidToken.status, 401);

  const authenticated = await fetch(`${apiBase}/api/v1/admin/diagnostics`, {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert.equal(authenticated.status, 200);
  const diagnostics = await authenticated.json();
  assert.equal(diagnostics.ok, true);
  assert.equal(diagnostics.storageAdapter, 'development-memory');
  assert.equal(diagnostics.authenticatedSubject, 'staging-smoke');

  console.log(`Staging stack smoke passed; courses=${catalog.courses.length}; sampleLesson=${lessonId}; apiReady=true; adminAuth=true.`);
} finally {
  await Promise.all([close(web), close(api)]);
}
