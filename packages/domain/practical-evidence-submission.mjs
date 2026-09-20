const ALLOWED_STATUSES = new Set(['draft', 'submitted']);

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function normalizePracticalEvidenceSubmission(practical, input = {}, existing = null) {
  if (!practical?.id || !practical?.version) throw new Error('practical definition required');
  const status = clean(input.status ?? existing?.status ?? 'draft', 20);
  if (!ALLOWED_STATUSES.has(status)) throw new Error('invalid practical submission status');

  const canonical = practical.evidenceOutputs ?? [];
  const supplied = new Map();
  for (const row of input.evidenceOutputs ?? existing?.evidenceOutputs ?? []) {
    const name = clean(row?.name, 200);
    if (!canonical.includes(name)) throw new Error(`unknown practical evidence output: ${name}`);
    if (supplied.has(name)) throw new Error(`duplicate practical evidence output: ${name}`);
    supplied.set(name, {
      name,
      reference: clean(row?.reference, 500),
      description: clean(row?.description, 1000)
    });
  }
  const evidenceOutputs = canonical.map((name) => supplied.get(name) ?? { name, reference: '', description: '' });
  if (status === 'submitted') {
    const incomplete = evidenceOutputs.find((row) => !row.reference || !row.description);
    if (incomplete) throw new Error(`reference and description required for submitted evidence: ${incomplete.name}`);
  }

  return {
    practicalId: practical.id,
    practicalVersion: String(practical.version),
    status,
    evidenceOutputs,
    learnerStatement: clean(input.learnerStatement ?? existing?.learnerStatement, 2000)
  };
}

export function learnerPracticalSubmissionView(practical, record = null) {
  const normalized = normalizePracticalEvidenceSubmission(practical, record ?? {});
  return {
    practical: {
      id: practical.id,
      title: practical.title,
      version: String(practical.version),
      evidenceOutputs: [...(practical.evidenceOutputs ?? [])]
    },
    submission: {
      status: normalized.status,
      evidenceOutputs: normalized.evidenceOutputs,
      learnerStatement: normalized.learnerStatement,
      submittedAt: record?.submittedAt ?? null,
      updatedAt: record?.updatedAt ?? null
    },
    boundary: 'Submitting references does not score the practical or issue a credential. An authorized evaluator must review the underlying evidence.'
  };
}
