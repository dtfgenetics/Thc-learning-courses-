import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createPostgresCredentialWriter } from '../apps/api/src/postgres-credential-writer.mjs';

const row = {
  id: 'f5302091-9d48-4f68-9df4-0b606fd35e63',
  verification_id: 'VERIFY-WRITE-001',
  subject_hash: 'private-subject-hash',
  credential_definition_id: 'CRED-CULT-FOUNDATIONS-001',
  credential_definition_version: '1.0.0',
  course_id: 'COURSE-CULT-FOUNDATIONS-001',
  course_version: '1.0.0',
  status: 'valid',
  issued_at: '2026-09-05T12:00:00.000Z',
  expires_at: null,
  payload_json: { issuer: { name: 'Teaching Healthy Cultivation' } },
  payload_hash: 'payload-hash'
};

const calls = [];
let transactionCount = 0;
const writer = createPostgresCredentialWriter({
  withTransaction: async (callback) => {
    transactionCount += 1;
    const query = async (text, params) => {
      calls.push({ text, params });
      if (text.includes('from credentials') && text.includes('for update')) return { rows: [row] };
      if (text.startsWith('update credentials')) return { rowCount: 1, rows: [{ id: row.id }] };
      if (text.startsWith('insert into credential_status_events')) return { rowCount: 1, rows: [] };
      if (text.startsWith('insert into audit_events')) return { rowCount: 1, rows: [] };
      throw new Error(`unexpected query: ${text}`);
    };
    return callback(query);
  }
});

const now = '2026-09-06T00:20:00.000Z';
const result = await writer.transitionById(row.id, 'revoked', {
  actorId: 'admin-service',
  reason: 'test-revocation',
  now
});

assert.equal(transactionCount, 1);
assert.equal(result.credential.status, 'revoked');
assert.equal(result.event.persistence, 'transactional-postgres');
assert.equal(calls.length, 4);
assert.match(calls[0].text, /for update/);
assert.deepEqual(calls[0].params, [row.id]);
assert.deepEqual(calls[1].params, ['revoked', row.id, 'valid']);
assert.deepEqual(calls[2].params, [row.id, 'revoked', 'test-revocation', 'admin-service', now]);
assert.equal(calls[3].params[0], 'credential.status.changed');
assert.equal(calls[3].params[1], 'admin-service');
assert.equal(calls[3].params[3], row.id);
assert.deepEqual(JSON.parse(calls[3].params[4]), {
  fromStatus: 'valid',
  toStatus: 'revoked',
  reason: 'test-revocation'
});

await assert.rejects(
  () => writer.transitionById(row.id, 'issued', { actorId: 'admin-service', now }),
  /Invalid credential transition valid -> issued/
);
assert.throws(() => createPostgresCredentialWriter(), /requires withTransaction/);
await assert.rejects(() => writer.transitionById('', 'revoked', { actorId: 'admin-service' }), /credentialId required/);
await assert.rejects(() => writer.transitionById(row.id, 'revoked'), /actorId required/);

let conflictQueries = 0;
const conflictWriter = createPostgresCredentialWriter({
  withTransaction: async (callback) => callback(async (text) => {
    conflictQueries += 1;
    if (text.includes('from credentials')) return { rows: [row] };
    if (text.startsWith('update credentials')) return { rowCount: 0, rows: [] };
    throw new Error('audit/event writes must not run after a state conflict');
  })
});
await assert.rejects(
  () => conflictWriter.transitionById(row.id, 'revoked', { actorId: 'admin-service', now }),
  /credential-state-conflict/
);
assert.equal(conflictQueries, 2);

const issueCalls = [];
const issuedRow = {
  ...row,
  id: 'a0f797ce-f2fd-4104-9857-08182254db74',
  verification_id: 'VERIFY-ISSUE-001',
  subject_hash: 'subject-hash-issued',
  credential_definition_id: 'CRED-CULT-TECH-I-001',
  credential_definition_version: '1.0.0',
  course_id: 'COURSE-LH-TECH1-007',
  course_version: '0.2.0',
  status: 'issued',
  issued_at: '2026-09-25T23:00:00.000Z',
  payload_json: { issuer: { name: 'Teaching Healthy Cultivation' }, recipient: { certificateName: 'Test Learner' } },
  payload_hash: 'a'.repeat(64)
};
const issueWriter = createPostgresCredentialWriter({
  withTransaction: async (callback) => callback(async (text, params) => {
    issueCalls.push({ text, params });
    if (text.includes('from credentials') && text.includes("status in ('issued','valid')")) return { rows: [] };
    if (text.startsWith('insert into credentials')) return { rowCount: 1, rows: [issuedRow] };
    if (text.startsWith('insert into credential_status_events')) return { rowCount: 1, rows: [] };
    if (text.startsWith('insert into audit_events')) return { rowCount: 1, rows: [] };
    throw new Error(`unexpected issuance query: ${text}`);
  })
});
const issueResult = await issueWriter.issueCredential({
  id: issuedRow.id,
  verificationId: issuedRow.verification_id,
  subjectHash: issuedRow.subject_hash,
  credentialDefinitionId: issuedRow.credential_definition_id,
  credentialDefinitionVersion: issuedRow.credential_definition_version,
  courseId: issuedRow.course_id,
  courseVersion: issuedRow.course_version,
  status: 'issued',
  issuedAt: issuedRow.issued_at,
  expiresAt: null,
  payloadJson: issuedRow.payload_json,
  payloadHash: issuedRow.payload_hash
}, { actorId: 'credential-admin' });
assert.equal(issueResult.created, true);
assert.equal(issueResult.idempotent, false);
assert.equal(issueResult.credential.verificationId, 'VERIFY-ISSUE-001');
assert.equal(issueCalls.length, 4);
assert.match(issueCalls[0].text, /status in \('issued','valid'\)/);
assert.match(issueCalls[1].text, /insert into credentials/);
assert.equal(issueCalls[2].params[1], 'initial-issuance');
assert.equal(issueCalls[3].params[0], 'credential.issued');

const idempotentWriter = createPostgresCredentialWriter({
  withTransaction: async (callback) => callback(async (text) => {
    if (text.includes('from credentials')) return { rows: [issuedRow] };
    throw new Error('idempotent issuance must not write when an active credential already exists');
  })
});
const repeat = await idempotentWriter.issueCredential({
  id: crypto.randomUUID?.() ?? issuedRow.id,
  verificationId: 'DIFFERENT-VERIFY-ID',
  subjectHash: issuedRow.subject_hash,
  credentialDefinitionId: issuedRow.credential_definition_id,
  credentialDefinitionVersion: issuedRow.credential_definition_version,
  courseId: issuedRow.course_id,
  courseVersion: issuedRow.course_version,
  status: 'issued',
  issuedAt: issuedRow.issued_at,
  payloadJson: issuedRow.payload_json,
  payloadHash: issuedRow.payload_hash
}, { actorId: 'credential-admin' });
assert.equal(repeat.created, false);
assert.equal(repeat.idempotent, true);
assert.equal(repeat.credential.verificationId, 'VERIFY-ISSUE-001');

console.log('Transactional credential state-write and idempotent issuance contracts passed');
