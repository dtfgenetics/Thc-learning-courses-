function asIso(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function payloadObject(value) {
  if (!value) return {};
  if (typeof value === 'string') return JSON.parse(value);
  return value;
}

export function mapCredentialRow(row) {
  if (!row) return null;
  const payload = payloadObject(row.payload_json);
  return {
    id: row.id,
    verificationId: row.verification_id,
    subjectHash: row.subject_hash,
    credentialDefinitionId: row.credential_definition_id,
    credentialDefinitionVersion: row.credential_definition_version,
    courseId: row.course_id,
    courseVersion: row.course_version,
    status: row.status,
    issuedAt: asIso(row.issued_at),
    expiresAt: asIso(row.expires_at),
    issuer: payload.issuer ?? null,
    payloadJson: payload,
    payloadHash: row.payload_hash
  };
}

export function createPostgresCredentialStore({ query } = {}) {
  if (typeof query !== 'function') throw new Error('PostgreSQL credential store requires a query(text, params) function');

  return {
    kind: 'postgres',
    async getByVerificationId(verificationId) {
      const result = await query(
        `select id, verification_id, subject_hash, credential_definition_id,
                credential_definition_version, course_id, course_version, status,
                issued_at, expires_at, payload_json, payload_hash
           from credentials
          where verification_id = $1
          limit 1`,
        [verificationId]
      );
      return mapCredentialRow(result.rows?.[0] ?? null);
    },
    async count() {
      const result = await query('select count(*)::int as count from credentials', []);
      return Number(result.rows?.[0]?.count ?? 0);
    }
  };
}
