function cleanText(value, maxLength) {
  const text = String(value ?? '').trim();
  return text.slice(0, maxLength);
}

const EVIDENCE_OUTPUT_STATUSES = new Set(['not-reviewed', 'received', 'verified', 'needs-revision']);
const FOLLOW_UP_STATUSES = new Set(['none', 'remediation-assigned', 'remediation-in-progress', 'ready-for-reassessment', 'reassessment-scheduled', 'closed']);

function normalizeDomainScores(practical, rows = [], { requireComplete = false } = {}) {
  if (!Array.isArray(rows)) throw new Error('domainScores must be an array');
  const domains = practical?.scoring?.domains ?? [];
  const limits = new Map(domains.map((domain) => [domain.name, Number(domain.points)]));
  const seen = new Set();
  const normalized = [];

  for (const row of rows) {
    const name = String(row?.name ?? '').trim();
    if (!limits.has(name)) throw new Error(`unknown practical scoring domain: ${name}`);
    if (seen.has(name)) throw new Error(`duplicate practical scoring domain: ${name}`);
    const score = Number(row?.score);
    const maximum = limits.get(name);
    if (!Number.isFinite(score) || score < 0 || score > maximum) throw new Error(`invalid score for ${name}`);
    seen.add(name);
    normalized.push({ name, score, points: maximum });
  }

  if (requireComplete && seen.size !== domains.length) throw new Error('all practical scoring domains are required for finalization');
  return domains.map((domain) => normalized.find((row) => row.name === domain.name) ?? { name: domain.name, score: null, points: Number(domain.points) });
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
    followUpStatus: existing.evidence?.followUpStatus ?? 'none',
    reassessmentTargetDate: existing.evidence?.reassessmentTargetDate ?? '',
    learnerFeedback: existing.evidence?.learnerFeedback ?? '',
    evaluatorNotes: existing.evidence?.evaluatorNotes ?? ''
  });
  return history.slice(-20);
}

export function practicalEvaluatorView(practical, existing = null) {
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
        domains: (practical.scoring?.domains ?? []).map((domain) => ({ name: domain.name, points: Number(domain.points) }))
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
      domainScores: Array.isArray(existing.evidence?.domainScores) ? structuredClone(existing.evidence.domainScores) : [],
      criticalErrors: Array.isArray(existing.evidence?.criticalErrors) ? structuredClone(existing.evidence.criticalErrors) : [],
      evidenceOutputs: normalizeEvidenceOutputs(practical, existing.evidence?.evidenceOutputs ?? []),
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

  if (mode === 'finalize') {
    const totalPoints = Number(practical.scoring?.totalPoints ?? domainScores.reduce((sum, row) => sum + row.points, 0));
    const earned = domainScores.reduce((sum, row) => sum + Number(row.score ?? 0), 0);
    scorePercent = totalPoints > 0 ? Math.round((earned / totalPoints) * 10000) / 100 : 0;
    const meetsScore = scorePercent >= Number(practical.passingStandard?.minimumPercent ?? 0);
    const criticalOkay = practical.passingStandard?.noCriticalErrors === true ? criticalErrors.length === 0 : true;
    status = meetsScore && criticalOkay ? 'passed' : 'failed';
    finalEvaluatedAt = evaluatedAt;
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
      followUpStatus,
      reassessmentTargetDate,
      evaluatorNotes,
      learnerFeedback,
      history,
      savedAt: evaluatedAt
    }
  };
}
