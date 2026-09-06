import { loadRequiredPerformanceDefinitions } from './performance-definitions.mjs';

function asMap(definitions) {
  if (definitions instanceof Map) return definitions;
  return new Map(Object.entries(definitions ?? {}));
}

function countCriticalErrors(result) {
  if (Array.isArray(result?.criticalErrors)) return result.criticalErrors.length;
  const count = Number(result?.criticalErrorCount ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function scorePercent(result) {
  const raw = result?.scorePercent;
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function evaluateCredentialEligibility({ credential, evidence = {}, performanceDefinitions = null, root = process.cwd() } = {}) {
  if (!credential?.id || !credential?.eligibility) throw new Error('credential definition with eligibility required');
  const missing = [];
  const assessments = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));
  const performance = new Map((evidence.performanceAssessments ?? []).map((row) => [row.assessmentId, row]));
  const artifacts = new Map((evidence.portfolioArtifacts ?? []).map((row) => [row.artifactId, row]));
  const performanceById = performanceDefinitions == null
    ? loadRequiredPerformanceDefinitions({ root, credential })
    : asMap(performanceDefinitions);

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

    const score = scorePercent(result);
    const minimum = Number(credential.eligibility.minimumPassingScorePercent);
    if (score === null) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'missing-score' });
      continue;
    }
    if (score < minimum) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'below-minimum-score', required: minimum, actual: score });
    }
  }

  for (const requiredId of credential.eligibility.requiredPerformanceAssessments ?? []) {
    const definition = performanceById.get(requiredId);
    if (!definition) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-performance-definition' });
      continue;
    }

    const result = performance.get(requiredId);
    if (!result) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-result' });
      continue;
    }
    if (result.status !== 'passed') {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'not-passed' });
      continue;
    }

    const score = scorePercent(result);
    const minimum = Number(definition.passingStandard?.minimumPercent);
    if (score === null) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-score' });
      continue;
    }
    if (Number.isFinite(minimum) && score < minimum) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'below-performance-minimum-score', required: minimum, actual: score });
    }

    const criticalErrorsRequired = credential.eligibility.requireNoCriticalErrors === true || definition.passingStandard?.noCriticalErrors === true;
    if (criticalErrorsRequired) {
      const count = countCriticalErrors(result);
      if (count > 0) missing.push({ type: 'performance-assessment', id: requiredId, reason: 'critical-error', actual: count });
    }

    if (credential.eligibility.requireVerifiedPerformanceEvidence === true && result.evidenceVerified !== true) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'performance-evidence-unverified' });
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
