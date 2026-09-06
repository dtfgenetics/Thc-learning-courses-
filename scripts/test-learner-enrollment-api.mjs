import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const enrollments = new Map();
const learnerStore = {
  kind: 'memory-test-learner',
  async listEnrollments(subject) { return [...(enrollments.get(subject) ?? [])]; },
  async enroll(subject, record) {
    const rows = enrollments.get(subject) ?? [];
    const existing = rows.find((row) => row.courseId === record.courseId && row.courseVersion === record.courseVersion);
    if (existing) return existing;
    const saved = {
      courseId: record.courseId,
      courseVersion: record.courseVersion,
      status: 'active',
      enrolledAt: '2026-09-06T13:00:00.000Z',
      completedAt: null
    };
    rows.push(saved);
    enrollments.set(subject, rows);
    return saved;
  },
  async listProgress() { return []; },
  async setLessonProgress() { throw new Error('not used'); }
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
  let response = await fetch(`${base}/api/v1/me/enrollments`);
  assert.equal(response.status, 401);

  response = await fetch(`${base}/api/v1/me/enrollments`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: 'COURSE-CULT-FOUNDATIONS-001', courseVersion: '1.0.0' })
  });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.enrollment.courseId, 'COURSE-CULT-FOUNDATIONS-001');
  assert.equal(body.enrollment.courseVersion, '1.0.0');
  assert.equal(body.enrollment.status, 'active');
  assert.equal(Object.hasOwn(body.enrollment, 'passed'), false);
  assert.equal(Object.hasOwn(body.enrollment, 'credential'), false);

  response = await fetch(`${base}/api/v1/me/enrollments`, { headers: { authorization: 'Bearer alice' } });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.learner.subject, 'subject-alice');
  assert.equal(body.enrollments.length, 1);

  response = await fetch(`${base}/api/v1/me/enrollments`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: 'COURSE-CULT-FOUNDATIONS-001', courseVersion: '1.0.0' })
  });
  assert.equal(response.status, 200, 'enrollment should be idempotent');
  response = await fetch(`${base}/api/v1/me/enrollments`, { headers: { authorization: 'Bearer alice' } });
  assert.equal((await response.json()).enrollments.length, 1);

  response = await fetch(`${base}/api/v1/me/enrollments`, { headers: { authorization: 'Bearer bob' } });
  assert.equal((await response.json()).enrollments.length, 0, 'enrollments must be isolated by verified subject');

  response = await fetch(`${base}/api/v1/me/enrollments`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: 'COURSE-NOT-REAL-001', courseVersion: '1.0.0' })
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'course-not-found');

  response = await fetch(`${base}/api/v1/me/enrollments`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: 'COURSE-CULT-FOUNDATIONS-001', courseVersion: '0.9.0' })
  });
  assert.equal(response.status, 409);
  body = await response.json();
  assert.equal(body.error, 'course-version-mismatch');
  assert.equal(body.currentVersion, '1.0.0');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Authenticated learner enrollment API passed.');
