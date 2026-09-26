import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import { createApiServer } from '../apps/api/src/server.mjs';

const evidence = JSON.parse(fs.readFileSync('tests/fixtures/tech1-eligibility-pass.json','utf8'));
let signerCalls = 0;
let writerCalls = 0;

const credentialStore = {
  kind: 'test-persistent',
  async ping() { return true; },
  async schemaVersion() { return '7'; },
  async getByVerificationId() { return null; },
  async listBySubjectHash() { return []; },
  async count() { return 0; }
};

const learnerStore = {
  async listCredentialEvidence(subject, { credentialDefinitionId }) {
    assert.equal(subject, 'learner-tech1');
    assert.equal(credentialDefinitionId, 'CRED-CULT-TECH-I-001');
    return structuredClone(evidence);
  },
  async getLearnerProfile(subject) {
    assert.equal(subject, 'learner-tech1');
    return { learnerReference: 'THC-LRN-TECH1', displayName: 'Test Learner', certificateName: 'Test Learner' };
  },
  async listApplications(subject) {
    assert.equal(subject, 'learner-tech1');
    return [{ programId: 'CREDPROG-CULT-TECH-I-001', applicationReference: 'THC-APP-TECH1', status: 'active' }];
  }
};

const credentialWriter = {
  async issueCredential() {
    writerCalls += 1;
    throw new Error('release-blocked issuance must never write');
  }
};
const credentialSigner = {
  issuer: { issuerId: 'THC-ACADEMY', name: 'Teaching Healthy Cultivation', url: 'https://dtfseeds.com/' },
  async signCredentialPayload() {
    signerCalls += 1;
    throw new Error('release-blocked issuance must never sign');
  }
};

const authorize = (req, scope) => {
  if (req.headers.authorization !== 'Bearer admin-token') return { ok: false, status: 401, error: 'authentication-required' };
  if (scope !== 'admin:write') return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'credential-admin', scopes: ['admin:write'], mfaVerified: true };
};

const server = createApiServer({
  env: { NODE_ENV: 'production' },
  credentialStore,
  credentialWriter,
  credentialSigner,
  learnerStore,
  requiredSchemaVersion: '7',
  authorize,
  logger: () => {}
});
server.listen(0,'127.0.0.1');
await once(server,'listening');

try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const path = `${base}/api/v1/admin/credentials/CRED-CULT-TECH-I-001/issue`;

  const unauthorized = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ learnerSubject: 'learner-tech1' })
  });
  assert.equal(unauthorized.status, 401);

  const missingLearner = await fetch(path, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(missingLearner.status, 400);
  assert.equal((await missingLearner.json()).error, 'learner-subject-required');

  const blocked = await fetch(path, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token', accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ learnerSubject: 'learner-tech1' })
  });
  assert.equal(blocked.status, 409);
  const body = await blocked.json();
  assert.equal(body.error, 'credential-not-eligible');
  assert.equal(body.requirementsSatisfied, true);
  assert.equal(body.releaseAuthorized, false);
  assert.ok(Array.isArray(body.releaseBlockers) && body.releaseBlockers.length > 0);
  assert.equal(signerCalls, 0);
  assert.equal(writerCalls, 0);
} finally {
  server.close();
  await once(server,'close');
}

console.log('Credential issuance HTTP API authentication and fail-closed release contract passed.');
