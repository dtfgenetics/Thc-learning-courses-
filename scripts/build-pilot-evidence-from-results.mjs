import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const inputPath = getArg('--input');
const write = args.includes('--write');
const complete = args.includes('--complete');

if (!inputPath) {
  console.error('Usage: node scripts/build-pilot-evidence-from-results.mjs --input <private-results.json> [--complete] [--write]');
  process.exit(1);
}

const absoluteInput = path.resolve(root, inputPath);
if (!fs.existsSync(absoluteInput)) {
  console.error(`Pilot results file not found: ${inputPath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(absoluteInput, 'utf8'));
if (!payload || typeof payload !== 'object') throw new Error('Pilot results payload must be an object');
if (typeof payload.cohortId !== 'string' || payload.cohortId.length < 3) throw new Error('cohortId is required');
if (typeof payload.analystId !== 'string' || payload.analystId.length < 3) throw new Error('analystId is required');
if (!Array.isArray(payload.responses) || payload.responses.length === 0) throw new Error('responses must be a non-empty array');

const questionDir = path.join(root, 'content/questions');
const questionMap = new Map(
  fs.readdirSync(questionDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const item = JSON.parse(fs.readFileSync(path.join(questionDir, name), 'utf8'));
      return [`${item.id}@${item.version}`, item];
    })
);

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pointBiserial(rows) {
  const usable = rows.filter((row) => Number.isFinite(row.totalScore) && typeof row.correct === 'boolean');
  if (usable.length < 2) return null;
  const x = usable.map((row) => row.correct ? 1 : 0);
  const y = usable.map((row) => Number(row.totalScore));
  const meanX = x.reduce((a, b) => a + b, 0) / x.length;
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  const covariance = x.reduce((sum, value, i) => sum + (value - meanX) * (y[i] - meanY), 0) / x.length;
  const sdX = Math.sqrt(x.reduce((sum, value) => sum + (value - meanX) ** 2, 0) / x.length);
  const sdY = Math.sqrt(y.reduce((sum, value) => sum + (value - meanY) ** 2, 0) / y.length);
  if (sdX === 0 || sdY === 0) return null;
  return covariance / (sdX * sdY);
}

const grouped = new Map();
for (const [index, row] of payload.responses.entries()) {
  if (!row || typeof row !== 'object') throw new Error(`responses[${index}] must be an object`);
  if (typeof row.participantId !== 'string' || row.participantId.length < 1) throw new Error(`responses[${index}].participantId is required`);
  if (typeof row.itemId !== 'string' || !/^ITEM-[A-Z0-9-]+$/.test(row.itemId)) throw new Error(`responses[${index}].itemId is invalid`);
  if (!Number.isInteger(row.itemVersion) || row.itemVersion < 1) throw new Error(`responses[${index}].itemVersion is invalid`);
  if (typeof row.correct !== 'boolean') throw new Error(`responses[${index}].correct must be boolean`);
  if (row.omitted !== undefined && typeof row.omitted !== 'boolean') throw new Error(`responses[${index}].omitted must be boolean when present`);
  if (row.selectedChoiceIndex !== null && row.selectedChoiceIndex !== undefined && (!Number.isInteger(row.selectedChoiceIndex) || row.selectedChoiceIndex < 0)) throw new Error(`responses[${index}].selectedChoiceIndex is invalid`);
  if (!Number.isFinite(row.responseTimeSeconds) || row.responseTimeSeconds < 0) throw new Error(`responses[${index}].responseTimeSeconds is invalid`);
  if (!Number.isFinite(row.totalScore) || row.totalScore < 0 || row.totalScore > 1) throw new Error(`responses[${index}].totalScore must be between 0 and 1`);
  if (row.responseTimeAnomaly !== undefined && typeof row.responseTimeAnomaly !== 'boolean') throw new Error(`responses[${index}].responseTimeAnomaly must be boolean when present`);

  const key = `${row.itemId}@${row.itemVersion}`;
  if (!questionMap.has(key)) throw new Error(`Pilot results reference unknown item version ${key}`);
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(row);
}

const output = [];
for (const [key, rows] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const [itemId, itemVersionRaw] = key.split('@');
  const itemVersion = Number(itemVersionRaw);
  const nonOmitted = rows.filter((row) => row.omitted !== true);
  const correctCount = rows.filter((row) => row.correct === true).length;
  const omitCount = rows.filter((row) => row.omitted === true).length;
  const times = rows.map((row) => Number(row.responseTimeSeconds));
  const anomalyCount = rows.filter((row) => row.responseTimeAnomaly === true).length;
  const choiceCounts = new Map();
  for (const row of nonOmitted) {
    if (row.selectedChoiceIndex === null || row.selectedChoiceIndex === undefined) continue;
    choiceCounts.set(row.selectedChoiceIndex, (choiceCounts.get(row.selectedChoiceIndex) ?? 0) + 1);
  }
  const discriminationValue = pointBiserial(rows);
  const evidence = {
    id: `PILOT-${payload.cohortId.replace(/[^A-Z0-9-]/gi, '-').toUpperCase()}-${itemId.replace(/^ITEM-/, '')}-V${itemVersion}`,
    itemId,
    itemVersion,
    status: complete ? 'complete' : 'draft',
    sampleSize: rows.length,
    percentCorrect: rows.length ? correctCount / rows.length : null,
    discrimination: discriminationValue === null ? null : { method: 'point-biserial', value: discriminationValue },
    distractorSelection: [...choiceCounts.entries()].sort((a, b) => a[0] - b[0]).map(([choiceIndex, count]) => ({
      choiceIndex,
      count,
      proportion: nonOmitted.length ? count / nonOmitted.length : 0
    })),
    omitRate: rows.length ? omitCount / rows.length : null,
    medianResponseTimeSeconds: median(times),
    responseTimeAnomalyRate: rows.length ? anomalyCount / rows.length : null,
    challengeHistory: [],
    analystId: payload.analystId,
    completedAt: complete ? (payload.completedAt ?? new Date().toISOString()) : null,
    notes: `Aggregated from pseudonymous pilot cohort ${payload.cohortId}. Participant-level responses are not stored in the repository.`
  };
  output.push(evidence);
}

if (write) {
  const outDir = path.join(root, 'content/pilot-evidence');
  fs.mkdirSync(outDir, { recursive: true });
  for (const record of output) {
    const target = path.join(outDir, `${record.id}.json`);
    if (fs.existsSync(target)) throw new Error(`Refusing to overwrite existing pilot evidence ${path.relative(root, target)}`);
    fs.writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`);
  }
}

console.log(JSON.stringify({
  cohortId: payload.cohortId,
  records: output.length,
  status: complete ? 'complete' : 'draft',
  wroteFiles: write,
  participantLevelDataCommitted: false,
  evidence: output
}, null, 2));
