import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const nearThresholdArg = process.argv.find((arg) => arg.startsWith('--near-threshold='));
const nearThreshold = nearThresholdArg ? Number(nearThresholdArg.split('=')[1]) : 0.84;

if (!Number.isFinite(nearThreshold) || nearThreshold < 0 || nearThreshold > 1) {
  throw new Error(`Invalid --near-threshold value: ${nearThresholdArg ?? ''}`);
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readQuestions() {
  const dir = path.join(root, 'content/questions');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ file: path.join('content/questions', name), data: readJson(path.join('content/questions', name)) }));
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length > 1));
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function pairRecord(left, right, similarity, kind) {
  return {
    kind,
    similarity: Number(similarity.toFixed(4)),
    left: {
      id: left.id,
      version: left.version,
      status: left.status,
      purpose: left.purpose,
      competency: left.competency,
      objective: left.objective,
      stem: left.stem
    },
    right: {
      id: right.id,
      version: right.version,
      status: right.status,
      purpose: right.purpose,
      competency: right.competency,
      objective: right.objective,
      stem: right.stem
    }
  };
}

const questions = readQuestions().map(({ file, data }) => ({ ...data, file }));
const activeQuestions = questions.filter((item) => item.status !== 'retired');
const exactGroups = new Map();

for (const item of activeQuestions) {
  const normalized = normalizeText(item.stem);
  if (!normalized) continue;
  const group = exactGroups.get(normalized) ?? [];
  group.push(item);
  exactGroups.set(normalized, group);
}

const exactDuplicates = [];
for (const group of exactGroups.values()) {
  if (group.length < 2) continue;
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      exactDuplicates.push(pairRecord(group[i], group[j], 1, 'exact-normalized-stem'));
    }
  }
}

const exactKeys = new Set(exactDuplicates.map((pair) => [pair.left.id, pair.right.id].sort().join('::')));
const nearDuplicates = [];

for (let i = 0; i < activeQuestions.length; i += 1) {
  const left = activeQuestions[i];
  const leftTokens = tokens(left.stem);
  for (let j = i + 1; j < activeQuestions.length; j += 1) {
    const right = activeQuestions[j];
    const pairKey = [left.id, right.id].sort().join('::');
    if (exactKeys.has(pairKey)) continue;

    // Restrict automated near-duplicate candidates to a shared competency or objective.
    // Cross-domain vocabulary overlap is too noisy to treat as an actionable duplicate signal.
    const sameCompetency = left.competency && left.competency === right.competency;
    const sameObjective = left.objective && left.objective === right.objective;
    if (!sameCompetency && !sameObjective) continue;

    const similarity = jaccard(leftTokens, tokens(right.stem));
    if (similarity >= nearThreshold) {
      nearDuplicates.push(pairRecord(left, right, similarity, 'near-stem-similarity'));
    }
  }
}

nearDuplicates.sort((a, b) => b.similarity - a.similarity || a.left.id.localeCompare(b.left.id) || a.right.id.localeCompare(b.right.id));
exactDuplicates.sort((a, b) => a.left.id.localeCompare(b.left.id) || a.right.id.localeCompare(b.right.id));

const summary = {
  questionCount: questions.length,
  nonRetiredQuestionCount: activeQuestions.length,
  retiredQuestionCount: questions.length - activeQuestions.length,
  exactDuplicatePairCount: exactDuplicates.length,
  nearDuplicatePairCount: nearDuplicates.length,
  nearDuplicateThreshold: nearThreshold,
  exactDuplicatesBlockCheck: true,
  nearDuplicatesRequireHumanReview: nearDuplicates.length > 0
};

console.log(JSON.stringify({ summary, exactDuplicates, nearDuplicates }, null, 2));

if (check && exactDuplicates.length > 0) {
  throw new Error(`Assessment duplicate check found ${exactDuplicates.length} exact normalized-stem duplicate pair(s).`);
}
