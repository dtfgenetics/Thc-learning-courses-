import crypto from 'node:crypto';
import { createAttempt, scoreAttempt, competencyResults } from './assessment-runtime.mjs';

function hashToUint32(value) {
  return Number.parseInt(crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8), 16) >>> 0;
}

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, seed) {
  const result = [...values];
  const random = mulberry32(hashToUint32(seed));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function safeReferences(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : [];
}

export function sanitizeAssessmentStimulus(blocks) {
  if (!Array.isArray(blocks)) return [];
  const out = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object' || typeof block.type !== 'string') continue;
    const references = safeReferences(block.references);
    if (block.type === 'text' && typeof block.body === 'string') {
      out.push({ type: 'text', ...(typeof block.title === 'string' ? { title: block.title } : {}), body: block.body, ...(references.length ? { references } : {}) });
    } else if (block.type === 'callout' && typeof block.body === 'string') {
      out.push({ type: 'callout', ...(typeof block.title === 'string' ? { title: block.title } : {}), body: block.body, ...(typeof block.tone === 'string' ? { tone: block.tone } : {}), ...(references.length ? { references } : {}) });
    } else if (block.type === 'image' && typeof block.src === 'string' && block.src.startsWith('/assets/') && typeof block.alt === 'string') {
      out.push({ type: 'image', src: block.src, alt: block.alt, ...(typeof block.assetId === 'string' ? { assetId: block.assetId } : {}), ...(typeof block.caption === 'string' ? { caption: block.caption } : {}), ...(typeof block.credit === 'string' ? { credit: block.credit } : {}), ...(references.length ? { references } : {}) });
    } else if (block.type === 'steps' && typeof block.title === 'string') {
      const items = (block.items ?? block.steps ?? []).filter((item) => item && typeof item === 'object' && typeof item.body === 'string').map((item) => ({ ...(typeof item.title === 'string' ? { title: item.title } : {}), body: item.body }));
      if (items.length) out.push({ type: 'steps', title: block.title, items, ...(references.length ? { references } : {}) });
    } else if (block.type === 'comparison') {
      const side = (value) => value && typeof value.label === 'string' && typeof value.body === 'string' ? { label: value.label, body: value.body, ...(typeof value.image === 'string' && value.image.startsWith('/assets/') ? { image: value.image } : {}), ...(typeof value.alt === 'string' ? { alt: value.alt } : {}) } : null;
      const left = side(block.left);
      const right = side(block.right);
      if (left && right) out.push({ type: 'comparison', ...(typeof block.title === 'string' ? { title: block.title } : {}), left, right, ...(references.length ? { references } : {}) });
    } else if (block.type === 'table' && Array.isArray(block.columns) && Array.isArray(block.rows)) {
      const columns = block.columns.filter((column) => typeof column === 'string');
      const rows = block.rows.filter(Array.isArray).map((row) => row.map((cell) => String(cell ?? '')));
      if (columns.length) out.push({ type: 'table', ...(typeof block.title === 'string' ? { title: block.title } : {}), ...(typeof block.caption === 'string' ? { caption: block.caption } : {}), columns, rows, ...(references.length ? { references } : {}) });
    } else if (block.type === 'document' && typeof block.title === 'string') {
      const fields = (block.fields ?? []).filter((field) => field && typeof field.label === 'string' && typeof field.value === 'string').map((field) => ({ label: field.label, value: field.value }));
      if (fields.length) out.push({ type: 'document', title: block.title, fields, ...(typeof block.description === 'string' ? { description: block.description } : {}), ...(typeof block.note === 'string' ? { note: block.note } : {}), ...(references.length ? { references } : {}) });
    } else if (block.type === 'resource' && typeof block.title === 'string') {
      out.push({ type: 'resource', title: block.title, ...(typeof block.body === 'string' ? { body: block.body } : {}), ...(typeof block.href === 'string' ? { href: block.href } : {}), ...(typeof block.label === 'string' ? { label: block.label } : {}), ...(references.length ? { references } : {}) });
    } else if (block.type === 'divider') out.push({ type: 'divider' });
  }
  return out;
}

function choicePairs(item, formId, randomizeChoices = true) {
  const pairs = (item.choices ?? []).map((choice, sourceIndex) => ({ choice, sourceIndex }));
  return randomizeChoices ? shuffled(pairs, `${formId}:${item.id}@${item.version}:choices`) : pairs;
}

