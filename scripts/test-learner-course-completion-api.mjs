import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const progressBySubject = new Map();
const learnerStore = {
  kind: 'memory-course-completion-test',
  async listProgress(subject) { return [...(progressBySubject.get(subject) ?? [])]; }
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
  if (token !== 'alice') return { ok: false, status: 401, error: 'invalid-authentication' };
  if (scope !== 'learner:read') return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'subject-alice', scopes: ['learner:read'] };
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
  let response = await fetch(`${base}/api/v1/me/courses/COURSE-CULT-FOUNDATIONS-001/completion`);
  assert.equal(response.status, 401);

  response = await fetch(`${base}/api/v1/me/courses/COURSE-NOT-REAL-999/completion`, {
    headers: { authorization: 'Bearer alice' }
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'course-not-found');

  response = await fetch(`${base}/api/v1/me/courses/COURSE-CULT-FOUNDATIONS-001/completion`, {
    headers: { authorization: 'Bearer alice' }
  });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.learner.subject, 'subject-alice');
  assert.equal(body.completion.courseId, 'COURSE-CULT-FOUNDATIONS-001');
  assert.equal(body.completion.courseVersion, '1.0.0');
  assert.equal(body.completion.contentStatus, 'not-started');
  assert.equal(body.completion.totalModules, 12);
  assert.equal(body.completion.totalLessons, 36);
  assert.equal(body.completion.completedLessons, 0);
  assert.equal(body.completion.finalAssessmentSatisfied, null);
  assert.equal(body.completion.credentialEligibilitySatisfied, null);

  progressBySubject.set('subject-alice', [
    {
      lessonId: 'LESSON-ENV-VPD-001',
      lessonVersion: '1.0.0',
      status: 'completed',
      completedAt: '2026-09-06T20:00:00.000Z'
    },
    {
      lessonId: 'LESSON-ENV-SENSORS-002',
      lessonVersion: '0.9.0',
      status: 'completed',
      completedAt: '2026-09-06T20:01:00.000Z'
    }
  ]);

  response = await fetch(`${base}/api/v1/me/courses/COURSE-CULT-FOUNDATIONS-001/completion`, {
    headers: { authorization: 'Bearer alice' }
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.completion.contentStatus, 'in-progress');
  assert.equal(body.completion.completedLessons, 1);
  assert.equal(body.completion.totalLessons, 36);
  assert.equal(body.completion.unexpectedProgress.length, 1, 'stale lesson version must be reported but not counted');
  const environment = body.completion.modules.find((module) => module.moduleId === 'MOD-ENV-001');
  assert.ok(environment);
  assert.equal(environment.completedLessons, 1);
  assert.equal(environment.totalLessons, 3);
  assert.equal(environment.status, 'in-progress');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Authenticated learner course completion API passed.');
