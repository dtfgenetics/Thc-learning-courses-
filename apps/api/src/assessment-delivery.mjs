import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { competencyResults, createAttempt, scoreAttempt, submitAttempt } from '../../../packages/domain/assessment-runtime.mjs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadQuestions(root) {
  const dir = path.join(root, 'content/questions');
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(dir, name)));
}

function hashToUint32(value) {
  return Number.parseInt(crypto.createHash('sha256').update(value).digest('hex').slice(0, 8), 16) >>> 0;
}

function mulberry32(a) {
  return function rand() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, rand) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildForm({ assessment, questions, seed, allowDraft }) {
  const eligibleStatuses = allowDraft
    ? new Set(['draft', 'technical-review', 'editorial-review', 'pilot', 'active'])
    : new Set(['active']);
  const rand = mulberry32(hashToUint32(seed));
  const selected = [];
  const selectedIds = new Set();

  function choose(pool, count, label) {
    if (pool.length < count) throw new Error(`insufficient-active-items:${label}`);
    for (const item of shuffle(pool, rand).slice(0, count)) {
      const key = `${item.id}@${item.version}`;
      if (selectedIds.has(key)) throw new Error(`duplicate-selected-item:${key}`);
      selectedIds.add(key);
      selected.push(item);
    }
  }

  if (Array.isArray(assessment.itemPools) && assessment.itemPools.length) {
    for (const row of assessment.itemPools) {
      choose(questions.filter((item) =>
        item.id.startsWith(row.idPrefix) &&
        ['summative', 'credential'].includes(item.purpose) &&
        eligibleStatuses.has(item.status)
      ), row.items, row.name ?? row.idPrefix);
    }
  } else {
    for (const row of assessment.blueprint ?? []) {
      choose(questions.filter((item) =>
        item.competency === row.competency &&
        ['summative', 'credential'].includes(item.purpose) &&
        eligibleStatuses.has(item.status)
      ), row.items, row.competency);
    }
  }

  if (assessment.totalItems && selected.length !== assessment.totalItems) {
    throw new Error(`assessment-item-count-mismatch:${selected.length}:${assessment.totalItems}`);
  }
  const formKey = assessment.id.replace(/^ASSESS-/, '').replace(/-001$/, '');
  const form = {
    id: `FORM-${formKey}-${crypto.createHash('sha256').update(`${assessment.id}:${seed}`).digest('hex').slice(0, 12).toUpperCase()}`,
    assessment: assessment.id,
    assessmentVersion: assessment.version,
    algorithmVersion: '1.1.0',
    items: selected.map((item) => ({
      itemId: item.id,
      itemVersion: item.version,
      competency: item.competency
    })),
    seed,
    integrityHash: ''
  };
  form.integrityHash = crypto.createHash('sha256')
    .update(JSON.stringify({ ...form, integrityHash: undefined }))
    .digest('hex');
  return { form, selected };
}

function publicQuestion(item, position, response = null) {
  return {
    position,
    itemId: item.id,
    itemVersion: item.version,
    type: item.type,
    stem: item.stem,
    choices: Array.isArray(item.choices) ? item.choices : undefined,
    response
  };
}

export function createAssessmentDeliveryService({ root = process.cwd(), allowDraft = false } = {}) {
  const questions = loadQuestions(root);
  const questionMap = new Map(questions.map((item) => [`${item.id}@${item.version}`, item]));

  function loadAssessment(assessmentId) {
    if (!/^ASSESS-[A-Z0-9-]+$/.test(String(assessmentId ?? ''))) return null;
    const file = path.join(root, 'content/assessments', `${assessmentId}.json`);
    if (!fs.existsSync(file)) return null;
    const assessment = readJson(file);
    return assessment?.id === assessmentId ? assessment : null;
  }

  function requireSelectedItems(attempt) {
    return attempt.items.map((row) => {
      const item = questionMap.get(`${row.itemId}@${row.itemVersion}`);
      if (!item) throw new Error(`missing-immutable-item:${row.itemId}@${row.itemVersion}`);
      return item;
    });
  }

  function requireAssessmentVersion(attempt) {
    const assessment = loadAssessment(attempt.assessmentId);
    if (!assessment) throw new Error('assessment-not-found');
    if (String(assessment.version) !== String(attempt.assessmentVersion)) throw new Error('assessment-version-mismatch');
    return assessment;
  }

  function validateResponses(attempt, responses) {
    const allowed = new Set(attempt.items.map((row) => `${row.itemId}@${row.itemVersion}`));
    const seen = new Set();
    for (const row of responses ?? []) {
      const key = `${row.itemId}@${row.itemVersion}`;
      if (!allowed.has(key)) throw new Error('response-item-mismatch');
      if (seen.has(key)) throw new Error('duplicate-response-item');
      seen.add(key);
    }
  }

  return {
    start({ learnerId, assessmentId, seed = crypto.randomUUID() }) {
      const assessment = loadAssessment(assessmentId);
      if (!assessment) throw new Error('assessment-not-found');
      if (!allowDraft && assessment.status !== 'active') throw new Error('assessment-not-active');
      const { form, selected } = buildForm({ assessment, questions, seed, allowDraft });
      const attempt = createAttempt({ learnerId, assessment, form });
      return { attempt, assessment, selected };
    },
    submit({ attempt, responses }) {
      requireAssessmentVersion(attempt);
      validateResponses(attempt, responses);
      return submitAttempt(attempt, responses ?? []);
    },
    score({ attempt }) {
      const assessment = requireAssessmentVersion(attempt);
      const selected = requireSelectedItems(attempt);
      const scored = scoreAttempt(attempt, selected, Number(assessment.passingScorePercent));
      return { scored, competencyResults: competencyResults(scored) };
    },
    submitAndScore({ attempt, responses }) {
      const submitted = this.submit({ attempt, responses });
      const { scored, competencyResults: results } = this.score({ attempt: submitted });
      return { submitted, scored, competencyResults: results };
    },
    publicView(attempt) {
      const selected = requireSelectedItems(attempt);
      const items = selected.map((item, index) => publicQuestion(item, index + 1, attempt.items[index]?.response ?? null));
      const view = {
        id: attempt.id,
        assessmentId: attempt.assessmentId,
        assessmentVersion: attempt.assessmentVersion,
        formId: attempt.formId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        scoredAt: attempt.scoredAt,
        items
      };
      if (attempt.status === 'scored') {
        view.scorePercent = attempt.scorePercent;
        view.passed = attempt.passed;
        view.competencies = competencyResults(attempt);
      }
      return view;
    }
  };
}
