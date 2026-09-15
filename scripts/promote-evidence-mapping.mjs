import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};
const reviewArg = getArg('--review');
const write = args.includes('--write');

if (!reviewArg) {
  console.error('Usage: node scripts/promote-evidence-mapping.mjs --review=path/to/review.json [--write]');
  process.exit(2);
}

function readJson(relOrAbs) {
  const full = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(root, relOrAbs);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}
function jsonMap(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return new Map();
  return new Map(fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const data = JSON.parse(fs.readFileSync(path.join(full, name), 'utf8'));
      return [data.id, data];
    }));
}
function collectReferences(value, out = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, out));
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'references' && Array.isArray(child)) {
      child.forEach((id) => typeof id === 'string' && out.add(id));
    } else collectReferences(child, out);
  }
  return out;
}
function union(a = [], b = []) {
  return [...new Set([...a, ...b])].sort();
}

const reviewPath = path.resolve(root, reviewArg);
const review = readJson(reviewPath);
const reviewSchema = readJson('schemas/evidence-mapping-review.schema.json');
const claimSchema = readJson('schemas/claim.schema.json');
const ajv = new Ajv2020({allErrors: true, strict: false});
addFormats(ajv);
const validateReview = ajv.compile(reviewSchema);
const validateClaim = ajv.compile(claimSchema);
const failures = [];

if (!validateReview(review)) {
  for (const issue of validateReview.errors ?? []) failures.push(`review${issue.instancePath || '/'}: ${issue.message}`);
}
if (review.status !== 'approved') failures.push('review must have status=approved before promotion');
if (!review.review?.approvedAt) failures.push('approved review must include review.approvedAt');

const references = jsonMap('content/references');
const lessons = jsonMap('content/lessons');
const competencies = jsonMap('content/competencies');
const objectives = jsonMap('content/learning-objectives');
const claims = jsonMap('content/claims');
const reviewedStatuses = new Set(['reviewed', 'reviewed-source']);

for (const referenceId of review.referenceIds ?? []) {
  const ref = references.get(referenceId);
  if (!ref) failures.push(`reference does not exist: ${referenceId}`);
  else if (!reviewedStatuses.has(ref.status)) failures.push(`reference ${referenceId} is not reviewed (status=${ref.status})`);
}
for (const lessonId of review.lessonIds ?? []) {
  const lesson = lessons.get(lessonId);
  if (!lesson) {
    failures.push(`lesson does not exist: ${lessonId}`);
    continue;
  }
  const cited = collectReferences(lesson);
  if (!(review.referenceIds ?? []).some((id) => cited.has(id))) {
    failures.push(`lesson ${lessonId} does not directly cite any reviewed reference in this mapping`);
  }
}
for (const competencyId of review.competencyIds ?? []) {
  if (!competencies.has(competencyId)) failures.push(`competency does not exist: ${competencyId}`);
}
for (const objectiveId of review.objectiveIds ?? []) {
  if (!objectives.has(objectiveId)) failures.push(`learning objective does not exist: ${objectiveId}`);
}

const existing = claims.get(review.claimId);
if (review.action === 'create' && existing) failures.push(`claim already exists: ${review.claimId}`);
if (review.action === 'update' && !existing) failures.push(`claim does not exist for update: ${review.claimId}`);

const claim = {
  id: review.claimId,
  statement: review.statement,
  domain: review.domain,
  status: review.claimStatus ?? 'approved',
  version: review.version,
  evidenceStatus: 'reviewed',
  references: review.action === 'update' ? union(existing?.references, review.referenceIds) : [...review.referenceIds].sort(),
  supportsCompetencies: review.action === 'update' ? union(existing?.supportsCompetencies, review.competencyIds) : [...(review.competencyIds ?? [])].sort(),
  supportsLessons: review.action === 'update' ? union(existing?.supportsLessons, review.lessonIds) : [...review.lessonIds].sort(),
  reviewDueAt: review.reviewDueAt ?? existing?.reviewDueAt ?? null
};

if (!validateClaim(claim)) {
  for (const issue of validateClaim.errors ?? []) failures.push(`claim${issue.instancePath || '/'}: ${issue.message}`);
}

const approvedRoot = path.resolve(root, 'automation/curriculum-ingestion/reviews/approved');
if (write && !(reviewPath === approvedRoot || reviewPath.startsWith(`${approvedRoot}${path.sep}`))) {
  failures.push('--write is only permitted for review files committed under automation/curriculum-ingestion/reviews/approved/');
}

if (failures.length) {
  console.error(`Evidence mapping promotion blocked with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const output = {
  reviewId: review.id,
  mappingCandidateId: review.mappingCandidateId,
  action: review.action,
  write,
  claim
};

if (write) {
  const claimPath = path.join(root, 'content/claims', `${review.claimId}.json`);
  fs.writeFileSync(claimPath, `${JSON.stringify(claim, null, 2)}\n`);
  output.claimPath = path.relative(root, claimPath).replaceAll('\\', '/');
}

console.log(JSON.stringify(output, null, 2));
