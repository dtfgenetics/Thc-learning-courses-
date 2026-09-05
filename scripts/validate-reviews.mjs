import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reviewDir = path.join(root, 'content/reviews');
const errors = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readDirJson(rel, kind) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      file: path.join(rel, name),
      kind,
      data: readJson(path.join(dir, name))
    }));
}

const collections = [
  ...readDirJson('content/competencies', 'competency'),
  ...readDirJson('content/learning-objectives', 'learning-objective'),
  ...readDirJson('content/lessons', 'lesson'),
  ...readDirJson('content/claims', 'claim'),
  ...readDirJson('content/assessments', 'assessment'),
  ...readDirJson('content/questions', 'question'),
  ...readDirJson('content/references', 'reference'),
  ...readDirJson('content/modules', 'module'),
  ...readDirJson('content/courses', 'course'),
  ...readDirJson('content/programs', 'program'),
  ...readDirJson('content/credentials', 'credential')
];

const targets = new Map();
for (const entry of collections) {
  if (entry.data.id) targets.set(entry.data.id, entry);
}

const reviewFiles = fs.existsSync(reviewDir)
  ? fs.readdirSync(reviewDir).filter((name) => name.endsWith('.json')).sort()
  : [];

const seenIds = new Set();
const reviews = [];
const allowedFields = new Set([
  'id',
  'objectId',
  'objectVersion',
  'reviewType',
  'status',
  'reviewerId',
  'reviewedAt',
  'notes',
  'evidenceChecked'
]);
const reviewTypes = new Set(['scientific', 'editorial', 'assessment', 'accessibility', 'legal-compliance']);
const reviewStatuses = new Set(['approved', 'changes-requested', 'rejected']);

for (const name of reviewFiles) {
  const rel = path.join('content/reviews', name);
  let review;
  try {
    review = readJson(path.join(root, rel));
  } catch (error) {
    errors.push(`${rel}: invalid JSON (${error.message})`);
    continue;
  }

  reviews.push({ file: rel, data: review });

  for (const field of ['id', 'objectId', 'objectVersion', 'reviewType', 'status', 'reviewerId', 'reviewedAt']) {
    if (review[field] === undefined || review[field] === null || review[field] === '') {
      errors.push(`${rel}: missing required field ${field}`);
    }
  }

  for (const field of Object.keys(review)) {
    if (!allowedFields.has(field)) errors.push(`${rel}: unsupported field ${field}`);
  }

  if (typeof review.id !== 'string' || !/^REVIEW-[A-Z0-9-]+$/.test(review.id)) {
    errors.push(`${rel}: id must match REVIEW-[A-Z0-9-]+`);
  } else if (seenIds.has(review.id)) {
    errors.push(`${rel}: duplicate review id ${review.id}`);
  } else {
    seenIds.add(review.id);
  }

  if (!reviewTypes.has(review.reviewType)) errors.push(`${rel}: invalid reviewType ${review.reviewType}`);
  if (!reviewStatuses.has(review.status)) errors.push(`${rel}: invalid status ${review.status}`);
  if (typeof review.reviewerId !== 'string' || review.reviewerId.length < 3) errors.push(`${rel}: reviewerId must be at least 3 characters`);

  const reviewedAt = Date.parse(review.reviewedAt);
  if (!Number.isFinite(reviewedAt)) errors.push(`${rel}: reviewedAt must be a valid date-time`);

  if (review.notes !== undefined && typeof review.notes !== 'string') errors.push(`${rel}: notes must be a string`);
  if (review.evidenceChecked !== undefined) {
    if (!Array.isArray(review.evidenceChecked)) {
      errors.push(`${rel}: evidenceChecked must be an array`);
    } else if (new Set(review.evidenceChecked).size !== review.evidenceChecked.length) {
      errors.push(`${rel}: evidenceChecked must contain unique values`);
    }
  }

  const target = targets.get(review.objectId);
  if (!target) {
    errors.push(`${rel}: reviewed object ${review.objectId} does not exist`);
  } else if (String(target.data.version) !== String(review.objectVersion)) {
    errors.push(`${rel}: objectVersion ${review.objectVersion} does not match ${review.objectId} current version ${target.data.version}`);
  }
}

function hasApprovedReview(objectId, objectVersion, reviewType) {
  return reviews.some(({ data }) =>
    data.objectId === objectId &&
    String(data.objectVersion) === String(objectVersion) &&
    data.reviewType === reviewType &&
    data.status === 'approved'
  );
}

for (const target of collections) {
  const { data, file, kind } = target;

  if (kind === 'lesson' && data.status === 'published') {
    for (const reviewType of ['scientific', 'editorial']) {
      if (!hasApprovedReview(data.id, data.version, reviewType)) {
        errors.push(`${file}: published lesson ${data.id}@${data.version} is missing approved ${reviewType} review evidence`);
      }
    }
  }

  if (kind === 'question' && data.status === 'active') {
    if (!hasApprovedReview(data.id, data.version, 'assessment')) {
      errors.push(`${file}: active assessment item ${data.id}@${data.version} is missing an approved assessment review record`);
    }
  }

  if (kind === 'assessment' && ['active', 'approved', 'published'].includes(data.status)) {
    if (!hasApprovedReview(data.id, data.version, 'assessment')) {
      errors.push(`${file}: production-eligible assessment ${data.id}@${data.version} is missing an approved assessment review record`);
    }
  }
}

if (errors.length) {
  console.error('Review-record validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Review-record validation passed. ${reviewFiles.length} review record(s) checked; promotion evidence rules enforced.`);
