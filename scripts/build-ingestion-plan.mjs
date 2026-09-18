import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};

const manifestPath = getArg('--manifest', 'automation/curriculum-ingestion/manifests/COURSE-LH-TECH1-001.json');
const outputPath = getArg('--output', 'automation/curriculum-ingestion/reports/collection-plan.json');
const tempReport = path.join('automation', 'curriculum-ingestion', 'reports', '.dependency-plan-input.json');

function readJson(rel, fallback = null) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return fallback;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function jsonFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(dir, name)))
    .filter(Boolean);
}

function intersects(ids = [], lessonIds) {
  return ids.some((id) => lessonIds.has(id));
}

function collectReferenceIds(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectReferenceIds(item, out);
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'references' && Array.isArray(child)) {
      for (const id of child) if (typeof id === 'string') out.add(id);
    } else {
      collectReferenceIds(child, out);
    }
  }
  return out;
}

execFileSync(process.execPath, [
  'scripts/audit-curriculum-dependencies.mjs',
  `--manifest=${manifestPath}`,
  `--write-report=${tempReport}`
], {cwd: root, stdio: 'ignore'});

const report = readJson(tempReport);
const sourceCatalog = readJson('automation/curriculum-ingestion/source-catalog.json', {sources: []});
const sourceById = new Map((sourceCatalog.sources ?? []).map((source) => [source.id, source]));
const reviewedStatuses = new Set(['reviewed', 'reviewed-source']);
const references = new Map(jsonFiles('content/references').map((ref) => [ref.id, ref]));
const lessons = jsonFiles('content/lessons');
const claims = jsonFiles('content/claims');
const evidenceReviews = [
  ...jsonFiles('automation/curriculum-ingestion/reviews/pending'),
  ...jsonFiles('automation/curriculum-ingestion/reviews/approved')
];

function evidenceRoutingFor(requirement) {
  const lessonIds = new Set(requirement.lessonIds);
  const currentClaimRefs = new Set(
    claims
      .filter((claim) => intersects(claim.supportsLessons ?? [], lessonIds))
      .flatMap((claim) => claim.references ?? [])
      .filter((id) => reviewedStatuses.has(references.get(id)?.status))
  );

  const relevantReviews = evidenceReviews.filter((review) =>
    ['needs-scientific-review', 'approved'].includes(review.status) &&
    intersects(review.lessonIds ?? [], lessonIds)
  );
  const reviewRefs = new Set(
    relevantReviews
      .flatMap((review) => review.referenceIds ?? [])
      .filter((id) => reviewedStatuses.has(references.get(id)?.status))
      .filter((id) => !currentClaimRefs.has(id))
  );

  const directReviewed = new Set();
  for (const lesson of lessons) {
    if (!lessonIds.has(lesson.id)) continue;
    for (const id of collectReferenceIds(lesson)) {
      if (reviewedStatuses.has(references.get(id)?.status)) directReviewed.add(id);
    }
  }

  const recoverableRefs = [...directReviewed]
    .filter((id) => !currentClaimRefs.has(id))
    .filter((id) => !reviewRefs.has(id))
    .sort();

  return {
    currentClaimReferenceIds: [...currentClaimRefs].sort(),
    pendingOrApprovedReviewReferenceIds: [...reviewRefs].sort(),
    pendingOrApprovedReviewIds: relevantReviews.map((review) => review.id).sort(),
    recoverableDirectReferenceIds: recoverableRefs
  };
}

