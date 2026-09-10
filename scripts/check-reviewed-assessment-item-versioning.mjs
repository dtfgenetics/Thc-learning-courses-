import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const REVIEWED_ITEM_FIELDS = [
  'purpose',
  'competency',
  'objective',
  'bloomLevel',
  'difficulty',
  'type',
  'stem',
  'choices',
  'correct',
  'rationale',
  'references'
];

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function substantiveItemChanged(baseItem, headItem) {
  return REVIEWED_ITEM_FIELDS.some((field) =>
    JSON.stringify(stableValue(baseItem?.[field])) !== JSON.stringify(stableValue(headItem?.[field]))
  );
}

export function hasApprovedAssessmentReview(item, reviews) {
  return reviews.some((review) =>
    review?.objectId === item?.id &&
    String(review?.objectVersion) === String(item?.version) &&
    review?.reviewType === 'assessment' &&
    review?.status === 'approved'
  );
}

function numericParts(version) {
  if (typeof version === 'number' && Number.isFinite(version)) return [version];
  const raw = String(version ?? '').trim();
  if (!/^\d+(?:\.\d+)*$/.test(raw)) return null;
  return raw.split('.').map(Number);
}

export function isVersionAdvanced(baseVersion, headVersion) {
  if (String(baseVersion) === String(headVersion)) return false;
  const base = numericParts(baseVersion);
  const head = numericParts(headVersion);
  if (!base || !head) return true;
  const width = Math.max(base.length, head.length);
  for (let i = 0; i < width; i += 1) {
    const left = base[i] ?? 0;
    const right = head[i] ?? 0;
    if (right > left) return true;
    if (right < left) return false;
  }
  return false;
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
}

function parseArgs(argv) {
  const args = { base: process.env.REVIEW_BASE_SHA ?? process.env.BASE_SHA ?? '' };
  for (const arg of argv) {
    if (arg.startsWith('--base=')) args.base = arg.slice('--base='.length);
  }
  return args;
}

function readJsonAt(ref, filePath) {
  return JSON.parse(git(['show', `${ref}:${filePath}`]));
}

function listBaseReviews(base) {
  const raw = git(['ls-tree', '-r', '--name-only', base, '--', 'content/reviews']);
  if (!raw) return [];
  return raw
    .split('\n')
    .filter((filePath) => filePath.endsWith('.json'))
    .map((filePath) => readJsonAt(base, filePath));
}

export function evaluateReviewedItemChange(baseItem, headItem, baseReviews) {
  if (!baseItem || !headItem) return null;
  if (!hasApprovedAssessmentReview(baseItem, baseReviews)) return null;
  if (!substantiveItemChanged(baseItem, headItem)) return null;
  if (baseItem.id !== headItem.id) {
    return `reviewed item identity changed in place (${baseItem.id} -> ${headItem.id}); create a new item instead`;
  }
  if (!isVersionAdvanced(baseItem.version, headItem.version)) {
    return `reviewed assessment content changed without advancing version ${baseItem.version}`;
  }
  return null;
}

function main() {
  const { base } = parseArgs(process.argv.slice(2));
  if (!base || /^0+$/.test(base)) {
    console.log('reviewed assessment version-integrity check skipped: no usable base SHA');
    return;
  }

  try {
    git(['cat-file', '-e', `${base}^{commit}`]);
  } catch {
    console.error(`reviewed assessment version-integrity check failed: base commit ${base} is unavailable; use a full-history checkout`);
    process.exit(2);
  }

  const changed = git(['diff', '--name-only', '--diff-filter=AMR', `${base}...HEAD`, '--', 'content/questions']);
  if (!changed) {
    console.log('reviewed assessment version-integrity check passed: no assessment items changed');
    return;
  }

  const baseReviews = listBaseReviews(base);
  const violations = [];
  for (const filePath of changed.split('\n').filter((p) => p.endsWith('.json'))) {
    let baseItem;
    try {
      baseItem = readJsonAt(base, filePath);
    } catch {
      continue; // New item on the head branch.
    }
    const headItem = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const violation = evaluateReviewedItemChange(baseItem, headItem, baseReviews);
    if (violation) violations.push(`${filePath}: ${violation}`);
  }

  if (violations.length > 0) {
    console.error('Reviewed assessment version-integrity violations:');
    for (const violation of violations) console.error(`- ${violation}`);
    console.error('Advance the item version for substantive changes. The existing review will then no longer match and the revised version must be reviewed again.');
    process.exit(1);
  }

  console.log('reviewed assessment version-integrity check passed');
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) main();
