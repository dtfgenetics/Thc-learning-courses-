function scorePercent(result) {
  const raw = result?.scorePercent;
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function credentialReleaseBlockers(credential) {
  const blockers = [];
  if (!credential?.governance) {
    blockers.push({
      type: 'credential-release',
      id: credential?.id ?? null,
      reason: 'credential-governance-missing',
      actual: null
    });
    return blockers;
  }
  if (!['approved', 'published'].includes(credential.status)) {
    blockers.push({
      type: 'credential-release',
      id: credential.id,
      reason: 'credential-definition-not-approved',
      actual: credential.status ?? null
    });
  }
  const requiredComplete = [
    ['humanReviewStatus', 'human-review-incomplete'],
    ['accessibilityReviewStatus', 'accessibility-review-incomplete'],
    ['pilotStatus', 'pilot-incomplete'],
    ['standardSettingStatus', 'standard-setting-incomplete']
  ];
  for (const [field, reason] of requiredComplete) {
    if (credential.governance[field] !== 'complete') {
      blockers.push({
        type: 'credential-release',
        id: credential.id,
        reason,
        actual: credential.governance[field] ?? null
      });
    }
  }
  if (credential.governance.releaseApprovalStatus !== 'approved') {
    blockers.push({
      type: 'credential-release',
      id: credential.id,
      reason: 'release-approval-missing',
      actual: credential.governance.releaseApprovalStatus ?? null
    });
  }
  if (credential.governance.certificationUseStatus !== 'authorized') {
    blockers.push({
      type: 'credential-release',
      id: credential.id,
      reason: 'certification-use-not-authorized',
      actual: credential.governance.certificationUseStatus ?? null
    });
  }
  return blockers;
}

export function evaluateCredentialEligibility({ credential, evidence = {} } = {}) {
  if (!credential?.id || !credential?.eligibility) throw new Error('credential definition with eligibility required');
  const missing = [];
  const assessments = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));
  const performance = new Map((evidence.performanceAssessments ?? []).map((row) => [row.assessmentId, row]));
  const artifacts = new Map((evidence.portfolioArtifacts ?? []).map((row) => [row.artifactId, row]));
  const courseCompletions = new Map((evidence.courseCompletions ?? []).map((row) => [row.courseId, row]));

  const requiredCourses = Array.isArray(credential.eligibility.requiredCourseCompletions) && credential.eligibility.requiredCourseCompletions.length
    ? credential.eligibility.requiredCourseCompletions
    : credential.eligibility.requireCourseCompletion === true
      ? [credential.course]
      : [];
  for (const requiredCourseId of requiredCourses) {
    const result = courseCompletions.get(requiredCourseId);
    if (!result) {
      missing.push({ type: 'course-completion', id: requiredCourseId, reason: 'missing-course-completion' });
      continue;
    }
    if (result.status !== 'completed') {
      missing.push({ type: 'course-completion', id: requiredCourseId, reason: 'course-not-completed', actual: result.status ?? null });
      continue;
    }
    if (requiredCourseId === credential.course && credential.courseVersion) {
      const requiredVersion = String(credential.courseVersion).trim();
      const actualVersion = String(result.courseVersion ?? '').trim();
      if (actualVersion !== requiredVersion) {
        missing.push({
          type: 'course-completion',
          id: requiredCourseId,
          reason: actualVersion ? 'course-version-mismatch' : 'missing-course-version',
          required: requiredVersion,
          actual: actualVersion || null
        });
      }
    }
  }

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
    if (score === null) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'missing-score' });
      continue;
    }
    const minimum = Number(credential.eligibility.minimumPassingScorePercent);
    if (score < minimum) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'below-minimum-score', required: minimum, actual: score });
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

  const releaseBlockers = credentialReleaseBlockers(credential);
  const requirementsSatisfied = missing.length === 0;
  const releaseAuthorized = releaseBlockers.length === 0;

  return {
    credentialId: credential.id,
    credentialVersion: credential.version,
    learnerId: evidence.learnerId ?? null,
    requirementsSatisfied,
    releaseAuthorized,
    eligible: requirementsSatisfied && releaseAuthorized,
    requirementSummary: {
      courseCompletion: requiredCourses.length,
      writtenAssessments: (credential.eligibility.requiredAssessments ?? []).length,
      performanceAssessments: (credential.eligibility.requiredPerformanceAssessments ?? []).length,
      portfolioArtifacts: (credential.eligibility.requiredPortfolioArtifacts ?? []).length
    },
    missingRequirements: missing,
    releaseBlockers
  };
}
