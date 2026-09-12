function cleanText(value, maxLength) {
  const text = String(value ?? '').trim();
  return text.slice(0, maxLength);
}

const EVIDENCE_OUTPUT_STATUSES = new Set(['not-reviewed', 'received', 'verified', 'needs-revision']);
const FOLLOW_UP_STATUSES = new Set(['none', 'remediation-assigned', 'remediation-in-progress', 'ready-for-reassessment', 'reassessment-scheduled', 'closed']);

function practicalGradingPolicy(practical) {
  const source = practical?.extensions?.gradingRubric ?? {};
  const levels = (Array.isArray(source.levels) && source.levels.length ? source.levels : [
    { id: 'strong', label: 'Strong', minimumPercent: 90, description: 'Consistently complete, accurate, independent and well controlled.' },
    { id: 'competent', label: 'Competent', minimumPercent: 75, description: 'Meets the expected Technician I course-performance standard with only minor non-critical omissions.' },
    { id: 'developing', label: 'Developing', minimumPercent: 50, description: 'Partially meets the standard but needs correction, prompting or stronger evidence.' },
    { id: 'insufficient', label: 'Insufficient', minimumPercent: 0, description: 'Does not yet demonstrate the required course performance.' }
  ]).map((level) => ({
    id: String(level.id ?? '').trim(),
    label: String(level.label ?? level.id ?? '').trim(),
    minimumPercent: Number(level.minimumPercent ?? 0),
    description: String(level.description ?? '').trim()
  })).filter((level) => level.id).sort((a, b) => b.minimumPercent - a.minimumPercent);
  const minimums = source.domainMinimumPercents && typeof source.domainMinimumPercents === 'object'
    ? Object.fromEntries(Object.entries(source.domainMinimumPercents).map(([name, value]) => [name, Number(value)]))
    : {};
  return {
    version: String(source.version ?? 'course1-practical-rubric-1.0.0'),
    levels,
    domainMinimumPercents: minimums,
    requireDomainMinimums: source.requireDomainMinimums !== false,
    requireAllEvidenceReviewed: source.requireAllEvidenceReviewed !== false,
    requireAllEvidenceVerifiedForPass: source.requireAllEvidenceVerifiedForPass !== false,
    requireCriticalErrorDocumentation: source.requireCriticalErrorDocumentation !== false,
    domainAnchors: source.domainAnchors && typeof source.domainAnchors === 'object' ? structuredClone(source.domainAnchors) : {}
  };
}

function performanceLevel(score, maximum, levels) {
  const percent = maximum > 0 ? (Number(score) / Number(maximum)) * 100 : 0;
  return levels.find((level) => percent >= level.minimumPercent)?.id ?? levels.at(-1)?.id ?? 'insufficient';
}

function normalizeDomainScores(practical, rows = [], { requireComplete = false } = {}) {
  if (!Array.isArray(rows)) throw new Error('domainScores must be an array');
  const domains = practical?.scoring?.domains ?? [];
  const limits = new Map(domains.map((domain) => [domain.name, Number(domain.points)]));
  const policy = practicalGradingPolicy(practical);
  const seen = new Set();
  const normalized = [];

  for (const row of rows) {
    const name = String(row?.name ?? '').trim();
    if (!limits.has(name)) throw new Error(`unknown practical scoring domain: ${name}`);
    if (seen.has(name)) throw new Error(`duplicate practical scoring domain: ${name}`);
    const score = Number(row?.score);
    const maximum = limits.get(name);
    if (!Number.isFinite(score) || score < 0 || score > maximum) throw new Error(`invalid score for ${name}`);
    const scorePercent = maximum > 0 ? Math.round((score / maximum) * 10000) / 100 : 0;
    seen.add(name);
    normalized.push({
      name,
      score,
      points: maximum,
      scorePercent,
      performanceLevel: performanceLevel(score, maximum, policy.levels)
    });
  }

  if (requireComplete && seen.size !== domains.length) throw new Error('all practical scoring domains are required for finalization');
  return domains.map((domain) => normalized.find((row) => row.name === domain.name) ?? {
    name: domain.name,
    score: null,
    points: Number(domain.points),
    scorePercent: null,
    performanceLevel: null
  });
}

