import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};
const manifestPath = getArg('--manifest', 'automation/curriculum-ingestion/manifests/COURSE-LH-TECH1-001.json');
const reportPath = getArg('--write-report');
const check = args.includes('--check');

function readJson(rel, fallback) {
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
    .map((name) => readJson(path.join(dir, name), null))
    .filter(Boolean);
}

function normalizeItems(value, candidateKeys = []) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of candidateKeys) if (Array.isArray(value[key])) return value[key];
  return [];
}

const manifest = readJson(manifestPath, null);
if (!manifest) {
  console.error(`Dependency manifest not found: ${manifestPath}`);
  process.exit(1);
}

const claims = jsonFiles('content/claims');
const references = jsonFiles('content/references');
const referenceById = new Map(references.map((ref) => [ref.id, ref]));
const assetRegistry = readJson('visuals/ASSET-REGISTRY.json', {assets: []});
const assets = normalizeItems(assetRegistry, ['assets']);
const datasetRegistry = readJson('registry/DATASETS.json', []);
const datasets = normalizeItems(datasetRegistry, ['datasets', 'items']);
const linkRegistry = readJson('registry/LINKS.json', []);
const links = normalizeItems(linkRegistry, ['links', 'items']);

const reviewedRefStatuses = new Set(['reviewed', 'reviewed-source']);
const approvedAssetStatuses = new Set(['produced', 'approved', 'deployed']);
const approvedDatasetStatuses = new Set(['reviewed', 'approved', 'verified', 'published']);

function intersects(ids = [], lessonIds) {
  return ids.some((id) => lessonIds.has(id));
}

const results = manifest.requirements.map((requirement) => {
  const lessonIds = new Set(requirement.lessonIds);
  const linkedClaims = claims.filter((claim) => intersects(claim.supportsLessons ?? [], lessonIds));
  const referenceIds = new Set(linkedClaims.flatMap((claim) => claim.references ?? []));
  const reviewedReferences = [...referenceIds]
    .map((id) => referenceById.get(id))
    .filter((ref) => ref && reviewedRefStatuses.has(ref.status));

  const approvedAssets = assets.filter((asset) =>
    approvedAssetStatuses.has(asset.status) && intersects(asset.primaryLessons ?? asset.lessonIds ?? [], lessonIds));

  const approvedDatasets = datasets.filter((dataset) =>
    approvedDatasetStatuses.has(dataset.status) && intersects(dataset.lessonIds ?? [], lessonIds));

  const verifiedLinks = links.filter((link) => {
    const linked = intersects(link.lessonIds ?? [], lessonIds);
    const verified = link.verified === true || link.httpStatus === 200 || link.status === 'verified';
    return linked && verified;
  });

  const actual = {
    reviewedReferences: reviewedReferences.length,
    approvedAssets: approvedAssets.length,
    datasets: approvedDatasets.length,
    verifiedLinks: verifiedLinks.length
  };
  const gaps = Object.fromEntries(Object.entries(requirement.needs)
    .map(([key, minimum]) => [key, Math.max(0, minimum - (actual[key] ?? 0))])
    .filter(([, gap]) => gap > 0));

  return {
    id: requirement.id,
    topic: requirement.topic,
    lessonIds: requirement.lessonIds,
    needs: requirement.needs,
    actual,
    gaps,
    complete: Object.keys(gaps).length === 0,
    collectionQueries: requirement.queries ?? [],
    preferredSources: requirement.preferredSources ?? []
  };
});

const totals = results.reduce((acc, result) => {
  for (const key of Object.keys(result.needs)) {
    acc.required[key] = (acc.required[key] ?? 0) + result.needs[key];
    acc.actual[key] = (acc.actual[key] ?? 0) + result.actual[key];
    acc.gaps[key] = (acc.gaps[key] ?? 0) + (result.gaps[key] ?? 0);
  }
  return acc;
}, {required: {}, actual: {}, gaps: {}});

const report = {
  generatedAt: new Date().toISOString(),
  courseId: manifest.courseId,
  manifestStatus: manifest.status,
  publicationGate: manifest.publicationGate === true,
  complete: results.every((result) => result.complete),
  totals,
  requirements: results
};

console.log(JSON.stringify(report, null, 2));

if (reportPath) {
  const full = path.join(root, reportPath);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  fs.writeFileSync(full, `${JSON.stringify(report, null, 2)}\n`);
}

if (check && manifest.publicationGate === true && !report.complete) process.exit(1);
