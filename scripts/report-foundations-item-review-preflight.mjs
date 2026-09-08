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

const registry = readJson('registry/cultivation-foundations.json');
const assessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const references = new Set(readDirJson('content/references').map((reference) => reference.id));
const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

const pending = questions.filter((item) =>
  releaseCompetencies.has(item.competency) &&
  ['summative', 'credential'].includes(item.purpose) &&
  !['flagged', 'retired'].includes(item.status) &&
  exactAssessmentReviews(item, reviews).length === 0
);

const rows = pending.map((item) => {
  const flags = foundationsItemReviewFlags(item);
  for (const referenceId of item.references ?? []) {
    if (!references.has(referenceId)) flags.push({ code: 'unresolved-reference', severity: 'high', detail: referenceId });
  }
  const high = flags.filter((flag) => flag.severity === 'high').length;
  const medium = flags.filter((flag) => flag.severity === 'medium').length;
  return {
    id: item.id,
    version: item.version,
    competency: item.competency,
    objective: item.objective,
    type: item.type,
    difficulty: item.difficulty,
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
  for (const flag of row.flags) codeCounts.set(flag.code, (codeCounts.get(flag.code) ?? 0) + 1);
}

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  assessment: assessment.id,
  pendingItems: rows.length,
  itemsWithHighSeverityFlags: rows.filter((row) => row.highSeverityFlags > 0).length,
  itemsWithMediumSeverityFlags: rows.filter((row) => row.mediumSeverityFlags > 0).length,
  itemsWithoutFlags: rows.filter((row) => row.flags.length === 0).length,
  flagCounts: Object.fromEntries([...codeCounts.entries()].sort()),
  note: 'This is automated preflight only. It does not create, replace, or imply human assessment approval.'
};

console.log(JSON.stringify({ summary, items: rows }, null, 2));
