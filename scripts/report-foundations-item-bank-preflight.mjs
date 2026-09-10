import fs from 'node:fs';
import path from 'node:path';
import { foundationsItemReviewFlags } from './lib/foundations-item-review-preflight.mjs';

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

function exactAssessmentReviews(item, reviews) {
  return reviews.filter((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment'
  );
}

function normalizeStem(stem) {
  return String(stem ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

const registry = readJson('registry/cultivation-foundations.json');
const assessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const references = new Set(readDirJson('content/references').map((reference) => reference.id));
const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

const eligible = questions.filter((item) =>
  releaseCompetencies.has(item.competency) &&
  ['summative', 'credential'].includes(item.purpose) &&
  !['flagged', 'retired'].includes(item.status)
);

const stemGroups = new Map();
for (const item of eligible) {
  const normalized = normalizeStem(item.stem);
  if (!normalized) continue;
  const ids = stemGroups.get(normalized) ?? [];
  ids.push(item.id);
  stemGroups.set(normalized, ids);
}

const rows = eligible.map((item) => {
  const flags = foundationsItemReviewFlags(item);
  for (const referenceId of item.references ?? []) {
    if (!references.has(referenceId)) {
      flags.push({ code: 'unresolved-reference', severity: 'high', detail: referenceId });
    }
  }

  const duplicateStemIds = stemGroups.get(normalizeStem(item.stem)) ?? [];
  if (duplicateStemIds.length > 1) {
    flags.push({
      code: 'duplicate-stem',
      severity: 'high',
      detail: duplicateStemIds.filter((id) => id !== item.id).join(', ')
    });
  }

  const assessmentReviews = exactAssessmentReviews(item, reviews);
  const high = flags.filter((flag) => flag.severity === 'high').length;
  const medium = flags.filter((flag) => flag.severity === 'medium').length;

  return {
    id: item.id,
    version: item.version,
    status: item.status,
    purpose: item.purpose,
    competency: item.competency,
    objective: item.objective,
    bloomLevel: item.bloomLevel,
    difficulty: item.difficulty,
    type: item.type,
    correct: item.correct,
    assessmentReviewCount: assessmentReviews.length,
    highSeverityFlags: high,
    mediumSeverityFlags: medium,
    flags
  };
}).sort((a, b) =>
  (b.highSeverityFlags - a.highSeverityFlags) ||
  (b.mediumSeverityFlags - a.mediumSeverityFlags) ||
  a.competency.localeCompare(b.competency) ||
  a.id.localeCompare(b.id)
);

const codeCounts = new Map();
for (const row of rows) {
  for (const flag of row.flags) {
    codeCounts.set(flag.code, (codeCounts.get(flag.code) ?? 0) + 1);
  }
}

const competencyRows = assessment.blueprint.map((bp) => {
  const items = rows.filter((row) => row.competency === bp.competency);
  return {
    competency: bp.competency,
    formItemsRequired: bp.items,
    eligibleBankItems: items.length,
    targetBankItems: assessment.itemSelection.targetBankItemsPerCompetency,
    itemsWithHighSeverityFlags: items.filter((row) => row.highSeverityFlags > 0).length,
    itemsWithMediumSeverityFlags: items.filter((row) => row.mediumSeverityFlags > 0).length,
    itemsWithoutFlags: items.filter((row) => row.flags.length === 0).length,
    reviewedItems: items.filter((row) => row.assessmentReviewCount > 0).length,
    unreviewedItems: items.filter((row) => row.assessmentReviewCount === 0).length,
    answerKeyPositions: Object.fromEntries(
      [0, 1, 2, 3].map((position) => [position, items.filter((row) => row.correct === position).length])
    )
  };
});

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  assessment: assessment.id,
  eligibleBankItems: rows.length,
  targetBankItemsPerCompetency: assessment.itemSelection.targetBankItemsPerCompetency,
  competenciesBelowTarget: competencyRows.filter((row) => row.eligibleBankItems < row.targetBankItems).length,
  itemsWithHighSeverityFlags: rows.filter((row) => row.highSeverityFlags > 0).length,
  itemsWithMediumSeverityFlags: rows.filter((row) => row.mediumSeverityFlags > 0).length,
  itemsWithoutFlags: rows.filter((row) => row.flags.length === 0).length,
  reviewedItems: rows.filter((row) => row.assessmentReviewCount > 0).length,
  unreviewedItems: rows.filter((row) => row.assessmentReviewCount === 0).length,
  flagCounts: Object.fromEntries([...codeCounts.entries()].sort()),
  note: 'Automated full-bank preflight only. It does not create, replace, or imply human assessment approval.'
};

console.log(JSON.stringify({ summary, competencies: competencyRows, items: rows }, null, 2));
