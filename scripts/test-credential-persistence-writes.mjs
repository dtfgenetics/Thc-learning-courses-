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

function createWriterForRow(currentRow, calls = []) {
  let transactionCount = 0;
  const writer = createPostgresCredentialWriter({
    withTransaction: async (callback) => {
      transactionCount += 1;
      const query = async (text, params) => {
        calls.push({ text, params });
        if (text.includes('from credentials') && text.includes('for update')) return { rows: [currentRow] };
        if (text.startsWith('update credentials')) return { rowCount: 1, rows: [{ id: currentRow.id }] };
        if (text.startsWith('insert into credential_status_events')) return { rowCount: 1, rows: [] };
        if (text.startsWith('insert into audit_events')) return { rowCount: 1, rows: [] };
        throw new Error(`unexpected query: ${text}`);
      };
      return callback(query);
    }
  });
  return { writer, transactionCount: () => transactionCount };
}

const calls = [];
const primary = createWriterForRow(row, calls);
const writer = primary.writer;
const now = '2026-09-06T00:20:00.000Z';
const result = await writer.transitionById(row.id, 'revoked', {
  actorId: 'admin-service',
  reason: 'test-revocation',
  now
});

assert.equal(primary.transactionCount(), 1);
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

const suspensionCalls = [];
const suspension = createWriterForRow(row, suspensionCalls);
const suspended = await suspension.writer.transitionById(row.id, 'suspended', {
  actorId: 'credential-admin',
  reason: 'evidence-review',
  now: '2026-09-06T00:30:00.000Z'
});
assert.equal(suspended.credential.status, 'suspended');
assert.equal(suspension.transactionCount(), 1);
assert.deepEqual(suspensionCalls[1].params, ['suspended', row.id, 'valid']);
assert.deepEqual(suspensionCalls[2].params, [row.id, 'suspended', 'evidence-review', 'credential-admin', '2026-09-06T00:30:00.000Z']);
assert.deepEqual(JSON.parse(suspensionCalls[3].params[4]), {
  fromStatus: 'valid',
  toStatus: 'suspended',
  reason: 'evidence-review'
});

const suspendedRow = { ...row, status: 'suspended' };
const reinstatementCalls = [];
const reinstatement = createWriterForRow(suspendedRow, reinstatementCalls);
const reinstated = await reinstatement.writer.transitionById(row.id, 'valid', {
  actorId: 'credential-admin',
  reason: 'review-cleared',
  now: '2026-09-06T00:40:00.000Z'
});
assert.equal(reinstated.credential.status, 'valid');
assert.equal(reinstatement.transactionCount(), 1);
assert.deepEqual(reinstatementCalls[1].params, ['valid', row.id, 'suspended']);
assert.deepEqual(reinstatementCalls[2].params, [row.id, 'valid', 'review-cleared', 'credential-admin', '2026-09-06T00:40:00.000Z']);
assert.deepEqual(JSON.parse(reinstatementCalls[3].params[4]), {
  fromStatus: 'suspended',
  toStatus: 'valid',
  reason: 'review-cleared'
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

console.log('Transactional credential lifecycle state-write contract tests passed');
