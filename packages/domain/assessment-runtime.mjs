import crypto from 'node:crypto';

export function createAttempt({ learnerId, assessment, form, now = new Date().toISOString() }) {
  if (!learnerId) throw new Error('learnerId required');
  if (!assessment?.id || !form?.id || !Array.isArray(form.items)) throw new Error('assessment and form required');
  return {
    id: crypto.randomUUID(),
    learnerId,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    formId: form.id,
    formHash: form.integrityHash,
    status: 'started',
    startedAt: now,
    submittedAt: null,
    scoredAt: null,
    items: form.items.map((item, index) => ({
      position: index + 1,
      itemId: item.itemId,
      itemVersion: item.itemVersion,
      competency: item.competency,
      response: null,
      score: null,
      maxScore: 1
    }))
  };
}

export function submitAttempt(attempt, responses, now = new Date().toISOString()) {
  if (attempt.status !== 'started') throw new Error(`Cannot submit attempt in status ${attempt.status}`);
  const responseMap = new Map((responses ?? []).map((r) => [`${r.itemId}@${r.itemVersion}`, r.response]));
  const items = attempt.items.map((item) => ({ ...item, response: responseMap.get(`${item.itemId}@${item.itemVersion}`) ?? null }));
  return { ...attempt, items, status: 'submitted', submittedAt: now };
}

export function scoreAttempt(attempt, itemBank, passingScorePercent, now = new Date().toISOString()) {
  if (attempt.status !== 'submitted') throw new Error(`Cannot score attempt in status ${attempt.status}`);
  const bank = new Map(itemBank.map((item) => [`${item.id}@${item.version}`, item]));
  let earned = 0;
  let possible = 0;
  const items = attempt.items.map((row) => {
    const item = bank.get(`${row.itemId}@${row.itemVersion}`);
    if (!item) throw new Error(`Missing immutable item version ${row.itemId}@${row.itemVersion}`);
    let score = 0;
    if (['multiple-choice','scenario','case-study'].includes(item.type)) score = Number(row.response) === Number(item.correct) ? 1 : 0;
    else if (item.type === 'multiple-response') {
      const expected = [...item.correct].sort((a,b) => a-b);
      const actual = Array.isArray(row.response) ? [...row.response].sort((a,b) => a-b) : [];
      score = JSON.stringify(expected) === JSON.stringify(actual) ? 1 : 0;
    } else throw new Error(`Unsupported production scoring type ${item.type}`);
    earned += score;
    possible += 1;
    return { ...row, score };
  });
  const scorePercent = possible ? Number(((earned / possible) * 100).toFixed(2)) : 0;
  return {
    ...attempt,
    items,
    status: 'scored',
    scoredAt: now,
    scorePercent,
    passed: scorePercent >= passingScorePercent
  };
}

export function competencyResults(scoredAttempt) {
  if (scoredAttempt.status !== 'scored') throw new Error('Attempt must be scored');
  const groups = new Map();
  for (const row of scoredAttempt.items) {
    const entry = groups.get(row.competency) ?? { earned: 0, possible: 0 };
    entry.earned += row.score ?? 0;
    entry.possible += row.maxScore ?? 1;
    groups.set(row.competency, entry);
  }
  return [...groups.entries()].map(([competency, v]) => ({
    competency,
    scorePercent: Number(((v.earned / v.possible) * 100).toFixed(2)),
    masteryLevel: v.earned === v.possible ? 'demonstrated' : v.earned > 0 ? 'developing' : 'not-demonstrated'
  }));
}
