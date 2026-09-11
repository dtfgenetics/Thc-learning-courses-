import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

const assessments = readDirJson('content/assessments');
const questions = readDirJson('content/questions');
const references = new Set(readDirJson('content/references').map((item) => item.id));
const objectives = new Set(readDirJson('content/learning-objectives').map((item) => item.id));
const competencies = new Set(readDirJson('content/competencies').map((item) => item.id));
const courses = new Set(readDirJson('content/courses').map((item) => item.id));

// These are quality-floor baselines, never content ceilings. Course banks may grow
// beyond them whenever additional valid instruction or assessment coverage is useful.
const minimumBaselines = new Map([
  ['TECH1-001', { assessments: 7, formative: 72, summative: 36, total: 108 }]
]);

const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const courseKeyFromAssessment = (id) => {
  const match = /^ASSESS-LH-(.+?-\d{3})-(?:M\d{2}|FINAL)$/.exec(id);
  return match?.[1] ?? null;
};
const courseKeyFromQuestion = (id) => {
  const match = /^ITEM-LH-(.+?-\d{3})-(?:M\d{2}-\d{3}|\d{3})$/.exec(id);
  return match?.[1] ?? null;
};

const groups = new Map();
for (const assessment of assessments) {
  const key = courseKeyFromAssessment(assessment.id);
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, { assessments: [], questions: [] });
  groups.get(key).assessments.push(assessment);
}
for (const question of questions) {
  const key = courseKeyFromQuestion(question.id);
  if (!key) continue;
  if (!groups.has(key)) groups.set(key, { assessments: [], questions: [] });
  groups.get(key).questions.push(question);
}

if (groups.size === 0) {
  console.log('No Learning Hub assessment banks found; item-quality gate skipped.');
  process.exit(0);
}

const failures = [];
const warnings = [];
const summaries = [];

for (const [key, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const label = `COURSE-LH-${key}`;
  const itemMap = new Map(group.questions.map((item) => [item.id, item]));
  const membership = new Map();
  const normalizedStems = new Map();
  const objectiveCounts = new Map();
  const sourceKeyPositions = new Map();

  if (!courses.has(label)) failures.push(`${label}: matching course object is missing`);
  if (group.assessments.length === 0) failures.push(`${label}: no Learning Hub assessment objects found`);
  if (group.questions.length === 0) failures.push(`${label}: no Learning Hub question objects found`);

  for (const assessment of group.assessments) {
    const itemIds = assessment.items ?? [];
    if (new Set(itemIds).size !== itemIds.length) failures.push(`${assessment.id}: duplicate item IDs in assessment`);
    if (assessment.totalItems != null && assessment.totalItems !== itemIds.length) {
      failures.push(`${assessment.id}: totalItems=${assessment.totalItems} but ${itemIds.length} item IDs are listed`);
    }
    for (const itemId of itemIds) {
      if (!itemMap.has(itemId)) failures.push(`${assessment.id}: referenced item ${itemId} is missing from the course bank`);
      if (!membership.has(itemId)) membership.set(itemId, []);
      membership.get(itemId).push(assessment.id);
    }
  }

  for (const item of group.questions) {
    const owners = membership.get(item.id) ?? [];
    if (owners.length === 0) failures.push(`${item.id}: orphaned item is not listed in a Learning Hub assessment`);
    if (owners.length > 1) failures.push(`${item.id}: item appears in multiple course assessments (${owners.join(', ')})`);

    if (!competencies.has(item.competency)) failures.push(`${item.id}: missing competency ${item.competency}`);
    if (!objectives.has(item.objective)) failures.push(`${item.id}: missing objective ${item.objective}`);
    if (!String(item.objective).startsWith(`LO-LH-${key}-`)) failures.push(`${item.id}: objective ${item.objective} is outside ${label}`);
    objectiveCounts.set(item.objective, (objectiveCounts.get(item.objective) ?? 0) + 1);

    if (!Array.isArray(item.references) || item.references.length === 0) failures.push(`${item.id}: no controlled references`);
    for (const reference of item.references ?? []) {
      if (!references.has(reference)) failures.push(`${item.id}: missing reference ${reference}`);
    }

    if (String(item.stem ?? '').trim().length < 25) failures.push(`${item.id}: stem is too short for a defensible applied item`);
    if (String(item.rationale ?? '').trim().length < 30) failures.push(`${item.id}: rationale is too thin for learner/reviewer feedback`);

    const stemKey = normalize(item.stem);
    if (normalizedStems.has(stemKey)) failures.push(`${item.id}: duplicate normalized stem with ${normalizedStems.get(stemKey)}`);
    else normalizedStems.set(stemKey, item.id);

    if (Array.isArray(item.choices)) {
      const normalizedChoices = item.choices.map(normalize);
      if (new Set(normalizedChoices).size !== normalizedChoices.length) failures.push(`${item.id}: duplicate answer choices after normalization`);
      if (['multiple-choice', 'scenario', 'case-study'].includes(item.type)) {
        if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct >= item.choices.length) {
          failures.push(`${item.id}: keyed answer index is outside the choice array`);
        } else {
          sourceKeyPositions.set(item.correct, (sourceKeyPositions.get(item.correct) ?? 0) + 1);
        }
      }
      if (item.choices.length < 3 && ['multiple-choice', 'scenario', 'case-study'].includes(item.type)) {
        failures.push(`${item.id}: fewer than three choices for a single-best-answer item`);
      }
      for (const choice of item.choices) {
        if (/\b(all|none) of the above\b/i.test(choice)) warnings.push(`${item.id}: review '${choice}' for cueing/testwiseness`);
      }
    }

    if (/\b(always|never|obviously|clearly)\b/i.test(item.stem)) warnings.push(`${item.id}: stem contains an absolute/cueing term worth human review`);
  }

  for (const [objective, count] of objectiveCounts) {
    if (count < 3) warnings.push(`${label}: objective ${objective} has only ${count} bank items`);
  }

  const formatCount = (purpose) => group.questions.filter((item) => item.purpose === purpose).length;
  const baseline = minimumBaselines.get(key);
  if (baseline) {
    const actual = {
      assessments: group.assessments.length,
      formative: formatCount('formative'),
      summative: formatCount('summative'),
      total: group.questions.length
    };
    for (const [metric, minimumValue] of Object.entries(baseline)) {
      if (actual[metric] < minimumValue) failures.push(`${label}: minimum baseline is ${minimumValue} ${metric}, found ${actual[metric]}`);
    }
  }

  const keyDistribution = [...sourceKeyPositions.entries()].sort(([a], [b]) => a - b).map(([index, count]) => `${index}:${count}`).join(', ');
  summaries.push(`${label}: assessments=${group.assessments.length}, items=${group.questions.length}, objectives=${objectiveCounts.size}, source-key-positions={${keyDistribution}}`);
}

for (const summary of summaries) console.log(summary);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (failures.length) {
  console.error(`Learning Hub item-quality gate failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Learning Hub item-quality gate passed for ${groups.size} course bank(s); ${warnings.length} human-review warning(s) recorded.`);
