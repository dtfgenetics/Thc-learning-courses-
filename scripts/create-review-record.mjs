import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const searchable = [
  'content/competencies', 'content/learning-objectives', 'content/lessons', 'content/claims',
  'content/assessments', 'content/questions', 'content/references', 'content/modules',
  'content/courses', 'content/programs', 'content/credentials'
];
const reviewTypes = new Set(['scientific', 'editorial', 'assessment', 'accessibility', 'legal-compliance']);
const statuses = new Set(['approved', 'changes-requested', 'rejected']);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    if (key === 'confirm-approved' || key === 'write') out[key] = true;
    else out[key] = argv[++i];
  }
  return out;
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

export function findReviewTarget(objectId, baseDir = root) {
  for (const rel of searchable) {
    const dir = path.join(baseDir, rel);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
      const file = path.join(dir, name);
      const data = readJson(file);
      if (data.id === objectId) return { file, data };
    }
  }
  return null;
}

function safeToken(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'REVIEWER';
}

export function buildReviewRecord({ objectId, reviewType, reviewerId, status, notes = '', evidenceChecked = [], reviewedAt = new Date().toISOString(), confirmApproved = false, baseDir = root }) {
  if (!objectId) throw new Error('objectId is required');
  if (!reviewTypes.has(reviewType)) throw new Error(`invalid reviewType: ${reviewType}`);
  if (!statuses.has(status)) throw new Error(`invalid status: ${status}`);
  if (!reviewerId || String(reviewerId).length < 3) throw new Error('reviewerId must be at least 3 characters');
  if (status === 'approved' && !confirmApproved) throw new Error('approved decisions require --confirm-approved');
  if (!Array.isArray(evidenceChecked)) throw new Error('evidenceChecked must be an array');
  if (new Set(evidenceChecked).size !== evidenceChecked.length) throw new Error('evidenceChecked must be unique');

  const target = findReviewTarget(objectId, baseDir);
  if (!target) throw new Error(`review target not found: ${objectId}`);
  const version = target.data.version;
  if (version === undefined || version === null || version === '') throw new Error(`review target has no version: ${objectId}`);
  if (reviewType === 'scientific' && status === 'approved' && evidenceChecked.length === 0) {
    throw new Error('approved scientific reviews require at least one --evidence reference id');
  }

  const stamp = String(reviewedAt).replace(/[-:.TZ]/g, '').slice(0, 14);
  return {
    id: `REVIEW-${safeToken(objectId)}-${safeToken(reviewType)}-${stamp}`,
    objectId,
    objectVersion: version,
    reviewType,
    status,
    reviewerId: String(reviewerId),
    reviewedAt,
    notes: String(notes),
    evidenceChecked
  };
}

function usage() {
  console.error('Usage: node scripts/create-review-record.mjs --object ID --type scientific|editorial|assessment|accessibility|legal-compliance --reviewer ID --status approved|changes-requested|rejected [--notes TEXT] [--evidence REF-ID,REF-ID] [--confirm-approved] [--write]');
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.object || !args.type || !args.reviewer || !args.status) {
      usage();
      process.exit(64);
    }
    const record = buildReviewRecord({
      objectId: args.object,
      reviewType: args.type,
      reviewerId: args.reviewer,
      status: args.status,
      notes: args.notes ?? '',
      evidenceChecked: args.evidence ? args.evidence.split(',').map((v) => v.trim()).filter(Boolean) : [],
      confirmApproved: Boolean(args['confirm-approved'])
    });
    const serialized = `${JSON.stringify(record, null, 2)}\n`;
    if (args.write) {
      const out = path.join(root, 'content/reviews', `${record.id}.json`);
      if (fs.existsSync(out)) throw new Error(`review record already exists: ${out}`);
      fs.writeFileSync(out, serialized, 'utf8');
      console.log(`Created ${path.relative(root, out)}`);
    } else {
      process.stdout.write(serialized);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
