function timestamp(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function policyTime(attempt) {
  return timestamp(attempt.scoredAt) ?? timestamp(attempt.submittedAt) ?? timestamp(attempt.startedAt);
}

export function evaluateAssessmentAttemptPolicy({ assessment, attempts = [], now = new Date().toISOString() } = {}) {
  if (!assessment?.id) throw new Error('assessment required');
  const nowMs = timestamp(now);
  if (nowMs == null) throw new Error('valid now timestamp required');

  const applicable = attempts
    .filter((attempt) => attempt?.assessmentId === assessment.id)
    .filter((attempt) => String(attempt.assessmentVersion) === String(assessment.version))
    .filter((attempt) => attempt.status !== 'voided');

  const active = applicable
    .filter((attempt) => ['started', 'submitted'].includes(attempt.status))
    .sort((a, b) => (policyTime(b) ?? 0) - (policyTime(a) ?? 0))[0] ?? null;

  const maxAttempts = Number.isInteger(Number(assessment.maxAttempts)) && Number(assessment.maxAttempts) > 0
    ? Number(assessment.maxAttempts)
    : null;
  const attemptsUsed = applicable.length;
  const attemptsRemaining = maxAttempts == null ? null : Math.max(0, maxAttempts - attemptsUsed);

  if (active) {
    return {
      allowed: false,
      reason: 'active-attempt-exists',
      activeAttemptId: active.id,
      attemptsUsed,
      attemptsRemaining,
      maxAttempts,
      nextAllowedAt: null
    };
  }

  if (maxAttempts != null && attemptsUsed >= maxAttempts) {
    return {
      allowed: false,
      reason: 'max-attempts-reached',
      activeAttemptId: null,
      attemptsUsed,
      attemptsRemaining: 0,
      maxAttempts,
      nextAllowedAt: null
    };
  }

  const cooldownHours = Number(assessment.cooldownHours ?? 0);
  const cooldownMs = Number.isFinite(cooldownHours) && cooldownHours > 0 ? cooldownHours * 60 * 60 * 1000 : 0;
  const latestCompleted = applicable
    .filter((attempt) => attempt.status === 'scored')
    .map((attempt) => ({ attempt, at: policyTime(attempt) }))
    .filter((entry) => entry.at != null)
    .sort((a, b) => b.at - a.at)[0] ?? null;

  if (latestCompleted && cooldownMs > 0) {
    const nextAllowedMs = latestCompleted.at + cooldownMs;
    if (nowMs < nextAllowedMs) {
      return {
        allowed: false,
        reason: 'cooldown-active',
        activeAttemptId: null,
        attemptsUsed,
        attemptsRemaining,
        maxAttempts,
        nextAllowedAt: new Date(nextAllowedMs).toISOString()
      };
    }
  }

  return {
    allowed: true,
    reason: null,
    activeAttemptId: null,
    attemptsUsed,
    attemptsRemaining,
    maxAttempts,
    nextAllowedAt: null
  };
}
