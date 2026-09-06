import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const store = new Map();
const learnerStore = {
  kind: 'memory-test-learner',
  async listProgress(subject) { return [...(store.get(subject) ?? [])]; },
  async setLessonProgress(subject, record) {
    const rows = store.get(subject) ?? [];
    const next = rows.filter((row) => !(row.lessonId === record.lessonId && row.lessonVersion === record.lessonVersion));
    const saved = { ...record, completedAt: record.status === 'completed' ? '2026-09-06T13:00:00.000Z' : null };
    next.push(saved);
    store.set(subject, next);
    return saved;
  }
};
const credentialStore = {
  kind: 'memory-test-credential',
  async ping() { return true; },
  async schemaVersion() { return '1'; },
  async getByVerificationId() { return null; },
  async count() { return 0; }
};
function authorize(req, scope) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/, '');
  if (!token) return { ok: false, status: 401, error: 'authentication-required' };
  if (!['alice', 'bob'].includes(token)) return { ok: false, status: 401, error: 'invalid-authentication' };
  const scopes = ['learner:read', 'learner:write'];
  if (!scopes.includes(scope)) return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: `subject-${token}`, scopes };
}

const server = createApiServer({
  env: { NODE_ENV: 'production' },
  credentialStore,
  learnerStore,
  requiredSchemaVersion: '1',
  authorize,
  logger: () => {}
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

try {
  let response = await fetch(`${base}/api/v1/me/progress`);
  assert.equal(response.status, 401);

  response = await fetch(`${base}/api/v1/me/lessons/LESSON-ENV-VPD-001`, {
    method: 'PUT',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ lessonVersion: '1.0.0', status: 'completed' })
  });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.progress.lessonId, 'LESSON-ENV-VPD-001');
  assert.equal(body.progress.status, 'completed');

  response = await fetch(`${base}/api/v1/me/progress`, { headers: { authorization: 'Bearer alice' } });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.learner.subject, 'subject-alice');
  assert.equal(body.progress.length, 1);
  assert.equal(JSON.stringify(body).includes('score'), false);
  assert.equal(JSON.stringify(body).includes('credential'), false);

  response = await fetch(`${base}/api/v1/me/progress`, { headers: { authorization: 'Bearer bob' } });
  body = await response.json();
  assert.equal(body.progress.length, 0, 'learner progress must be isolated by verified subject');

  response = await fetch(`${base}/api/v1/me/lessons/LESSON-ENV-VPD-001`, {
    method: 'PUT',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ lessonVersion: '1.0.0', status: 'passed' })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'invalid-lesson-progress');

  response = await fetch(`${base}/api/v1/me/lessons/LESSON-ENV-VPD-001`, {
    method: 'PUT',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ lessonVersion: '1.0.1', status: 'completed' })
  });
  assert.equal(response.status, 409);
  let mismatch = await response.json();
  assert.equal(mismatch.error, 'lesson-version-mismatch');
  assert.equal(mismatch.currentVersion, '1.0.0');

  response = await fetch(`${base}/api/v1/me/lessons/LESSON-NOT-REAL-999`, {
    method: 'PUT',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ lessonVersion: '1.0.0', status: 'completed' })
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'lesson-not-found');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Authenticated learner progress API passed.');
