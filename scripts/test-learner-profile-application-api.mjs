import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const profiles = new Map();
const applications = new Map();
const learnerStore = {
  kind: 'memory-test-learner',
  async getLearnerProfile(subject) {
    return profiles.get(subject) ?? { learnerReference: `THC-LRN-${subject.toUpperCase()}`, displayName: null, certificateName: null };
  },
  async saveLearnerProfile(subject, profile) {
    const saved = {
      learnerReference: profiles.get(subject)?.learnerReference ?? `THC-LRN-${subject.toUpperCase()}`,
      displayName: profile.displayName ?? null,
      certificateName: profile.certificateName ?? null
    };
    profiles.set(subject, saved);
    return saved;
  },
  async listApplications(subject) { return [...(applications.get(subject) ?? [])]; },
  async createApplication(subject, { programId }) {
    const rows = applications.get(subject) ?? [];
    const existing = rows.find((row) => row.programId === programId);
    if (existing) return existing;
    const saved = {
      applicationReference: `THC-APP-${String(rows.length + 1).padStart(4, '0')}`,
      programId,
      status: 'active',
      createdAt: '2026-09-25T18:00:00.000Z',
      updatedAt: '2026-09-25T18:00:00.000Z'
    };
    rows.push(saved);
    applications.set(subject, rows);
    return saved;
  }
};
const credentialStore = {
  kind: 'memory-test-credential',
  async ping() { return true; },
  async schemaVersion() { return '6'; },
  async getByVerificationId() { return null; }
};
function authorize(req, scope) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/, '');
  if (!token) return { ok: false, status: 401, error: 'authentication-required' };
  return { ok: true, subject: token, scopes: [scope] };
}

const server = createApiServer({
  env: { NODE_ENV: 'production' },
  credentialStore,
  learnerStore,
  requiredSchemaVersion: '6',
  authorize,
  logger: () => {}
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

try {
  let response = await fetch(`${base}/api/v1/me/profile`);
  assert.equal(response.status, 401);

  response = await fetch(`${base}/api/v1/me/profile`, { headers: { authorization: 'Bearer learner-1' } });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.match(body.profile.learnerReference, /^THC-LRN-/);

  response = await fetch(`${base}/api/v1/me/profile`, {
    method: 'PUT',
    headers: { authorization: 'Bearer learner-1', 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Test Learner', certificateName: 'Test Learner' })
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.profile.certificateName, 'Test Learner');

  response = await fetch(`${base}/api/v1/me/applications`, {
    method: 'POST',
    headers: { authorization: 'Bearer learner-1', 'content-type': 'application/json' },
    body: JSON.stringify({ programId: 'CREDPROG-CULT-TECH-I-001' })
  });
  assert.equal(response.status, 201);
  body = await response.json();
  assert.match(body.application.applicationReference, /^THC-APP-/);
  assert.equal(body.application.programId, 'CREDPROG-CULT-TECH-I-001');

  response = await fetch(`${base}/api/v1/me/applications`, { headers: { authorization: 'Bearer learner-1' } });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.applications.length, 1);
  assert.equal(body.applications[0].status, 'active');

  response = await fetch(`${base}/api/v1/me/applications`, {
    method: 'POST',
    headers: { authorization: 'Bearer learner-1', 'content-type': 'application/json' },
    body: JSON.stringify({ programId: 'CREDPROG-NOT-REAL-001' })
  });
  assert.equal(response.status, 404);
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Learner profile and credential application API contract passed.');
