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
  return {
    verificationId: credential.verificationId,
    status: credential.status,
    credential: {
      id: definition.id,
      title: definition.title,
      version: credential.credentialDefinitionVersion
    },
    course: {
      id: credential.courseId,
      version: credential.courseVersion
    },
    issuer: credential.issuer,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt ?? null,
    disclaimer: 'This educational credential demonstrates successful completion of the specified THC Academy curriculum and assessment. It is not a state cannabis license, occupational license, government certification, or authorization to cultivate, manufacture, possess, distribute, or sell cannabis.'
  };
}
