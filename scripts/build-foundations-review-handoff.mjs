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
  const highSeverity = flags.filter((flag) => flag.severity === 'high');
  const mediumSeverity = flags.filter((flag) => flag.severity === 'medium');
  return {
    id: item.id,
    version: item.version,
    competency: item.competency,
    objective: item.objective,
    difficulty: item.difficulty,
    type: item.type,
    status: item.status,
    highSeverityFlags: highSeverity,
    mediumSeverityWarnings: mediumSeverity,
    reviewReady: highSeverity.length === 0
  };
});

const competencyOrder = new Map((assessment.blueprint ?? []).map((row, index) => [row.competency, index]));
const sortRows = (a, b) =>
  ((competencyOrder.get(a.competency) ?? 999) - (competencyOrder.get(b.competency) ?? 999)) ||
  String(a.objective ?? '').localeCompare(String(b.objective ?? '')) ||
  a.id.localeCompare(b.id);

const reviewReady = rows.filter((row) => row.reviewReady).sort(sortRows);
const contentQaBlocked = rows.filter((row) => !row.reviewReady).sort((a, b) =>
  (b.highSeverityFlags.length - a.highSeverityFlags.length) || sortRows(a, b)
);

const byCompetency = Object.fromEntries((assessment.blueprint ?? []).map((bp) => {
  const scoped = rows.filter((row) => row.competency === bp.competency);
  return [bp.competency, {
    pending: scoped.length,
    reviewReady: scoped.filter((row) => row.reviewReady).length,
    contentQaBlocked: scoped.filter((row) => !row.reviewReady).length
  }];
}));

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  assessment: assessment.id,
  pendingItems: rows.length,
  reviewReadyItems: reviewReady.length,
  contentQaBlockedItems: contentQaBlocked.length,
  allPendingItemsReviewReady: contentQaBlocked.length === 0,
  approvalGuard: 'Assessment approvals are blocked when high-severity automated preflight defects remain.',
  humanBoundary: 'Review-ready means automated preflight passed. It does not imply or replace human assessment approval.'
};

console.log(JSON.stringify({ summary, byCompetency, reviewReady, contentQaBlocked }, null, 2));
