import fs from 'node:fs';
import path from 'node:path';
import { buildReviewRecord } from './create-review-record.mjs';

const root = process.cwd();

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    if (['write', 'confirm-approved'].includes(key)) out[key] = true;
    else out[key] = argv[++i];
  }
  return out;
}
function readJson(relOrAbs) {
  const file = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(root, relOrAbs);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(dir, name)));
}

export function pendingFoundationAssessmentItemIds(baseDir = root) {
  const registry = JSON.parse(fs.readFileSync(path.join(baseDir, 'registry/cultivation-foundations.json'), 'utf8'));
  const questionsDir = path.join(baseDir, 'content/questions');
  const reviewsDir = path.join(baseDir, 'content/reviews');
  const questions = fs.readdirSync(questionsDir).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(fs.readFileSync(path.join(questionsDir, name), 'utf8')));
  const reviews = fs.readdirSync(reviewsDir).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(fs.readFileSync(path.join(reviewsDir, name), 'utf8')));
  const competencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));
  const objectives = new Set((registry.domains ?? []).flatMap((domain) => domain.objectives ?? []));
  return new Set(questions.filter((item) =>
    competencies.has(item.competency) &&
    objectives.has(item.objective) &&
    ['summative', 'credential'].includes(item.purpose) &&
    !['retired', 'flagged'].includes(item.status) &&
    !reviews.some((review) => review.objectId === item.id && String(review.objectVersion) === String(item.version) && review.reviewType === 'assessment' && review.status === 'approved')
  ).map((item) => item.id));
}

export function buildDecisionRecords(input, {confirmApproved = false, baseDir = root} = {}) {
  if (!input || typeof input !== 'object') throw new Error('Decision input must be a JSON object.');
  if (!input.reviewerId || String(input.reviewerId).length < 3) throw new Error('reviewerId must be at least 3 characters.');
  if (!Array.isArray(input.decisions) || input.decisions.length === 0) throw new Error('decisions must contain at least one explicit human decision.');
  const pending = pendingFoundationAssessmentItemIds(baseDir);
  const seen = new Set();
  return input.decisions.map((decision) => {
    if (!decision.objectId) throw new Error('Every decision requires objectId.');
    if (seen.has(decision.objectId)) throw new Error(`Duplicate decision for ${decision.objectId}.`);
    seen.add(decision.objectId);
    if (!pending.has(decision.objectId)) throw new Error(`${decision.objectId} is not in the current pending Foundations assessment-review batch.`);
    if (!['approved', 'changes-requested', 'rejected'].includes(decision.status)) throw new Error(`${decision.objectId} has invalid decision status ${decision.status}.`);
    if (!decision.notes || !String(decision.notes).trim()) throw new Error(`${decision.objectId} requires reviewer notes.`);
    return buildReviewRecord({
      objectId: decision.objectId,
      reviewType: 'assessment',
      reviewerId: input.reviewerId,
      status: decision.status,
      notes: decision.notes,
      evidenceChecked: Array.isArray(decision.evidenceChecked) ? decision.evidenceChecked : [],
      reviewedAt: input.reviewedAt ?? new Date().toISOString(),
      confirmApproved,
      baseDir
    });
  });
}

const args = parseArgs(process.argv.slice(2));
if (!args.decisions) {
  console.error('Usage: node scripts/apply-foundations-assessment-review-decisions.mjs --decisions path/to/decisions.json [--confirm-approved] [--write]');
  process.exit(64);
}
try {
  const input = readJson(args.decisions);
  const records = buildDecisionRecords(input, {confirmApproved: Boolean(args['confirm-approved'])});
  const output = {
    mode: args.write ? 'write' : 'preview',
    reviewerId: input.reviewerId,
    reviewedAt: input.reviewedAt ?? null,
    decisions: records.map((record) => ({id: record.id, objectId: record.objectId, objectVersion: record.objectVersion, status: record.status}))
  };
  if (args.write) {
    for (const record of records) {
      const file = path.join(root, 'content/reviews', `${record.id}.json`);
      if (fs.existsSync(file)) throw new Error(`Review record already exists: ${file}`);
      fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    }
  }
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
