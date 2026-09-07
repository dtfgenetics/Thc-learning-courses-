function asTime(value) {
  const time = value == null ? Number.NaN : new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

export function evaluateAssessmentAttemptPolicy({ assessment, attempts = [], now = new Date().toISOString() } = {}) {
  if (!assessment?.id) throw new Error('assessment definition required');
  const activeAttempts = (attempts ?? []).filter((row) => row && row.status !== 'voided');
  const inProgress = activeAttempts.find((row) => ['started', 'submitted'].includes(row.status));
  if (inProgress) {
    return {
      allowed: false,
      reason: 'active-attempt',
      assessmentId: assessment.id,
      attemptId: inProgress.id ?? null,
      attemptsUsed: activeAttempts.length,
      maxAttempts: Number.isInteger(assessment.maxAttempts) ? assessment.maxAttempts : null,
      retryAt: null,
      retryAfterSeconds: null
    };
  }

  const maxAttempts = Number(assessment.maxAttempts);
  if (Number.isInteger(maxAttempts) && maxAttempts > 0 && activeAttempts.length >= maxAttempts) {
    return {
      allowed: false,
      reason: 'max-attempts',
      assessmentId: assessment.id,
      attemptId: null,
      attemptsUsed: activeAttempts.length,
      maxAttempts,
      retryAt: null,
      retryAfterSeconds: null
    };
  }

  const cooldownHours = Number(assessment.cooldownHours ?? 0);
  if (Number.isFinite(cooldownHours) && cooldownHours > 0 && activeAttempts.length > 0) {
    const latest = [...activeAttempts]
      .map((row) => ({ row, time: asTime(row.startedAt) }))
      .filter((entry) => Number.isFinite(entry.time))
      .sort((a, b) => b.time - a.time)[0];
    const nowMs = asTime(now);
    if (latest && Number.isFinite(nowMs)) {
      const retryMs = latest.time + cooldownHours * 60 * 60 * 1000;
      if (nowMs < retryMs) {
        return {
          allowed: false,
          reason: 'cooldown',
          assessmentId: assessment.id,
          attemptId: latest.row.id ?? null,
          attemptsUsed: activeAttempts.length,
          maxAttempts: Number.isInteger(maxAttempts) && maxAttempts > 0 ? maxAttempts : null,
          retryAt: new Date(retryMs).toISOString(),
          retryAfterSeconds: Math.max(1, Math.ceil((retryMs - nowMs) / 1000))
        };
      }
    }
  }

  return {
    allowed: true,
    reason: null,
    assessmentId: assessment.id,
    attemptId: null,
    attemptsUsed: activeAttempts.length,
    maxAttempts: Number.isInteger(maxAttempts) && maxAttempts > 0 ? maxAttempts : null,
    retryAt: null,
    retryAfterSeconds: null
  };
}
