import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { competencyResults, createAttempt, scoreAttempt, submitAttempt } from '../../../packages/domain/assessment-runtime.mjs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadDirectoryJson(root, directory) {
  const dir = path.join(root, directory);
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(dir, name)));
}

function loadQuestions(root) {
  return loadDirectoryJson(root, 'content/questions');
}

function loadCompetencies(root) {
  return loadDirectoryJson(root, 'content/competencies');
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

function buildForm({ assessment, questions, competencyMap, seed, allowDraft }) {
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
  const payload = {
    id: `FORM-${formKey}-${crypto.createHash('sha256').update(`${assessment.id}:${seed}`).digest('hex').slice(0, 12).toUpperCase()}`,
    assessment: assessment.id,
    assessmentVersion: assessment.version,
    algorithmVersion: '1.3.0',
    items: selected.map((item) => {
      const competency = competencyMap.get(item.competency);
      if (!competency?.version) throw new Error(`missing-competency-version:${item.competency}`);
      return {
        itemId: item.id,
        itemVersion: item.version,
        competency: item.competency,
        competencyVersion: String(competency.version)
      };
    }),
    seed,
    integrityHash: ''
  };
  payload.integrityHash = crypto.createHash('sha256')
    .update(JSON.stringify({ ...payload, integrityHash: undefined }))
    .digest('hex');
  return { form: payload, selected };
}

function choiceOrder(attempt, item, randomizeChoices) {
  if (!randomizeChoices || !Array.isArray(item.choices) || item.choices.length < 2) {
    return Array.from({ length: item.choices?.length ?? 0 }, (_, index) => index);
  }
  const rand = mulberry32(hashToUint32(`${attempt.formHash}:${item.id}@${item.version}:choices`));
  return shuffle(Array.from({ length: item.choices.length }, (_, index) => index), rand);
}

function inverseChoiceOrder(order) {
  const inverse = [];
  order.forEach((canonicalIndex, displayedIndex) => { inverse[canonicalIndex] = displayedIndex; });
  return inverse;
}

function validateDisplayedResponse(item, response) {
  if (['multiple-choice', 'scenario', 'case-study'].includes(item.type)) {
    const index = Number(response);
    if (!Number.isInteger(index) || index < 0 || index >= (item.choices?.length ?? 0)) throw new Error('invalid-response-value');
    return;
  }
  if (item.type === 'multiple-response') {
    if (!Array.isArray(response) || response.length === 0) throw new Error('invalid-response-value');
    const values = response.map(Number);
    if (values.some((index) => !Number.isInteger(index) || index < 0 || index >= (item.choices?.length ?? 0))) throw new Error('invalid-response-value');
    if (new Set(values).size !== values.length) throw new Error('invalid-response-value');
    return;
  }
  if (item.type === 'numeric') {
    if (!Number.isFinite(Number(response))) throw new Error('invalid-response-value');
    return;
  }
  throw new Error(`unsupported-response-type:${item.type}`);
}

function canonicalResponse(attempt, item, response, randomizeChoices) {
  validateDisplayedResponse(item, response);
  if (item.type === 'numeric') return Number(response);
  const order = choiceOrder(attempt, item, randomizeChoices);
  if (item.type === 'multiple-response') return response.map((index) => order[Number(index)]);
  return order[Number(response)];
}

function displayedResponse(attempt, item, response, randomizeChoices) {
  if (response == null) return null;
  if (item.type === 'numeric') return response;
  const inverse = inverseChoiceOrder(choiceOrder(attempt, item, randomizeChoices));
  if (item.type === 'multiple-response') return Array.isArray(response) ? response.map((index) => inverse[Number(index)]) : [];
  return inverse[Number(response)];
}

function publicQuestion(attempt, item, position, response, randomizeChoices) {
  const order = choiceOrder(attempt, item, randomizeChoices);
  return {
    position,
    itemId: item.id,
    itemVersion: item.version,
    type: item.type,
    stem: item.stem,
    choices: Array.isArray(item.choices) ? order.map((index) => item.choices[index]) : undefined,
    response: displayedResponse(attempt, item, response, randomizeChoices)
  };
}

export function projectAssessmentFeedback({ assessment, scoredAttempt } = {}) {
  if (!assessment?.id || scoredAttempt?.status !== 'scored') return {};
  const feedback = {
    scorePercent: scoredAttempt.scorePercent,
    passed: scoredAttempt.passed
  };
  if (assessment.feedbackMode === 'post-attempt-domain-level') {
    feedback.competencies = competencyResults(scoredAttempt);
  }
  return feedback;
}

export function createAssessmentDeliveryService({ root = process.cwd(), allowDraft = false } = {}) {
  const questions = loadQuestions(root);
  const competencies = loadCompetencies(root);
  const questionMap = new Map(questions.map((item) => [`${item.id}@${item.version}`, item]));
  const competencyMap = new Map(competencies.map((item) => [item.id, item]));

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
    policyDefinition(assessmentId) {
      const assessment = loadAssessment(assessmentId);
      if (!assessment) return null;
      return {
        id: assessment.id,
        version: assessment.version,
        status: assessment.status,
        maxAttempts: assessment.maxAttempts ?? null,
        cooldownHours: assessment.cooldownHours ?? 0
      };
    },
    start({ learnerId, assessmentId, seed = crypto.randomUUID() }) {
      const assessment = loadAssessment(assessmentId);
      if (!assessment) throw new Error('assessment-not-found');
      if (!allowDraft && assessment.status !== 'active') throw new Error('assessment-not-active');
      const { form, selected } = buildForm({ assessment, questions, competencyMap, seed, allowDraft });
      const attempt = createAttempt({ learnerId, assessment, form });
      return { attempt, assessment, selected };
    },
    submit({ attempt, responses }) {
      const assessment = requireAssessmentVersion(attempt);
      validateResponses(attempt, responses);
      const canonical = (responses ?? []).map((row) => {
        const item = questionMap.get(`${row.itemId}@${row.itemVersion}`);
        if (!item) throw new Error('response-item-mismatch');
        return {
          ...row,
          response: canonicalResponse(attempt, item, row.response, assessment.randomizeChoices === true)
        };
      });
      return submitAttempt(attempt, canonical);
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
      const assessment = requireAssessmentVersion(attempt);
      const selected = requireSelectedItems(attempt);
      const items = selected.map((item, index) => publicQuestion(
        attempt,
        item,
        index + 1,
        attempt.items[index]?.response ?? null,
        assessment.randomizeChoices === true
      ));
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
      if (attempt.status === 'scored') Object.assign(view, projectAssessmentFeedback({ assessment, scoredAttempt: attempt }));
      return view;
    }
  };
}