const tasks = [];
const evidenceRouting = {};
for (const requirement of report.requirements) {
  const query = requirement.collectionQueries?.[0] || requirement.topic;
  const base = {
    requirementId: requirement.id,
    lessonIds: requirement.lessonIds,
    topic: requirement.topic,
    query
  };

  if ((requirement.gaps.reviewedReferences ?? 0) > 0) {
    const routing = evidenceRoutingFor(requirement);
    evidenceRouting[requirement.id] = routing;
    let remaining = requirement.gaps.reviewedReferences;

    const reviewCapacity = Math.min(remaining, routing.pendingOrApprovedReviewReferenceIds.length);
    if (reviewCapacity > 0) {
      tasks.push({
        ...base,
        type: 'human-evidence-review',
        gap: reviewCapacity,
        referenceIds: routing.pendingOrApprovedReviewReferenceIds.slice(0, reviewCapacity),
        reviewIds: routing.pendingOrApprovedReviewIds,
        priority: 1,
        command: 'node scripts/build-evidence-review-packets.mjs --output=automation/curriculum-ingestion/reports/evidence-review-packets',
        note: 'These reviewed sources already have evidence-mapping review records. Human review/promotion should occur before collecting replacement research.'
      });
      remaining -= reviewCapacity;
    }

    const recoveryCapacity = Math.min(remaining, routing.recoverableDirectReferenceIds.length);
    if (recoveryCapacity > 0) {
      tasks.push({
        ...base,
        type: 'evidence-mapping-recovery',
        gap: recoveryCapacity,
        referenceIds: routing.recoverableDirectReferenceIds.slice(0, recoveryCapacity),
        priority: 2,
        command: 'node scripts/build-evidence-mapping-inbox.mjs --output=automation/curriculum-ingestion/inbox/evidence-mapping-candidates.json',
        note: 'These reviewed sources are already cited in the affected lessons but are not yet claim-backed. Review citation context and create supportable atomic mappings before external collection.'
      });
      remaining -= recoveryCapacity;
    }

    if (remaining > 0) {
      tasks.push({
        ...base,
        type: 'research',
        gap: remaining,
        collectors: ['pubmed', 'crossref'],
        priority: 3,
        command: `node scripts/collect-research-metadata.mjs --query=${JSON.stringify(query)} --lesson=${requirement.lessonIds[0]} --limit=8`,
        note: 'External research is only requested for the residual that cannot be satisfied by current claim-backed, review-ready, or directly cited reviewed evidence.'
      });
    }
  }

  if ((requirement.gaps.datasets ?? 0) > 0) {
    tasks.push({
      ...base,
      type: 'dataset',
      gap: requirement.gaps.datasets,
      collectors: ['datagov'],
      priority: 3,
      command: `node scripts/collect-government-datasets.mjs --query=${JSON.stringify(query)} --lesson=${requirement.lessonIds[0]} --limit=8`
    });
  }

  if ((requirement.gaps.approvedAssets ?? 0) > 0) {
    tasks.push({
      ...base,
      type: 'asset',
      gap: requirement.gaps.approvedAssets,
      collectors: ['internal', 'wikimedia'],
      priority: 2,
      sequence: ['search-internal-approved-assets', 'collect-external-reference-candidates'],
      command: `node scripts/collect-wikimedia-media.mjs --query=${JSON.stringify(query)} --lesson=${requirement.lessonIds[0]} --limit=8`
    });
  }

  if ((requirement.gaps.verifiedLinks ?? 0) > 0) {
    const preferred = (requirement.preferredSources ?? []).map((id) => ({
      id,
      automation: sourceById.get(id)?.automation || 'unknown'
    }));
    tasks.push({
      ...base,
      type: 'authoritative-link',
      gap: requirement.gaps.verifiedLinks,
      priority: 2,
      preferredSources: preferred,
      mode: preferred.some((source) => source.automation === 'discovery-provider-required')
        ? 'mixed-automatic-and-discovery'
        : 'automatic-or-curated-authority'
    });
  }
}

const plan = {
  generatedAt: new Date().toISOString(),
  courseId: report.courseId,
  dependencyComplete: report.complete,
  totals: report.totals,
  taskCount: tasks.length,
  tasks: tasks.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99) || a.requirementId.localeCompare(b.requirementId)),
  evidenceRouting,
  policy: {
    externalResultsAreCandidatesOnly: true,
    autoPromotionToTrustedRegistries: false,
    requireProvenance: true,
    requireMediaLicenseReview: true,
    prioritizeExistingReviewedEvidence: true,
    humanReviewBeforeExternalReplacementResearch: true
  }
};

const full = path.join(root, outputPath);
fs.mkdirSync(path.dirname(full), {recursive: true});
fs.writeFileSync(full, `${JSON.stringify(plan, null, 2)}\n`);
if (fs.existsSync(path.join(root, tempReport))) fs.unlinkSync(path.join(root, tempReport));
console.log(JSON.stringify(plan, null, 2));
