import fs from 'node:fs';
import path from 'node:path';

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

function distribution(items) {
  const counts = [0, 0, 0, 0];
  for (const item of items) {
    if (Number.isInteger(item.correct) && item.correct >= 0 && item.correct < counts.length) counts[item.correct] += 1;
  }
  return counts;
}

function dominantShare(counts) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return total === 0 ? 0 : Math.max(...counts) / total;
}

function exactAssessmentReviews(item, reviews) {
  return reviews.filter((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment'
  );
}

const registry = readJson('registry/cultivation-foundations.json');
const finalAssessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

if (finalAssessment.randomizeChoices !== true) {
  throw new Error(`${finalAssessment.id} must keep randomizeChoices=true while canonical answer positions are not guaranteed to be balanced.`);
}

const eligible = questions.filter((item) =>
  releaseCompetencies.has(item.competency) &&
  ['summative', 'credential'].includes(item.purpose) &&
  !['flagged', 'retired'].includes(item.status)
);
const approvedReviewed = eligible.filter((item) =>
  exactAssessmentReviews(item, reviews).some((review) => review.status === 'approved')
);
const unreviewed = eligible.filter((item) => exactAssessmentReviews(item, reviews).length === 0);
const nonApprovedReviewed = eligible.filter((item) => {
  const itemReviews = exactAssessmentReviews(item, reviews);
  return itemReviews.length > 0 && !itemReviews.some((review) => review.status === 'approved');
});

const allDistribution = distribution(eligible);
const approvedDistribution = distribution(approvedReviewed);
const unreviewedDistribution = distribution(unreviewed);

const byCompetency = Object.fromEntries([...releaseCompetencies].sort().map((competency) => {
  const items = eligible.filter((item) => item.competency === competency);
  const reviewed = approvedReviewed.filter((item) => item.competency === competency);
  const pending = unreviewed.filter((item) => item.competency === competency);
  return [competency, {
    eligibleItems: items.length,
    approvedReviewedItems: reviewed.length,
    unreviewedItems: pending.length,
    canonicalDistribution: distribution(items),
    approvedCanonicalDistribution: distribution(reviewed),
    unreviewedCanonicalDistribution: distribution(pending)
  }];
}));

const report = {
  course: registry.course,
  releaseVersion: registry.version,
  finalAssessment: registry.summativeAssessment,
  totals: {
    eligibleItems: eligible.length,
    approvedReviewedItems: approvedReviewed.length,
    unreviewedItems: unreviewed.length,
    nonApprovedReviewedItems: nonApprovedReviewed.length
  },
  canonicalAnswerPositions: {
    allEligible: allDistribution,
    approvedReviewed: approvedDistribution,
    unreviewed: unreviewedDistribution,
    dominantShareAllEligible: dominantShare(allDistribution),
    dominantShareApprovedReviewed: dominantShare(approvedDistribution),
    dominantShareUnreviewed: dominantShare(unreviewedDistribution)
  },
  deliveryMitigation: {
    randomizeChoicesRequired: true,
    randomizeChoicesConfigured: finalAssessment.randomizeChoices === true,
    stableShuffleAndCanonicalScoringTest: 'scripts/test-assessment-delivery-service.mjs',
    rationale: 'Canonical answer indexes may be skewed in stored reviewed content, but learner-visible choice order is randomized per attempt and translated back to canonical indexes before scoring. Stored reviewed items are not rewritten solely to cosmetically balance canonical positions.'
  },
  byCompetency
};

console.log(JSON.stringify(report, null, 2));
