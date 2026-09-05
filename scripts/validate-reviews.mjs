import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reviewDir = path.join(root, 'content/reviews');
const errors = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectTargets() {
  const directories = [
    'content/competencies',
    'content/learning-objectives',
    'content/lessons',
    'content/claims',
    'content/assessments',
    'content/questions',
    'content/references',
    'content/modules',
    'content/courses',
    'content/programs',
    'content/credentials'
  ];
  const targets = new Map();
  for (const rel of directories) {
    const dir = path.join(root, rel);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith('.json'))) {
      const data = readJson(path.join(dir, name));
      if (data.id) targets.set(data.id, data);
    }
  }
  return targets;
}

const targets = collectTargets();
const reviewFiles = fs.existsSync(reviewDir)
  ? fs.readdirSync(reviewDir).filter((name) => name.endsWith('.json')).sort()
  : [];

const seenIds = new Set();
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
  } else if (String(target.version) !== String(review.objectVersion)) {
    errors.push(`${rel}: objectVersion ${review.objectVersion} does not match ${review.objectId} current version ${target.version}`);
  }
}

if (errors.length) {
  console.error('Review-record validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Review-record validation passed. ${reviewFiles.length} review record(s) checked.`);
