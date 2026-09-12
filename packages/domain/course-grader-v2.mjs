export const COURSE_GRADER_ALGORITHM_VERSION = 'course-grader-2.0.0';

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function itemWeight(item) {
  const weight = numeric(item?.extensions?.grading?.weight, 1);
  return weight > 0 ? weight : 1;
}

function gradingPolicy(assessment) {
  const source = assessment?.extensions?.gradingPolicy ?? {};
  const mastery = source.masteryBands ?? {};
  const competencyMinimums = source.competencyMinimums && typeof source.competencyMinimums === 'object'
    ? Object.fromEntries(Object.entries(source.competencyMinimums).map(([key, value]) => [key, numeric(value, 0)]))
    : {};
  return {
    multipleResponseMethod: source.multipleResponseMethod === 'partial-credit' ? 'partial-credit' : 'exact',
    multipleResponseIncorrectPenalty: clamp(numeric(source.multipleResponseIncorrectPenalty, 0.5), 0, 1),
    masteryDemonstratedPercent: clamp(numeric(mastery.demonstratedPercent, 80), 0, 100),
    masteryDevelopingPercent: clamp(numeric(mastery.developingPercent, 60), 0, 100),
    competencyMinimums,
    requireCompetencyMinimums: source.requireCompetencyMinimums === true
  };
}

function multipleResponseFraction(item, response, policy) {
  const expected = new Set((item.correct ?? []).map(Number));
  const actual = new Set((Array.isArray(response) ? response : []).map(Number));
  if (!expected.size) return 0;
  if (policy.multipleResponseMethod !== 'partial-credit') {
    if (expected.size !== actual.size) return 0;
    return [...expected].every((value) => actual.has(value)) ? 1 : 0;
  }
  const correctSelections = [...actual].filter((value) => expected.has(value)).length;
  const incorrectSelections = [...actual].filter((value) => !expected.has(value)).length;
  const totalIncorrectOptions = Math.max(1, (item.choices?.length ?? expected.size) - expected.size);
  const recall = correctSelections / expected.size;
  const falsePositiveRate = incorrectSelections / totalIncorrectOptions;
  return clamp(recall - (falsePositiveRate * policy.multipleResponseIncorrectPenalty));
}

function numericFraction(item, response) {
  const actual = Number(response);
  const expected = Number(item.correct);
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return 0;
  const grading = item?.extensions?.grading ?? {};
  if (Array.isArray(grading.acceptedRange) && grading.acceptedRange.length === 2) {
    const minimum = Number(grading.acceptedRange[0]);
    const maximum = Number(grading.acceptedRange[1]);
    if (Number.isFinite(minimum) && Number.isFinite(maximum)) return actual >= Math.min(minimum, maximum) && actual <= Math.max(minimum, maximum) ? 1 : 0;
  }
  const absoluteTolerance = Math.max(0, numeric(grading.absoluteTolerance, 0));
  const relativeTolerancePercent = Math.max(0, numeric(grading.relativeTolerancePercent, 0));
  const relativeTolerance = Math.abs(expected) * (relativeTolerancePercent / 100);
  const tolerance = Math.max(absoluteTolerance, relativeTolerance);
  return Math.abs(actual - expected) <= tolerance ? 1 : 0;
}

function itemScoreFraction(item, response, policy) {
  if (['multiple-choice', 'scenario', 'case-study'].includes(item.type)) return Number(response) === Number(item.correct) ? 1 : 0;
  if (item.type === 'multiple-response') return multipleResponseFraction(item, response, policy);
  if (item.type === 'numeric') return numericFraction(item, response);
  throw new Error(`Unsupported course scoring type ${item.type}`);
}

function masteryLevel(scorePercent, policy) {
  if (scorePercent >= policy.masteryDemonstratedPercent) return 'demonstrated';
  if (scorePercent >= policy.masteryDevelopingPercent) return 'developing';
  return 'not-demonstrated';
}

