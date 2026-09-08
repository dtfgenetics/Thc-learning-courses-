import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const write = process.argv.includes('--write');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ path: path.join(rel, name), value: readJson(path.join(rel, name)) }));
}

function distribution(items) {
  const counts = [0, 0, 0, 0];
  for (const item of items) {
    if (Number.isInteger(item.correct) && item.correct >= 0 && item.correct < counts.length) counts[item.correct] += 1;
  }
  return counts;
}

function exactAssessmentReviews(item, reviews) {
  return reviews.filter((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment'
  );
}

function reorderForTarget(item, target) {
  if (!Array.isArray(item.choices) || item.choices.length !== 4) {
    throw new Error(`${item.id} must have exactly four choices before answer-position rebalancing`);
  }
  if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct >= item.choices.length) {
    throw new Error(`${item.id} has an invalid keyed answer index`);
  }
  const keyed = item.choices[item.correct];
  const distractors = item.choices.filter((_, index) => index !== item.correct);
  const choices = new Array(4);
  choices[target] = keyed;
  let distractorIndex = 0;
  for (let index = 0; index < choices.length; index += 1) {
    if (index === target) continue;
    choices[index] = distractors[distractorIndex];
    distractorIndex += 1;
  }
  return { ...item, choices, correct: target };
}

const registry = readJson('registry/cultivation-foundations.json');
const finalAssessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questionEntries = readDirJson('content/questions');
const reviews = readDirJson('content/reviews').map((entry) => entry.value);
const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

const eligibleEntries = questionEntries.filter(({ value: item }) =>
  releaseCompetencies.has(item.competency) &&
  ['summative', 'credential'].includes(item.purpose) &&
  !['flagged', 'retired'].includes(item.status)
);
const reviewedEntries = eligibleEntries.filter(({ value: item }) =>
  exactAssessmentReviews(item, reviews).some((review) => review.status === 'approved')
);
const unreviewedEntries = eligibleEntries.filter(({ value: item }) => exactAssessmentReviews(item, reviews).length === 0);
const nonApprovedReviewed = eligibleEntries.filter(({ value: item }) => {
  const itemReviews = exactAssessmentReviews(item, reviews);
  return itemReviews.length > 0 && !itemReviews.some((review) => review.status === 'approved');
});

const changes = [];
const groups = new Map();
for (const entry of unreviewedEntries) {
  const key = entry.value.competency;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(entry);
}
for (const [competency, entries] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  entries.sort((a, b) =>
    String(a.value.objective ?? '').localeCompare(String(b.value.objective ?? '')) ||
    a.value.id.localeCompare(b.value.id)
  );
  entries.forEach((entry, index) => {
    const target = index % 4;
    const updated = reorderForTarget(entry.value, target);
    if (updated.correct !== entry.value.correct || updated.choices.some((choice, choiceIndex) => choice !== entry.value.choices[choiceIndex])) {
      changes.push({ path: entry.path, competency, itemId: entry.value.id, from: entry.value.correct, to: target, value: updated });
    }
  });
}

if (write) {
  if (nonApprovedReviewed.length > 0) {
    throw new Error(`Refusing bulk rebalancing while ${nonApprovedReviewed.length} exact-version items have non-approved human assessment review history; resolve or version those items separately.`);
  }
  for (const change of changes) {
    fs.writeFileSync(path.join(root, change.path), `${JSON.stringify(change.value)}\n`);
  }
}

const projectedUnreviewed = new Map(unreviewedEntries.map((entry) => [entry.value.id, entry.value]));
for (const change of changes) projectedUnreviewed.set(change.itemId, change.value);

const report = {
  course: registry.course,
  releaseVersion: registry.version,
  finalAssessment: registry.summativeAssessment,
  write,
  totals: {
    eligibleItems: eligibleEntries.length,
    approvedReviewedItems: reviewedEntries.length,
    unreviewedItems: unreviewedEntries.length,
    nonApprovedReviewedItems: nonApprovedReviewed.length,
    plannedChanges: changes.length
  },
  distributions: {
    allEligibleCurrent: distribution(eligibleEntries.map((entry) => entry.value)),
    approvedReviewedCurrent: distribution(reviewedEntries.map((entry) => entry.value)),
    unreviewedCurrent: distribution(unreviewedEntries.map((entry) => entry.value)),
    unreviewedProjected: distribution([...projectedUnreviewed.values()])
  },
  byCompetency: Object.fromEntries([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([competency, entries]) => {
    const projected = entries.map((entry) => projectedUnreviewed.get(entry.value.id));
    return [competency, {
      items: entries.length,
      current: distribution(entries.map((entry) => entry.value)),
      projected: distribution(projected)
    }];
  })),
  changes: changes.map(({ itemId, competency, from, to }) => ({ itemId, competency, from, to }))
};

console.log(JSON.stringify(report, null, 2));
