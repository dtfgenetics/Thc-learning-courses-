import crypto from 'node:crypto';

const allowed = new Map([
  ['issued', new Set(['valid','suspended','revoked'])],
  ['valid', new Set(['suspended','superseded','expired','revoked'])],
  ['suspended', new Set(['valid','superseded','expired','revoked'])],
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

export function lifecycleForDefinition(definition, { issuedAt = null, expiresAt = null, now = new Date().toISOString() } = {}) {
  const policy = definition?.lifecycle ?? {
    validityType: expiresAt ? 'fixed-term' : 'indefinite',
    renewalRequired: false,
    renewalMethod: 'none',
    supersessionPolicy: 'retain-validity'
  };
  let resolvedExpiresAt = expiresAt ?? null;
  if (!resolvedExpiresAt && policy.validityType === 'fixed-term' && Number.isInteger(policy.validityDays) && issuedAt) {
    const issued = new Date(issuedAt);
    if (!Number.isNaN(issued.getTime())) resolvedExpiresAt = new Date(issued.getTime() + policy.validityDays * 86400000).toISOString();
  }
  const renewalOpensAt = resolvedExpiresAt && policy.renewalRequired && Number.isInteger(policy.renewalWindowDays)
    ? new Date(new Date(resolvedExpiresAt).getTime() - policy.renewalWindowDays * 86400000).toISOString()
    : null;
  const nowMs = new Date(now).getTime();
  const expiresMs = resolvedExpiresAt ? new Date(resolvedExpiresAt).getTime() : null;
  const renewalMs = renewalOpensAt ? new Date(renewalOpensAt).getTime() : null;
  return {
    validityType: policy.validityType,
    expiresAt: resolvedExpiresAt,
    renewalRequired: policy.renewalRequired,
    renewalMethod: policy.renewalMethod,
    renewalWindowDays: policy.renewalWindowDays ?? null,
    renewalOpensAt,
    renewalWindowOpen: renewalMs !== null && Number.isFinite(nowMs) && nowMs >= renewalMs && (expiresMs === null || nowMs < expiresMs),
    pastExpiration: expiresMs !== null && Number.isFinite(nowMs) && nowMs >= expiresMs,
    supersessionPolicy: policy.supersessionPolicy
  };
}

export function publicCredentialView(credential, definition, { statusHistory = [], now = new Date().toISOString() } = {}) {
  if (!definition?.id) throw new Error('credential definition required');
  const payload = credential.payloadJson ?? {};
  const lifecycle = lifecycleForDefinition(definition, { issuedAt: credential.issuedAt, expiresAt: credential.expiresAt, now });
  const publicHistory = (statusHistory ?? []).map((event) => ({
    status: event.status,
    createdAt: event.createdAt ?? null
  }));
  return {
    verificationId: credential.verificationId,
    status: credential.status,
    credential: {
      id: definition.id,
      title: definition.title,
      version: credential.credentialDefinitionVersion ?? credential.credentialVersion ?? definition.version,
      currentDefinitionVersion: definition.version,
      role: definition.role ?? null,
      description: definition.publicDescription ?? null
    },
    course: {
      id: credential.courseId ?? definition.course,
      version: credential.courseVersion ?? null
    },
    issuer: credential.issuer ?? payload.issuer ?? null,
    issuedAt: credential.issuedAt,
    expiresAt: lifecycle.expiresAt,
    lifecycle,
    statusHistory: publicHistory,
    evidenceSummary: payload.publicEvidenceSummary ?? credential.publicEvidenceSummary ?? null,
    limitations: definition.limitations ?? [],
    disclaimer: 'This educational credential demonstrates successful completion of the specified THC Academy curriculum and assessment requirements. It is not a state cannabis license, occupational license, government certification, or authorization to cultivate, manufacture, possess, distribute, or sell cannabis.'
  };
}