function normalizeCriticalErrors(practical, indexes = []) {
  if (!Array.isArray(indexes)) throw new Error('criticalErrorIndexes must be an array');
  const source = practical?.criticalErrors ?? [];
  const unique = [...new Set(indexes.map((value) => Number(value)))].sort((a, b) => a - b);
  for (const index of unique) {
    if (!Number.isInteger(index) || index < 0 || index >= source.length) throw new Error(`invalid critical error index: ${index}`);
  }
  return unique.map((index) => ({ index, description: source[index] }));
}

function normalizeEvidenceOutputs(practical, rows = []) {
  if (!Array.isArray(rows)) throw new Error('evidenceOutputs must be an array');
  const canonical = practical?.evidenceOutputs ?? [];
  const allowed = new Set(canonical);
  const seen = new Set();
  const normalized = [];

  for (const row of rows) {
    const name = String(row?.name ?? '').trim();
    if (!allowed.has(name)) throw new Error(`unknown practical evidence output: ${name}`);
    if (seen.has(name)) throw new Error(`duplicate practical evidence output: ${name}`);
    const status = String(row?.status ?? 'not-reviewed').trim();
    if (!EVIDENCE_OUTPUT_STATUSES.has(status)) throw new Error(`invalid evidence output status for ${name}`);
    seen.add(name);
    normalized.push({
      name,
      status,
      reference: cleanText(row?.reference, 500),
      note: cleanText(row?.note, 1000)
    });
  }

  return canonical.map((name) => normalized.find((row) => row.name === name) ?? {
    name,
    status: 'not-reviewed',
    reference: '',
    note: ''
  });
}

function normalizeFollowUpStatus(value, { finalStatus = null } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    if (finalStatus === 'passed') return 'closed';
    if (finalStatus === 'failed') return 'remediation-assigned';
    return 'none';
  }
  if (!FOLLOW_UP_STATUSES.has(raw)) throw new Error(`invalid practical follow-up status: ${raw}`);
  if (finalStatus === 'passed' && !['none', 'closed'].includes(raw)) throw new Error('passed practical cannot require remediation or reassessment');
  return raw;
}

function normalizeTargetDate(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) throw new Error('reassessmentTargetDate must use YYYY-MM-DD');
  return text;
}

function historyFromExisting(existing) {
  const history = Array.isArray(existing?.evidence?.history) ? structuredClone(existing.evidence.history) : [];
  if (!existing || !['passed', 'failed', 'voided'].includes(existing.status)) return history;
  history.push({
    status: existing.status,
    scorePercent: existing.scorePercent ?? null,
    criticalErrorCount: Number(existing.criticalErrorCount ?? 0),
    evaluatorId: existing.evaluatorId ?? null,
    evaluatedAt: existing.evaluatedAt ?? null,
    domainScores: Array.isArray(existing.evidence?.domainScores) ? structuredClone(existing.evidence.domainScores) : [],
    criticalErrors: Array.isArray(existing.evidence?.criticalErrors) ? structuredClone(existing.evidence.criticalErrors) : [],
    evidenceOutputs: Array.isArray(existing.evidence?.evidenceOutputs) ? structuredClone(existing.evidence.evidenceOutputs) : [],
    gradingDecision: existing.evidence?.gradingDecision ? structuredClone(existing.evidence.gradingDecision) : null,
    followUpStatus: existing.evidence?.followUpStatus ?? 'none',
    reassessmentTargetDate: existing.evidence?.reassessmentTargetDate ?? '',
    learnerFeedback: existing.evidence?.learnerFeedback ?? '',
    evaluatorNotes: existing.evidence?.evaluatorNotes ?? ''
  });
  return history.slice(-20);
}