export function buildCourseAssessmentForm({ assessment, itemBank, seed = crypto.randomUUID() }) {
  if (!assessment?.id || !Array.isArray(assessment.items) || assessment.items.length === 0) throw new Error('assessment items required');
  const byId = new Map(itemBank.map((item) => [item.id, item]));
  const selected = assessment.items.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`Missing assessment item ${id}`);
    if (item.purpose !== 'summative') throw new Error(`Course assessment item ${id} must be summative`);
    return { id: item.id, version: item.version, competency: item.competency };
  });
  const ordered = assessment.randomizeItems ? shuffled(selected, `${assessment.id}:${seed}:items`) : selected;
  const digest = crypto.createHash('sha256').update(JSON.stringify({ assessment: assessment.id, version: assessment.version, seed, items: ordered })).digest('hex');
  return {
    id: `FORM-${assessment.id.replace(/^ASSESS-/, '')}-${digest.slice(0, 12).toUpperCase()}`,
    assessment: assessment.id,
    assessmentVersion: assessment.version,
    algorithmVersion: 'course-runtime-1.0.0',
    items: ordered,
    seed,
    integrityHash: digest
  };
}

export function createCourseAssessmentAttempt({ learnerId, assessment, itemBank, now = new Date().toISOString(), seed }) {
  const form = buildCourseAssessmentForm({ assessment, itemBank, seed });
  return createAttempt({ learnerId, assessment, form, now });
}

export function presentCourseAssessmentItem(item, { formId, response = null, randomizeChoices = true } = {}) {
  const base = {
    id: item.id,
    version: item.version,
    type: item.type,
    competency: item.competency,
    objective: item.objective ?? null,
    stem: item.stem,
    stimulus: sanitizeAssessmentStimulus(item.stimulus)
  };
  if (['multiple-choice', 'scenario', 'case-study', 'multiple-response'].includes(item.type)) {
    const pairs = choicePairs(item, formId, randomizeChoices);
    const presentedResponse = item.type === 'multiple-response'
      ? (Array.isArray(response) ? response.map((sourceIndex) => pairs.findIndex((pair) => pair.sourceIndex === Number(sourceIndex))).filter((index) => index >= 0).sort((a, b) => a - b) : [])
      : (response == null ? null : pairs.findIndex((pair) => pair.sourceIndex === Number(response)));
    return { ...base, choices: pairs.map((pair) => pair.choice), response: presentedResponse };
  }
  if (item.type === 'numeric') return { ...base, response: response == null ? null : Number(response) };
  throw new Error(`Unsupported learner assessment item type ${item.type}`);
}

export function normalizePresentedResponse(item, { formId, response, randomizeChoices = true } = {}) {
  if (['multiple-choice', 'scenario', 'case-study'].includes(item.type)) {
    if (!Number.isInteger(response)) throw new Error(`Response for ${item.id} must be a choice index`);
    const pairs = choicePairs(item, formId, randomizeChoices);
    const selected = pairs[response];
    if (!selected) throw new Error(`Response for ${item.id} is out of range`);
    return selected.sourceIndex;
  }
  if (item.type === 'multiple-response') {
    if (!Array.isArray(response)) throw new Error(`Response for ${item.id} must be an array`);
    const pairs = choicePairs(item, formId, randomizeChoices);
    const unique = [...new Set(response.map(Number))];
    if (unique.some((index) => !Number.isInteger(index) || !pairs[index])) throw new Error(`Response for ${item.id} contains an invalid choice`);
    return unique.map((index) => pairs[index].sourceIndex).sort((a, b) => a - b);
  }
  if (item.type === 'numeric') {
    const numeric = Number(response);
    if (!Number.isFinite(numeric)) throw new Error(`Response for ${item.id} must be numeric`);
    return numeric;
  }
  throw new Error(`Unsupported learner assessment item type ${item.type}`);
}

export function presentCourseAssessmentAttempt({ assessment, attempt, itemBank }) {
  const bank = new Map(itemBank.map((item) => [`${item.id}@${item.version}`, item]));
  const items = attempt.items.map((row) => {
    const item = bank.get(`${row.itemId}@${row.itemVersion}`);
    if (!item) throw new Error(`Missing immutable item version ${row.itemId}@${row.itemVersion}`);
    return presentCourseAssessmentItem(item, { formId: attempt.formId, response: row.response, randomizeChoices: assessment.randomizeChoices !== false });
  });
  return {
    attempt: {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      assessmentVersion: attempt.assessmentVersion,
      formId: attempt.formId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? null,
      scoredAt: attempt.scoredAt ?? null
    },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      totalItems: items.length,
      passingScorePercent: Number(assessment.passingScorePercent ?? 0),
      feedbackMode: assessment.feedbackMode ?? null
    },
    items
  };
}

export function scorePersistedCourseAssessment({ assessment, attempt, itemBank, now = new Date().toISOString() }) {
  if (attempt.status !== 'started') throw new Error(`Cannot score attempt in status ${attempt.status}`);
  const unanswered = attempt.items.filter((row) => row.response == null || (Array.isArray(row.response) && row.response.length === 0));
  if (unanswered.length) throw new Error(`Assessment has ${unanswered.length} unanswered item(s)`);
  const submitted = { ...attempt, status: 'submitted', submittedAt: now };
  const scored = scoreAttempt(submitted, itemBank, Number(assessment.passingScorePercent ?? 0), now);
  return { attempt: scored, competencyResults: competencyResults(scored) };
}
