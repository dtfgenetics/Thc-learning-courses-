import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

let receivedSubjectHash = null;
const credentialStore = {
  kind: 'test-persistent',
  async ping() { return true; },
  async schemaVersion() { return '7'; },
  async getByVerificationId() { return null; },
  async listBySubjectHash(subjectHash) {
    receivedSubjectHash = subjectHash;
    return [{
      id: 'credential-private-1',
      verificationId: 'VERIFY-PRIVATE-001',
      subjectHash: 'must-not-leak',
      credentialDefinitionId: 'CRED-CULT-TECH-I-001',
      credentialDefinitionVersion: '1.0.0',
      courseId: 'COURSE-LH-TECH1-007',
      courseVersion: '0.2.0',
      status: 'issued',
      issuedAt: '2026-09-25T23:00:00.000Z',
      expiresAt: null,
      payloadHash: 'must-not-leak',
      payloadJson: {
        recipient: {
          learnerReference: 'THC-LRN-001',
          certificateName: 'Test Learner',
          applicationReference: 'THC-APP-001'
        },
        issuer: { issuerId: 'THC-ACADEMY', name: 'Teaching Healthy Cultivation', url: 'https://dtfseeds.com/' },
        evidence: { private: true },
        integrity: { signature: 'must-not-leak', keyId: 'must-not-leak', digest: 'must-not-leak' }
      }
    }];
  },
  async count() { return 1; }
};

const authorize = (req, scope) => {
  if (req.headers.authorization !== 'Bearer learner-token') return { ok: false, status: 401, error: 'authentication-required' };
  if (scope !== 'learner:read') return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'learner-private-001', scopes: ['learner:read'] };
};

const server = createApiServer({
  env: { NODE_ENV: 'production' },
  credentialStore,
  requiredSchemaVersion: '7',
  authorize,
  logger: () => {}
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');

try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const unauthorized = await fetch(`${base}/api/v1/me/credentials`);
  assert.equal(unauthorized.status, 401);

  const response = await fetch(`${base}/api/v1/me/credentials`, {
    headers: { authorization: 'Bearer learner-token', accept: 'application/json' }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.credentials.length, 1);
  assert.match(receivedSubjectHash, /^[a-f0-9]{64}$/);
  assert.notEqual(receivedSubjectHash, 'learner-private-001');

  const credential = body.credentials[0];
  assert.equal(credential.credential.id, 'CRED-CULT-TECH-I-001');
  assert.equal(credential.credential.title, 'THC Cultivation Technician I');
  assert.equal(credential.recipient.certificateName, 'Test Learner');
  assert.equal(credential.recipient.learnerReference, 'THC-LRN-001');
  assert.equal(credential.recipient.applicationReference, 'THC-APP-001');
  assert.equal(credential.verificationId, 'VERIFY-PRIVATE-001');

  const serialized = JSON.stringify(body);
  for (const forbidden of ['subjectHash','payloadHash','payloadJson','must-not-leak','"evidence"','"integrity"','signature','keyId','digest']) {
    assert.equal(serialized.includes(forbidden), false, `private learner credential view must not expose ${forbidden}`);
  }
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Private learner issued-credential API identity, certificate-name, and privacy projection contracts passed.');