export function practicalEvaluatorView(practical, existing = null) {
  const gradingPolicy = practicalGradingPolicy(practical);
  return {
    practical: {
      id: practical.id,
      title: practical.title,
      version: practical.version,
      status: practical.status,
      evidenceOutputs: [...(practical.evidenceOutputs ?? [])],
      evidenceOutputStatuses: [...EVIDENCE_OUTPUT_STATUSES],
      followUpStatuses: [...FOLLOW_UP_STATUSES],
      scoring: {
        totalPoints: Number(practical.scoring?.totalPoints ?? 0),
        domains: (practical.scoring?.domains ?? []).map((domain) => ({
          name: domain.name,
          points: Number(domain.points),
          minimumPercent: Object.hasOwn(gradingPolicy.domainMinimumPercents, domain.name) ? gradingPolicy.domainMinimumPercents[domain.name] : null,
          anchors: gradingPolicy.domainAnchors[domain.name] ?? null
        }))
      },
      gradingRubric: {
        version: gradingPolicy.version,
        levels: structuredClone(gradingPolicy.levels),
        requireDomainMinimums: gradingPolicy.requireDomainMinimums,
        requireAllEvidenceReviewed: gradingPolicy.requireAllEvidenceReviewed,
        requireAllEvidenceVerifiedForPass: gradingPolicy.requireAllEvidenceVerifiedForPass,
        requireCriticalErrorDocumentation: gradingPolicy.requireCriticalErrorDocumentation
      },
      passingStandard: {
        minimumPercent: Number(practical.passingStandard?.minimumPercent ?? 0),
        noCriticalErrors: practical.passingStandard?.noCriticalErrors === true
      },
      criticalErrors: [...(practical.criticalErrors ?? [])]
    },
    evaluation: existing ? {
      status: existing.status,
      scorePercent: existing.scorePercent ?? null,
      criticalErrorCount: Number(existing.criticalErrorCount ?? 0),
      evaluatorId: existing.evaluatorId ?? null,
      evaluatedAt: existing.evaluatedAt ?? null,
      updatedAt: existing.updatedAt ?? null,
      domainScores: normalizeDomainScores(practical, existing.evidence?.domainScores ?? []),
      criticalErrors: Array.isArray(existing.evidence?.criticalErrors) ? structuredClone(existing.evidence.criticalErrors) : [],
      evidenceOutputs: normalizeEvidenceOutputs(practical, existing.evidence?.evidenceOutputs ?? []),
      gradingDecision: existing.evidence?.gradingDecision ? structuredClone(existing.evidence.gradingDecision) : null,
      followUpStatus: existing.evidence?.followUpStatus ?? 'none',
      reassessmentTargetDate: existing.evidence?.reassessmentTargetDate ?? '',
      evaluatorNotes: existing.evidence?.evaluatorNotes ?? '',
      learnerFeedback: existing.evidence?.learnerFeedback ?? '',
      history: Array.isArray(existing.evidence?.history) ? structuredClone(existing.evidence.history) : [],
      historyCount: Array.isArray(existing.evidence?.history) ? existing.evidence.history.length : 0
    } : null
  };
}

