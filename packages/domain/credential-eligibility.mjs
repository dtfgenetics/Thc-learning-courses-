export function evaluateCredentialEligibility({ credential, evidence = {} } = {}) {
  if (!credential?.id || !credential?.eligibility) throw new Error('credential definition with eligibility required');
  const missing = [];
  const assessments = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));
  const performance = new Map((evidence.performanceAssessments ?? []).map((row) => [row.assessmentId, row]));
  const artifacts = new Map((evidence.portfolioArtifacts ?? []).map((row) => [row.artifactId, row]));

  for (const requiredId of credential.eligibility.requiredAssessments ?? []) {
    const result = assessments.get(requiredId);
    if (!result) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'missing-result' });
      continue;
    }
    if (result.status !== 'passed') {
      missing.push({ type: 'assessment', id: requiredId, reason: 'not-passed' });
      continue;
    }
    if (Number(result.scorePercent) < Number(credential.eligibility.minimumPassingScorePercent)) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'below-minimum-score', required: credential.eligibility.minimumPassingScorePercent, actual: result.scorePercent });
    }
  }

  for (const requiredId of credential.eligibility.requiredPerformanceAssessments ?? []) {
    const result = performance.get(requiredId);
    if (!result) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-result' });
      continue;
    }
    if (result.status !== 'passed') {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'not-passed' });
      continue;
    }
    if (credential.eligibility.requireNoCriticalErrors === true && Number(result.criticalErrorCount ?? 0) > 0) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'critical-error', actual: Number(result.criticalErrorCount ?? 0) });
    }
  }

  for (const requiredId of credential.eligibility.requiredPortfolioArtifacts ?? []) {
    const result = artifacts.get(requiredId);
    if (!result) {
      missing.push({ type: 'portfolio-artifact', id: requiredId, reason: 'missing-artifact' });
      continue;
    }
    if (!['accepted', 'verified', 'complete'].includes(result.status)) {
      missing.push({ type: 'portfolio-artifact', id: requiredId, reason: 'artifact-not-accepted' });
    }
  }

  return {
    credentialId: credential.id,
    credentialVersion: credential.version,
    learnerId: evidence.learnerId ?? null,
    eligible: missing.length === 0,
    requirementSummary: {
      writtenAssessments: (credential.eligibility.requiredAssessments ?? []).length,
      performanceAssessments: (credential.eligibility.requiredPerformanceAssessments ?? []).length,
      portfolioArtifacts: (credential.eligibility.requiredPortfolioArtifacts ?? []).length
    },
    missingRequirements: missing
  };
}
