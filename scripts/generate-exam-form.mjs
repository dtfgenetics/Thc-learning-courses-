import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const allowDraft = args.has('--allow-draft');
const seedArg = process.argv.find((arg) => arg.startsWith('--seed='));
const seed = seedArg ? seedArg.slice('--seed='.length) : crypto.randomUUID();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  return fs.readdirSync(path.join(root, rel))
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(rel, name)));
}

function hashToUint32(value) {
  return Number.parseInt(crypto.createHash('sha256').update(value).digest('hex').slice(0, 8), 16) >>> 0;
}

function mulberry32(a) {
  return function rand() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, rand) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const assessment = readJson('content/assessments/ASSESS-CULT-FOUNDATIONS-FINAL-001.json');
const questions = readDirJson('content/questions');
const eligibleStatuses = allowDraft
  ? new Set(['draft', 'technical-review', 'editorial-review', 'pilot', 'active'])
  : new Set(['active']);

const rand = mulberry32(hashToUint32(seed));
const selected = [];
const coverage = [];

for (const row of assessment.blueprint ?? []) {
  const pool = questions.filter((item) =>
    item.competency === row.competency &&
    ['summative', 'credential'].includes(item.purpose) &&
    eligibleStatuses.has(item.status)
  );

  if (pool.length < row.items) {
    throw new Error(`${row.competency}: needs ${row.items} eligible item(s), found ${pool.length}. Production generation requires active items only.`);
  }

  const chosen = shuffle(pool, rand).slice(0, row.items);
  selected.push(...chosen.map((item) => ({ id: item.id, version: item.version })));
  coverage.push({ competency: row.competency, count: chosen.length });
}

const payload = {
  id: `FORM-CULT-FOUNDATIONS-${crypto.createHash('sha256').update(seed).digest('hex').slice(0, 12).toUpperCase()}`,
  assessment: assessment.id,
  assessmentVersion: assessment.version,
  algorithmVersion: '1.0.0',
  status: 'generated',
  items: selected,
  coverage,
  seed,
  integrityHash: ''
};

payload.integrityHash = crypto.createHash('sha256')
  .update(JSON.stringify({ ...payload, integrityHash: undefined }))
  .digest('hex');

console.log(JSON.stringify(payload, null, 2));