function aggregate(scoredItems, itemBank, keyName, policy) {
  const bank = new Map(itemBank.map((item) => [`${item.id}@${item.version}`, item]));
  const groups = new Map();
  for (const row of scoredItems) {
    const item = bank.get(`${row.itemId}@${row.itemVersion}`);
    if (!item) throw new Error(`Missing immutable item version ${row.itemId}@${row.itemVersion}`);
    const key = item[keyName] ?? 'UNMAPPED';
    const current = groups.get(key) ?? { earned: 0, possible: 0, itemCount: 0 };
    current.earned += numeric(row.score, 0);
    current.possible += numeric(row.maxScore, 1);
    current.itemCount += 1;
    groups.set(key, current);
  }
  return [...groups.entries()].map(([id, values]) => {
    const scorePercent = values.possible ? Number(((values.earned / values.possible) * 100).toFixed(2)) : 0;
    return {
      id,
      earned: Number(values.earned.toFixed(4)),
      possible: Number(values.possible.toFixed(4)),
      itemCount: values.itemCount,
      scorePercent,
      masteryLevel: masteryLevel(scorePercent, policy)
    };
  });
}

export function deriveCourseAssessmentResults({ assessment, attempt, itemBank }) {
  if (attempt?.status !== 'scored') throw new Error('Attempt must be scored');
  const policy = gradingPolicy(assessment);
  const competencyResults = aggregate(attempt.items ?? [], itemBank, 'competency', policy).map((row) => ({ competency: row.id, ...row }));
  const objectiveResults = aggregate(attempt.items ?? [], itemBank, 'objective', policy).map((row) => ({ objective: row.id, ...row }));
  const failedCompetencyMinimums = competencyResults
    .filter((row) => Object.hasOwn(policy.competencyMinimums, row.competency) && row.scorePercent < policy.competencyMinimums[row.competency])
    .map((row) => ({ competency: row.competency, scorePercent: row.scorePercent, minimumPercent: policy.competencyMinimums[row.competency] }));
  return {
    algorithmVersion: COURSE_GRADER_ALGORITHM_VERSION,
    policy,
    competencyResults,
    objectiveResults,
    failedCompetencyMinimums,
    overallScorePassed: Number(attempt.scorePercent ?? 0) >= Number(assessment.passingScorePercent ?? 0),
    competencyMinimumsPassed: !policy.requireCompetencyMinimums || failedCompetencyMinimums.length === 0
  };
}

export function scoreCourseAssessmentAttempt({ assessment, attempt, itemBank, now = new Date().toISOString() }) {
  if (attempt?.status !== 'started') throw new Error(`Cannot score attempt in status ${attempt?.status}`);
  const unanswered = (attempt.items ?? []).filter((row) => row.response == null || (Array.isArray(row.response) && row.response.length === 0));
  if (unanswered.length) throw new Error(`Assessment has ${unanswered.length} unanswered item(s)`);
  const bank = new Map(itemBank.map((item) => [`${item.id}@${item.version}`, item]));
  const policy = gradingPolicy(assessment);
  let earned = 0;
  let possible = 0;
  const items = (attempt.items ?? []).map((row) => {
    const item = bank.get(`${row.itemId}@${row.itemVersion}`);
    if (!item) throw new Error(`Missing immutable item version ${row.itemId}@${row.itemVersion}`);
    const maxScore = itemWeight(item);
    const fraction = itemScoreFraction(item, row.response, policy);
    const score = Number((fraction * maxScore).toFixed(4));
    earned += score;
    possible += maxScore;
    return { ...row, competency: row.competency ?? item.competency, score, maxScore };
  });
  const scorePercent = possible ? Number(((earned / possible) * 100).toFixed(2)) : 0;
  const provisional = {
    ...attempt,
    items,
    status: 'scored',
    submittedAt: now,
    scoredAt: now,
    scorePercent,
    passed: false,
    gradingAlgorithmVersion: COURSE_GRADER_ALGORITHM_VERSION
  };
  const results = deriveCourseAssessmentResults({ assessment, attempt: provisional, itemBank });
  provisional.passed = results.overallScorePassed && results.competencyMinimumsPassed;
  return { attempt: provisional, ...results };
}
