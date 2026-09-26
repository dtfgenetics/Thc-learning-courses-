import { transitionCredential } from '../../../packages/domain/credential-runtime.mjs';
import { mapCredentialRow } from './postgres-credential-store.mjs';

const credentialColumns = `id, verification_id, subject_hash, credential_definition_id,
  credential_definition_version, course_id, course_version, status,
  issued_at, expires_at, payload_json, payload_hash`;

export function createPostgresCredentialWriter({ withTransaction } = {}) {
  if (typeof withTransaction !== 'function') {
    throw new Error('PostgreSQL credential writer requires withTransaction(callback)');
  }

  return {
    kind: 'postgres-transactional',
    async issueCredential(record, { actorId } = {}) {
      if (!actorId) throw new Error('actorId required');
      for (const field of ['id','verificationId','subjectHash','credentialDefinitionId','credentialDefinitionVersion','courseId','courseVersion','issuedAt','payloadHash']) {
        if (!String(record?.[field] ?? '').trim()) throw new Error(`credential issuance requires ${field}`);
      }
      if (!record?.payloadJson || typeof record.payloadJson !== 'object' || Array.isArray(record.payloadJson)) throw new Error('credential issuance requires payloadJson');
      if (record.status !== 'issued') throw new Error('new credential status must be issued');

      return withTransaction(async (query) => {
        const existingResult = await query(
          `select ${credentialColumns}
             from credentials
            where subject_hash = $1
              and credential_definition_id = $2
              and credential_definition_version = $3
              and status in ('issued','valid')
            order by issued_at desc
            limit 1
            for update`,
          [record.subjectHash, record.credentialDefinitionId, record.credentialDefinitionVersion]
        );
        const existing = mapCredentialRow(existingResult.rows?.[0] ?? null);
        if (existing) return { credential: existing, created: false, idempotent: true };

        const insertResult = await query(
          `insert into credentials
             (id, verification_id, subject_hash, credential_definition_id,
              credential_definition_version, course_id, course_version, status,
              issued_at, expires_at, payload_json, payload_hash)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
           returning ${credentialColumns}`,
          [
            record.id, record.verificationId, record.subjectHash, record.credentialDefinitionId,
            record.credentialDefinitionVersion, record.courseId, record.courseVersion, record.status,
            record.issuedAt, record.expiresAt ?? null, JSON.stringify(record.payloadJson), record.payloadHash
          ]
        );
        const issued = mapCredentialRow(insertResult.rows?.[0] ?? null);
        if (!issued) throw new Error('credential-insert-failed');

        await query(
          `insert into credential_status_events
             (credential_id, status, reason, actor_id, created_at)
           values ($1, 'issued', $2, $3, $4)`,
          [record.id, 'initial-issuance', actorId, record.issuedAt]
        );

        await query(
          `insert into audit_events
             (event_type, actor_id, subject_type, subject_id, metadata, created_at)
           values ($1, $2, $3, $4, $5::jsonb, $6)`,
          [
            'credential.issued',
            actorId,
            'credential',
            record.id,
            JSON.stringify({
              credentialDefinitionId: record.credentialDefinitionId,
              credentialDefinitionVersion: record.credentialDefinitionVersion,
              verificationId: record.verificationId
            }),
            record.issuedAt
          ]
        );

        return { credential: issued, created: true, idempotent: false };
      });
    },
    async transitionById(credentialId, nextStatus, { actorId, reason = null, now = new Date().toISOString() } = {}) {
      if (!credentialId) throw new Error('credentialId required');
      if (!actorId) throw new Error('actorId required');

      return withTransaction(async (query) => {
        const currentResult = await query(
          `select ${credentialColumns}
             from credentials
            where id = $1
            for update`,
          [credentialId]
        );
        const current = mapCredentialRow(currentResult.rows?.[0] ?? null);
        if (!current) throw new Error('credential-not-found');

        const transition = transitionCredential(current, nextStatus, { actorId, reason, now });

        const updateResult = await query(
          `update credentials
              set status = $1
            where id = $2 and status = $3
          returning id`,
          [nextStatus, credentialId, current.status]
        );
        if (Number(updateResult.rowCount ?? updateResult.rows?.length ?? 0) !== 1) {
          throw new Error('credential-state-conflict');
        }

        await query(
          `insert into credential_status_events
             (credential_id, status, reason, actor_id, created_at)
           values ($1, $2, $3, $4, $5)`,
          [credentialId, nextStatus, reason, actorId, now]
        );

        await query(
          `insert into audit_events
             (event_type, actor_id, subject_type, subject_id, metadata, created_at)
           values ($1, $2, $3, $4, $5::jsonb, $6)`,
          [
            'credential.status.changed',
            actorId,
            'credential',
            credentialId,
            JSON.stringify({ fromStatus: current.status, toStatus: nextStatus, reason }),
            now
          ]
        );

        return {
          credential: transition.credential,
          event: {
            ...transition.event,
            persistence: 'transactional-postgres'
          }
        };
      });
    }
  };
}
