import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const attemptsBySubject = new Map();
function subjectAttempts(subject) {
  const map = attemptsBySubject.get(subject) ?? new Map();
  attemptsBySubject.set(subject, map);
  return map;
}
const learnerStore = {
  kind: 'memory-assessment-test',
  async createAssessmentAttempt(subject, attempt) {
    const map = subjectAttempts(subject);
    map.set(attempt.id, structuredClone(attempt));
    return structuredClone(attempt);
  },
  async getAssessmentAttempt(subject, attemptId) {
    const row = subjectAttempts(subject).get(attemptId);
    return row ? structuredClone(row) : null;
  },
  async saveSubmittedAssessmentAttempt(subject, attempt) {
    const map = subjectAttempts(subject);
    const current = map.get(attempt.id);
    if (!current || current.status !== 'started') throw new Error('assessment-attempt-transition-conflict');
    map.set(attempt.id, structuredClone(attempt));
    return structuredClone(attempt);
  },
  async saveScoredAssessmentAttempt(subject, attempt) {
    const map = subjectAttempts(subject);
    const current = map.get(attempt.id);
    if (!current || current.status !== 'submitted') throw new Error('assessment-attempt-transition-conflict');
    map.set(attempt.id, structuredClone(attempt));
    return structuredClone(attempt);
  }
};
const credentialStore = {
  kind: 'memory-test-credential',
  async ping() { return true; },
  async schemaVersion() { return '4'; },
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
  env: { NODE_ENV: 'development' },
  credentialStore,
  learnerStore,
  authorize,
  logger: () => {}
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const assessmentId = 'ASSESS-CULT-FOUNDATIONS-FINAL-001';

try {
  let response = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, { method: 'POST' });
  assert.equal(response.status, 401);

  response = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(response.status, 201);
  let body = await response.json();
  const attemptId = body.attempt.id;
  assert.equal(body.attempt.status, 'started');
  assert.equal(body.attempt.assessmentId, assessmentId);
  assert.equal(body.attempt.items.length, 60);
  for (const item of body.attempt.items) {
    assert.equal(Object.hasOwn(item, 'correct'), false);
    assert.equal(Object.hasOwn(item, 'rationale'), false);
    assert.equal(Object.hasOwn(item, 'references'), false);
    assert.equal(Object.hasOwn(item, 'score'), false);
  }

  response = await fetch(`${base}/api/v1/me/assessment-attempts/${attemptId}`, { headers: { authorization: 'Bearer bob' } });
  assert.equal(response.status, 404, 'cross-learner reads must not reveal attempt existence');

  response = await fetch(`${base}/api/v1/me/assessment-attempts/${attemptId}`, { headers: { authorization: 'Bearer alice' } });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.attempt.status, 'started');

  const responses = body.attempt.items.map((item) => ({
    itemId: item.itemId,
    itemVersion: item.itemVersion,
    response: 0
  }));
  response = await fetch(`${base}/api/v1/me/assessment-attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ responses })
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.attempt.status, 'scored');
  assert.equal(typeof body.attempt.scorePercent, 'number');
  assert.equal(typeof body.attempt.passed, 'boolean');
  assert.equal(body.attempt.competencies.length, 12);
  for (const item of body.attempt.items) {
    assert.equal(Object.hasOwn(item, 'correct'), false);
    assert.equal(Object.hasOwn(item, 'rationale'), false);
    assert.equal(Object.hasOwn(item, 'references'), false);
    assert.equal(Object.hasOwn(item, 'score'), false);
  }

  response = await fetch(`${base}/api/v1/me/assessment-attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ responses })
  });
  assert.equal(response.status, 200, 'scored submit retry should be idempotent');
  assert.equal((await response.json()).attempt.status, 'scored');

  response = await fetch(`${base}/api/v1/me/assessments/ASSESS-NOT-REAL-001/attempts`, {
    method: 'POST',
    headers: { authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(response.status, 404);

  const newResponse = await fetch(`${base}/api/v1/me/assessments/${assessmentId}/attempts`, {
    method: 'POST',
    headers: { authorization: 'Bearer bob', 'content-type': 'application/json' },
    body: '{}'
  });
  const second = await newResponse.json();
  const bad = [{ itemId: 'ITEM-NOT-IN-FORM', itemVersion: 1, response: 0 }];
  response = await fetch(`${base}/api/v1/me/assessment-attempts/${second.attempt.id}/submit`, {
    method: 'POST',
    headers: { authorization: 'Bearer bob', 'content-type': 'application/json' },
    body: JSON.stringify({ responses: bad })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'invalid-assessment-responses');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Authenticated learner assessment API passed.');
