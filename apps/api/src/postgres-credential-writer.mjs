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
