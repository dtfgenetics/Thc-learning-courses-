import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';
import { transitionCredential } from '../packages/domain/credential-runtime.mjs';

const ADMIN_READ = 'lifecycle-admin-read-token-0123456789-abcdefghijklmnopqrstuvwxyz';
const ADMIN_WRITE = 'lifecycle-admin-write-token-0123456789-abcdefghijklmnopqrstuvwxyz';

let record = {
  id: 'CREDENTIAL-RUNTIME-TECH2-001',
  verificationId: 'VERIFY-TECH2-LIFECYCLE-001',
  credentialDefinitionId: 'CRED-CULT-TECH-II-001',
  credentialDefinitionVersion: '1.0.0',
  courseId: 'COURSE-CULT-TECH-II-001',
  courseVersion: '1.0.0',
  status: 'valid',
  issuedAt: '2026-09-01T12:00:00.000Z',
  expiresAt: null,
  issuer: { name: 'Teaching Healthy Cultivation', url: 'https://dtfseeds.com/' },
  payloadJson: { publicEvidenceSummary: { writtenAssessments: 1, performanceAssessments: 8, portfolioArtifacts: 9 } }
};
let history = [
  { status: 'valid', reason: 'initial-validation', actorId: 'PRIVATE-SYSTEM', createdAt: '2026-09-01T12:01:00.000Z' },
  { status: 'suspended', reason: 'PRIVATE-INVESTIGATION', actorId: 'PRIVATE-ADMIN-A', createdAt: '2026-09-02T12:01:00.000Z' },
  { status: 'valid', reason: 'PRIVATE-CLEARED', actorId: 'PRIVATE-ADMIN-B', createdAt: '2026-09-03T12:01:00.000Z' }
];

const credentialStore = {
  kind: 'test-lifecycle-store',
  async ping() { return true; },
  async schemaVersion() { return '4'; },
  async getByVerificationId(id) { return id === record.verificationId ? { ...record } : null; },
  async listStatusHistoryByVerificationId(id) { return id === record.verificationId ? history.map((row) => ({ ...row })) : []; },
  async count() { return 1; }
};
const credentialWriter = {
  kind: 'test-lifecycle-writer',
  async transitionById(id, nextStatus, { actorId, reason, now = '2026-09-06T19:30:00.000Z' } = {}) {
    assert.equal(id, record.id);
    const result = transitionCredential(record, nextStatus, { actorId, reason, now });
    record = { ...record, status: result.credential.status };
    history.push({ status: nextStatus, reason: reason ?? null, actorId, createdAt: now });
    return result;
  }
};
function authorize(req, scope) {
  const token = String(req.headers?.authorization ?? '').replace(/^Bearer\s+/i, '');
  const scopes = token === ADMIN_WRITE ? ['admin:read','admin:write'] : token === ADMIN_READ ? ['admin:read'] : [];
  if (!scopes.length) return { ok:false, status:401, error:'authentication-required' };
  if (!scopes.includes(scope)) return { ok:false, status:403, error:'insufficient-scope' };
  return { ok:true, subject: token === ADMIN_WRITE ? 'ADMIN-WRITER' : 'ADMIN-READER', scopes };
}

const server = createApiServer({ credentialStore, credentialWriter, authorize, logger: () => {} });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  return { response, body: await response.json() };
}

try {
  const publicResult = await request('/api/v1/credentials/VERIFY-TECH2-LIFECYCLE-001');
  assert.equal(publicResult.response.status, 200);
  assert.equal(publicResult.body.status, 'valid');
  assert.equal(publicResult.body.credential.version, '1.0.0');
  assert.equal(publicResult.body.credential.currentDefinitionVersion, '1.0.0');
  assert.equal(publicResult.body.lifecycle.validityType, 'indefinite');
  assert.equal(publicResult.body.lifecycle.renewalRequired, false);
  assert.equal(publicResult.body.statusHistory.length, 3);
  assert.equal(publicResult.body.evidenceSummary.performanceAssessments, 8);
  const publicSerialized = JSON.stringify(publicResult.body);
  for (const forbidden of ['PRIVATE-SYSTEM','PRIVATE-ADMIN-A','PRIVATE-ADMIN-B','PRIVATE-INVESTIGATION','PRIVATE-CLEARED','actorId','reason']) {
    assert.equal(publicSerialized.includes(forbidden), false, `public verification leaked ${forbidden}`);
  }

  const historyNoAuth = await request('/api/v1/admin/credentials/VERIFY-TECH2-LIFECYCLE-001/history');
  assert.equal(historyNoAuth.response.status, 401);

  const historyResult = await request('/api/v1/admin/credentials/VERIFY-TECH2-LIFECYCLE-001/history', { headers: { authorization: `Bearer ${ADMIN_READ}` } });
  assert.equal(historyResult.response.status, 200);
  assert.equal(historyResult.body.history[1].reason, 'PRIVATE-INVESTIGATION');
  assert.equal(historyResult.body.history[1].actorId, 'PRIVATE-ADMIN-A');

  const readOnlyWrite = await request('/api/v1/admin/credentials/VERIFY-TECH2-LIFECYCLE-001/status', {
    method: 'POST', headers: { authorization: `Bearer ${ADMIN_READ}`, 'content-type': 'application/json' }, body: JSON.stringify({ status:'suspended', reason:'review' })
  });
  assert.equal(readOnlyWrite.response.status, 403);

  const suspend = await request('/api/v1/admin/credentials/VERIFY-TECH2-LIFECYCLE-001/status', {
    method: 'POST', headers: { authorization: `Bearer ${ADMIN_WRITE}`, 'content-type': 'application/json' }, body: JSON.stringify({ status:'suspended', reason:'evidence-review' })
  });
  assert.equal(suspend.response.status, 200);
  assert.equal(suspend.body.credential.status, 'suspended');
  assert.equal(record.status, 'suspended');

  const reinstate = await request('/api/v1/admin/credentials/VERIFY-TECH2-LIFECYCLE-001/status', {
    method: 'POST', headers: { authorization: `Bearer ${ADMIN_WRITE}`, 'content-type': 'application/json' }, body: JSON.stringify({ status:'valid', reason:'review-cleared' })
  });
  assert.equal(reinstate.response.status, 200);
  assert.equal(record.status, 'valid');

  const invalid = await request('/api/v1/admin/credentials/VERIFY-TECH2-LIFECYCLE-001/status', {
    method: 'POST', headers: { authorization: `Bearer ${ADMIN_WRITE}`, 'content-type': 'application/json' }, body: JSON.stringify({ status:'issued' })
  });
  assert.equal(invalid.response.status, 400);
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Credential lifecycle API, privacy, history, suspension and reinstatement tests passed.');
