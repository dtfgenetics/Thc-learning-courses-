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

function exactApprovedAssessmentReview(item, reviews) {
  return reviews.some((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment' &&
    review.status === 'approved'
  );
}

function nextVersion(version) {
  if (typeof version === 'number' && Number.isFinite(version)) return version + 1;
  const raw = String(version ?? '').trim();
  if (/^\d+$/.test(raw)) return String(Number(raw) + 1);
  if (/^\d+(?:\.\d+)+$/.test(raw)) {
    const parts = raw.split('.').map(Number);
    parts[parts.length - 1] += 1;
    return parts.join('.');
  }
  return `NEXT-AFTER-${raw || 'UNKNOWN'}`;
}

const registry = readJson('registry/cultivation-foundations.json');
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const references = new Set(readDirJson('content/references').map((reference) => reference.id));
const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

const rows = questions
  .filter((item) =>
    releaseCompetencies.has(item.competency) &&
    ['summative', 'credential'].includes(item.purpose) &&
    !['flagged', 'retired'].includes(item.status) &&
    exactApprovedAssessmentReview(item, reviews)
  )
  .map((item) => {
    const flags = foundationsItemReviewFlags(item);
    for (const referenceId of item.references ?? []) {
      if (!references.has(referenceId)) {
        flags.push({ code: 'unresolved-reference', severity: 'high', detail: referenceId });
      }
    }
    return {
      id: item.id,
      currentVersion: item.version,
      suggestedNextVersion: nextVersion(item.version),
      status: item.status,
      competency: item.competency,
      objective: item.objective,
      highSeverityFlags: flags.filter((flag) => flag.severity === 'high').length,
      mediumSeverityFlags: flags.filter((flag) => flag.severity === 'medium').length,
      flags,
      remediationRule: 'If substantive item content changes, advance version and obtain a new human assessment review for the revised version.'
    };
  })
  .filter((row) => row.flags.length > 0)
  .sort((a, b) =>
    (b.highSeverityFlags - a.highSeverityFlags) ||
    (b.mediumSeverityFlags - a.mediumSeverityFlags) ||
    a.competency.localeCompare(b.competency) ||
    a.id.localeCompare(b.id)
  );

const byCompetency = [...releaseCompetencies]
  .sort()
  .map((competency) => {
    const items = rows.filter((row) => row.competency === competency);
    return {
      competency,
      flaggedReviewedItems: items.length,
      highSeverityItems: items.filter((row) => row.highSeverityFlags > 0).length,
      mediumSeverityItems: items.filter((row) => row.mediumSeverityFlags > 0).length
    };
  });

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  reviewedItemsNeedingRemediation: rows.length,
  highSeverityItems: rows.filter((row) => row.highSeverityFlags > 0).length,
  mediumSeverityItems: rows.filter((row) => row.mediumSeverityFlags > 0).length,
  note: 'Planning artifact only. It does not modify assessment items or create, revoke, replace, or imply human review.'
};

console.log(JSON.stringify({ summary, byCompetency, items: rows }, null, 2));