export function buildPracticalEvaluation({ practical, existing = null, input = {}, evaluatorId, evaluatedAt = new Date().toISOString() } = {}) {
  if (!practical?.id || !practical?.version) throw new Error('practical definition required');
  if (!evaluatorId) throw new Error('evaluatorId required');
  const mode = input.mode === 'finalize' ? 'finalize' : input.mode === 'save' ? 'save' : null;
  if (!mode) throw new Error('evaluation mode must be save or finalize');
  const existingFinal = Boolean(existing && ['passed', 'failed', 'voided'].includes(existing.status));
  const startingReassessment = mode === 'save' && existingFinal && input.startReassessment === true;
  if (mode === 'save' && existingFinal && !startingReassessment) {
    throw new Error('finalized practical evaluations can only be reopened through an explicit reassessment');
  }

  const gradingPolicy = practicalGradingPolicy(practical);
  const domainScores = normalizeDomainScores(practical, input.domainScores ?? [], { requireComplete: mode === 'finalize' });
  const criticalErrors = normalizeCriticalErrors(practical, input.criticalErrorIndexes ?? []);
  const evidenceOutputs = normalizeEvidenceOutputs(practical, input.evidenceOutputs ?? existing?.evidence?.evidenceOutputs ?? []);
  const evaluatorNotes = cleanText(input.evaluatorNotes, 4000);
  const learnerFeedback = cleanText(input.learnerFeedback, 2500);
  const reassessmentTargetDate = normalizeTargetDate(input.reassessmentTargetDate);
  const history = historyFromExisting(existing);

  let status = 'in-progress';
  let scorePercent = null;
  let finalEvaluatedAt = null;
  let gradingDecision = null;

  if (mode === 'finalize') {
    if (gradingPolicy.requireAllEvidenceReviewed && evidenceOutputs.some((row) => row.status === 'not-reviewed')) {
      throw new Error('all practical evidence outputs must be reviewed before finalization');
    }
    if (gradingPolicy.requireCriticalErrorDocumentation && criticalErrors.length > 0 && evaluatorNotes.length < 20) {
      throw new Error('critical-error findings require documented evaluator context');
    }
    const totalPoints = Number(practical.scoring?.totalPoints ?? domainScores.reduce((sum, row) => sum + row.points, 0));
    const earned = domainScores.reduce((sum, row) => sum + Number(row.score ?? 0), 0);
    scorePercent = totalPoints > 0 ? Math.round((earned / totalPoints) * 10000) / 100 : 0;
    const meetsScore = scorePercent >= Number(practical.passingStandard?.minimumPercent ?? 0);
    const criticalOkay = practical.passingStandard?.noCriticalErrors === true ? criticalErrors.length === 0 : true;
    const failedDomainMinimums = domainScores
      .filter((row) => Object.hasOwn(gradingPolicy.domainMinimumPercents, row.name) && Number(row.scorePercent ?? 0) < Number(gradingPolicy.domainMinimumPercents[row.name]))
      .map((row) => ({ name: row.name, scorePercent: row.scorePercent, minimumPercent: gradingPolicy.domainMinimumPercents[row.name] }));
    const domainMinimumsOkay = !gradingPolicy.requireDomainMinimums || failedDomainMinimums.length === 0;
    const evidenceReviewed = evidenceOutputs.every((row) => row.status !== 'not-reviewed');
    const evidenceVerified = evidenceOutputs.every((row) => row.status === 'verified');
    const evidenceOkayForPass = !gradingPolicy.requireAllEvidenceVerifiedForPass || evidenceVerified;
    status = meetsScore && criticalOkay && domainMinimumsOkay && evidenceOkayForPass ? 'passed' : 'failed';
    finalEvaluatedAt = evaluatedAt;
    gradingDecision = {
      rubricVersion: gradingPolicy.version,
      overallScorePassed: meetsScore,
      criticalErrorRulePassed: criticalOkay,
      domainMinimumsPassed: domainMinimumsOkay,
      failedDomainMinimums,
      evidenceReviewed,
      evidenceVerified,
      evidenceRulePassed: evidenceOkayForPass
    };
  }

  const followUpStatus = normalizeFollowUpStatus(input.followUpStatus, { finalStatus: mode === 'finalize' ? status : null });
  if (followUpStatus === 'reassessment-scheduled' && !reassessmentTargetDate) throw new Error('reassessmentTargetDate is required when reassessment is scheduled');

  return {
    assessmentId: practical.id,
    assessmentVersion: String(practical.version),
    status,
    scorePercent,
    criticalErrorCount: criticalErrors.length,
    evaluatorId,
    evaluatedAt: finalEvaluatedAt,
    evidence: {
      domainScores,
      criticalErrors,
      evidenceOutputs,
      gradingDecision,
      followUpStatus,
      reassessmentTargetDate,
      evaluatorNotes,
      learnerFeedback,
      history,
      savedAt: evaluatedAt
    }
  };
}
