import fs from 'node:fs';
import path from 'node:path';
import { activationEvidenceEvaluation, loadPilotEvidencePolicy } from './pilot-evidence-quality.mjs';

const root = process.cwd();
const batchSizeArg = process.argv.find((arg) => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? Number(batchSizeArg.split('=')[1]) : 12;
if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
  throw new Error('--batch-size must be an integer between 1 and 100');
}

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

const registry = readJson('registry/cultivation-foundations.json');
const finalAssessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const references = new Set(readDirJson('content/references').map((ref) => ref.id));
const pilotRecords = readDirJson('content/pilot-evidence');
const pilotPolicy = loadPilotEvidencePolicy(root);

const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));
const minimumActive = finalAssessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0;
const targetBank = finalAssessment.itemSelection?.targetBankItemsPerCompetency ?? minimumActive;

function hasApprovedAssessmentReview(item) {
  return reviews.some((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment' &&
    review.status === 'approved'
  );
}

function unresolvedReferences(item) {
  return (item.references ?? []).filter((id) => !references.has(id));
}

function qualifiedPilotEvidence(item) {
  const record = pilotRecords.find((candidate) =>
    candidate.itemId === item.id &&
    String(candidate.itemVersion) === String(item.version)
  );
  if (!record) return null;
  const evaluation = activationEvidenceEvaluation(record, item, pilotPolicy);
  return evaluation.ready ? record : null;
}

const rows = (finalAssessment.blueprint ?? []).map((bp) => {
  const eligible = questions.filter((item) =>
    item.competency === bp.competency &&
    releaseCompetencies.has(item.competency) &&
    ['summative', 'credential'].includes(item.purpose) &&
    !['flagged', 'retired'].includes(item.status)
  );
  const active = eligible.filter((item) => item.status === 'active');
  const reviewedNotActive = eligible.filter((item) => item.status !== 'active' && hasApprovedAssessmentReview(item));
  const pendingReview = eligible.filter((item) => item.status !== 'active' && !hasApprovedAssessmentReview(item));
  const reviewedReferenceClean = reviewedNotActive.filter((item) => unresolvedReferences(item).length === 0);
  const pilotQualifiedPromotable = reviewedReferenceClean.filter((item) => qualifiedPilotEvidence(item));

  return {
    competency: bp.competency,
    formItemsRequired: bp.items,
    minimumActiveRequired: minimumActive,
    targetBankItems: targetBank,
    totalEligibleBank: eligible.length,
    activeItems: active.length,
    activeDeficit: Math.max(0, minimumActive - active.length),
    bankDeficit: Math.max(0, targetBank - eligible.length),
    reviewedNotActive: reviewedNotActive.length,
    reviewedReferenceCleanItems: reviewedReferenceClean.map((item) => item.id),
    pilotQualifiedPromotableItems: pilotQualifiedPromotable.map((item) => item.id),
    pendingReviewItems: pendingReview.map((item) => ({
      id: item.id,
      version: item.version,
      objective: item.objective,
      difficulty: item.difficulty,
      type: item.type,
      status: item.status,
      unresolvedReferences: unresolvedReferences(item)
    }))
  };
});

const prioritized = [...rows].sort((a, b) =>
  (b.activeDeficit - a.activeDeficit) ||
  (b.bankDeficit - a.bankDeficit) ||
  (a.activeItems - b.activeItems) ||
  a.competency.localeCompare(b.competency)
);

const batch = [];
let round = 0;
while (batch.length < batchSize) {
  let added = false;
  for (const row of prioritized) {
    const item = row.pendingReviewItems[round];
    if (!item) continue;
    batch.push({
      priority: batch.length + 1,
      competency: row.competency,
      activeDeficit: row.activeDeficit,
      bankDeficit: row.bankDeficit,
      ...item
    });
    added = true;
    if (batch.length >= batchSize) break;
  }
  if (!added) break;
  round += 1;
}

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  finalAssessment: registry.summativeAssessment,
  competencies: rows.length,
  minimumActiveItemsPerCompetency: minimumActive,
  targetBankItemsPerCompetency: targetBank,
  totalActiveItems: rows.reduce((sum, row) => sum + row.activeItems, 0),
  totalActiveDeficit: rows.reduce((sum, row) => sum + row.activeDeficit, 0),
  totalBankDeficit: rows.reduce((sum, row) => sum + row.bankDeficit, 0),
  pendingReviewItems: rows.reduce((sum, row) => sum + row.pendingReviewItems.length, 0),
  reviewedNotActiveItems: rows.reduce((sum, row) => sum + row.reviewedNotActive, 0),
  reviewedReferenceCleanItems: rows.reduce((sum, row) => sum + row.reviewedReferenceCleanItems.length, 0),
  pilotQualifiedPromotableItems: rows.reduce((sum, row) => sum + row.pilotQualifiedPromotableItems.length, 0),
  requestedBatchSize: batchSize,
  batchItems: batch.length
};

console.log(JSON.stringify({ summary, competencies: prioritized, batch }, null, 2));
