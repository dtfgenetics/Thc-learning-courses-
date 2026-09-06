import assert from 'node:assert/strict';
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

console.log('Transactional credential state-write contract tests passed');
