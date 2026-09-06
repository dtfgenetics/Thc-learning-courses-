import crypto from 'node:crypto';

const allowed = new Map([
  ['issued', new Set(['valid','revoked'])],
  ['valid', new Set(['superseded','expired','revoked'])],
  ['superseded', new Set([])],
  ['expired', new Set([])],
  ['revoked', new Set([])]
]);

export function transitionCredential(credential, nextStatus, { actorId, reason = null, now = new Date().toISOString() } = {}) {
  if (!actorId) throw new Error('actorId required');
  const next = allowed.get(credential.status);
  if (!next || !next.has(nextStatus)) throw new Error(`Invalid credential transition ${credential.status} -> ${nextStatus}`);
  return {
    credential: { ...credential, status: nextStatus },
    event: {
      id: crypto.randomUUID(),
      credentialId: credential.id,
      fromStatus: credential.status,
      status: nextStatus,
      reason,
      actorId,
      createdAt: now
    }
  };
}

export function publicCredentialView(credential, definition) {
  if (!definition?.id) throw new Error('credential definition required');
  const payload = credential.payloadJson ?? {};
  return {
    verificationId: credential.verificationId,
    status: credential.status,
    credential: {
      id: definition.id,
      title: definition.title,
      version: credential.credentialDefinitionVersion ?? credential.credentialVersion ?? definition.version,
      role: definition.role ?? null,
      description: definition.publicDescription ?? null
    },
    course: {
      id: credential.courseId ?? definition.course,
      version: credential.courseVersion ?? null
    },
    issuer: credential.issuer ?? payload.issuer ?? null,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt ?? null,
    evidenceSummary: payload.publicEvidenceSummary ?? null,
    limitations: definition.limitations ?? [],
    disclaimer: 'This educational credential demonstrates successful completion of the specified THC Academy curriculum and assessment requirements. It is not a state cannabis license, occupational license, government certification, or authorization to cultivate, manufacture, possess, distribute, or sell cannabis.'
  };
}
