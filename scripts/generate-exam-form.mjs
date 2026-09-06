import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const allowDraft = args.has('--allow-draft');
const seedArg = process.argv.find((arg) => arg.startsWith('--seed='));
const assessmentArg = process.argv.find((arg) => arg.startsWith('--assessment='));
const seed = seedArg ? seedArg.slice('--seed='.length) : crypto.randomUUID();
const assessmentId = assessmentArg ? assessmentArg.slice('--assessment='.length) : 'ASSESS-CULT-FOUNDATIONS-FINAL-001';

if (!/^ASSESS-[A-Z0-9-]+$/.test(assessmentId)) throw new Error(`Invalid assessment ID ${assessmentId}`);

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

const assessment = readJson(`content/assessments/${assessmentId}.json`);
const questions = readDirJson('content/questions');
const eligibleStatuses = allowDraft
  ? new Set(['draft', 'technical-review', 'editorial-review', 'pilot', 'active'])
  : new Set(['active']);

const rand = mulberry32(hashToUint32(seed));
const selected = [];
const coverage = [];
const selectedIds = new Set();

function chooseFromPool(pool, count, label) {
  if (pool.length < count) {
    throw new Error(`${label}: needs ${count} eligible item(s), found ${pool.length}. Production generation requires active items only.`);
  }
  const chosen = shuffle(pool, rand).slice(0, count);
  for (const item of chosen) {
    const key = `${item.id}@${item.version}`;
    if (selectedIds.has(key)) throw new Error(`Duplicate selected item ${key}`);
    selectedIds.add(key);
    selected.push(item);
  }
  return chosen;
}

if (Array.isArray(assessment.itemPools) && assessment.itemPools.length) {
  for (const row of assessment.itemPools) {
    const pool = questions.filter((item) =>
      item.id.startsWith(row.idPrefix) &&
      ['summative', 'credential'].includes(item.purpose) &&
      eligibleStatuses.has(item.status)
    );
    const chosen = chooseFromPool(pool, row.items, row.name);
    coverage.push({ pool: row.name, idPrefix: row.idPrefix, count: chosen.length });
  }
} else {
  for (const row of assessment.blueprint ?? []) {
    const pool = questions.filter((item) =>
      item.competency === row.competency &&
      ['summative', 'credential'].includes(item.purpose) &&
      eligibleStatuses.has(item.status)
    );
    const chosen = chooseFromPool(pool, row.items, row.competency);
    coverage.push({ competency: row.competency, count: chosen.length });
  }
}

if (assessment.totalItems && selected.length !== assessment.totalItems) {
  throw new Error(`${assessment.id}: blueprint selected ${selected.length} item(s), expected totalItems=${assessment.totalItems}`);
}

const formKey = assessment.id.replace(/^ASSESS-/, '').replace(/-001$/, '');
const payload = {
  id: `FORM-${formKey}-${crypto.createHash('sha256').update(`${assessment.id}:${seed}`).digest('hex').slice(0, 12).toUpperCase()}`,
  assessment: assessment.id,
  assessmentVersion: assessment.version,
  algorithmVersion: '1.1.0',
  status: 'generated',
  items: selected.map((item) => ({ id: item.id, version: item.version })),
  coverage,
  seed,
  integrityHash: ''
};

payload.integrityHash = crypto.createHash('sha256')
  .update(JSON.stringify({ ...payload, integrityHash: undefined }))
  .digest('hex');

console.log(JSON.stringify(payload, null, 2));
