import assert from 'node:assert/strict';
import { createApiServer } from '../apps/api/src/server.mjs';
import { createPostgresCredentialStore, mapCredentialRow } from '../apps/api/src/postgres-credential-store.mjs';

assert.throws(
  () => createApiServer({ env: { NODE_ENV: 'production' }, logger: () => {} }),
  /explicit persistent credentialStore/,
  'production must not fall back to the in-memory development store'
);

const calls = [];
const row = {
  id: '3ec945df-f4cf-4b6f-ae8e-0df43c6ac101',
  verification_id: 'VERIFY-POSTGRES-001',
  subject_hash: 'private-subject-hash',
  credential_definition_id: 'CRED-CULT-FOUNDATIONS-001',
  credential_definition_version: '1.0.0',
  course_id: 'COURSE-CULT-FOUNDATIONS-001',
  course_version: '1.0.0',
  status: 'valid',
  issued_at: new Date('2026-09-05T12:00:00.000Z'),
  expires_at: null,
  payload_json: { issuer: { name: 'Teaching Healthy Cultivation', url: 'https://dtfseeds.com/' }, privateEvidence: true },
  payload_hash: 'payload-hash'
};

const store = createPostgresCredentialStore({
  query: async (text, params) => {
    calls.push({ text, params });
    if (text.includes('where verification_id = $1')) return { rows: [row] };
    if (text.includes('count(*)')) return { rows: [{ count: 7 }] };
    throw new Error('unexpected query');
  }
});

const credential = await store.getByVerificationId('VERIFY-POSTGRES-001');
assert.equal(store.kind, 'postgres');
assert.equal(credential.verificationId, 'VERIFY-POSTGRES-001');
assert.equal(credential.credentialDefinitionVersion, '1.0.0');
assert.equal(credential.courseId, 'COURSE-CULT-FOUNDATIONS-001');
assert.equal(credential.issuer.name, 'Teaching Healthy Cultivation');
assert.equal(credential.issuedAt, '2026-09-05T12:00:00.000Z');
assert.equal(credential.expiresAt, null);
assert.equal(credential.subjectHash, 'private-subject-hash');
assert.deepEqual(calls[0].params, ['VERIFY-POSTGRES-001']);
assert.equal(calls[0].text.includes('VERIFY-POSTGRES-001'), false, 'verification id must be parameterized, not interpolated');
assert.equal(await store.count(), 7);

assert.equal(mapCredentialRow(null), null);
assert.throws(() => createPostgresCredentialStore(), /requires a query/);

const jsonPayloadRow = { ...row, payload_json: JSON.stringify(row.payload_json) };
assert.equal(mapCredentialRow(jsonPayloadRow).issuer.name, 'Teaching Healthy Cultivation');

console.log('PostgreSQL credential persistence contract and production fail-closed tests passed');
