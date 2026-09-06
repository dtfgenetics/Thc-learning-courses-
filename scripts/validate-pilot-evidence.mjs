import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const pilotDir = path.join(root, 'content/pilot-evidence');

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => ({file:path.join(rel,n),data:readJson(path.join(dir,n))}));
}
function inUnit(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1; }

const questionEntries = readDirJson('content/questions');
const questions = new Map(questionEntries.map((x) => [x.data.id, x]));
const reviews = readDirJson('content/reviews').map((x) => x.data);
const pilotFiles = fs.existsSync(pilotDir) ? fs.readdirSync(pilotDir).filter((n) => n.endsWith('.json')).sort() : [];
const records = [];
const seenIds = new Set();
const allowedStatuses = new Set(['draft','complete','invalidated']);
const allowedMethods = new Set(['point-biserial','upper-lower','other']);

for (const name of pilotFiles) {
  const rel = path.join('content/pilot-evidence', name);
  let record;
  try { record = readJson(path.join(root, rel)); }
  catch (error) { errors.push(`${rel}: invalid JSON (${error.message})`); continue; }
  records.push({file:rel,data:record});

  for (const field of ['id','itemId','itemVersion','status','sampleSize','distractorSelection','challengeHistory','analystId']) {
    if (record[field] === undefined || record[field] === null || record[field] === '') errors.push(`${rel}: missing required field ${field}`);
  }
  if (typeof record.id !== 'string' || !/^PILOT-[A-Z0-9-]+$/.test(record.id)) errors.push(`${rel}: id must match PILOT-[A-Z0-9-]+`);
  else if (seenIds.has(record.id)) errors.push(`${rel}: duplicate pilot evidence id ${record.id}`);
  else seenIds.add(record.id);
  if (!allowedStatuses.has(record.status)) errors.push(`${rel}: invalid status ${record.status}`);
  if (!Number.isInteger(record.itemVersion) || record.itemVersion < 1) errors.push(`${rel}: itemVersion must be a positive integer`);
  if (!Number.isInteger(record.sampleSize) || record.sampleSize < 0) errors.push(`${rel}: sampleSize must be a non-negative integer`);
  if (typeof record.analystId !== 'string' || record.analystId.length < 3) errors.push(`${rel}: analystId must be at least 3 characters`);

  const itemEntry = questions.get(record.itemId);
  if (!itemEntry) errors.push(`${rel}: item ${record.itemId} does not exist`);
  else if (String(itemEntry.data.version) !== String(record.itemVersion)) errors.push(`${rel}: itemVersion ${record.itemVersion} does not match ${record.itemId} current version ${itemEntry.data.version}`);

  if (!Array.isArray(record.distractorSelection)) errors.push(`${rel}: distractorSelection must be an array`);
  else {
    const seenChoices = new Set();
    for (const row of record.distractorSelection) {
      if (!Number.isInteger(row.choiceIndex) || row.choiceIndex < 0) errors.push(`${rel}: distractor choiceIndex must be a non-negative integer`);
      if (seenChoices.has(row.choiceIndex)) errors.push(`${rel}: duplicate distractor choiceIndex ${row.choiceIndex}`);
      seenChoices.add(row.choiceIndex);
      if (!Number.isInteger(row.count) || row.count < 0) errors.push(`${rel}: distractor count must be a non-negative integer`);
      if (!inUnit(row.proportion)) errors.push(`${rel}: distractor proportion must be between 0 and 1`);
      if (itemEntry?.data.choices && row.choiceIndex >= itemEntry.data.choices.length) errors.push(`${rel}: distractor choiceIndex ${row.choiceIndex} is outside item choices`);
    }
  }
  if (!Array.isArray(record.challengeHistory)) errors.push(`${rel}: challengeHistory must be an array`);

  if (record.status === 'complete') {
    if (record.sampleSize < 1) errors.push(`${rel}: complete pilot evidence requires sampleSize >= 1`);
    if (!inUnit(record.percentCorrect)) errors.push(`${rel}: complete pilot evidence requires percentCorrect between 0 and 1`);
    if (!inUnit(record.omitRate)) errors.push(`${rel}: complete pilot evidence requires omitRate between 0 and 1`);
    if (!inUnit(record.responseTimeAnomalyRate)) errors.push(`${rel}: complete pilot evidence requires responseTimeAnomalyRate between 0 and 1`);
    if (typeof record.medianResponseTimeSeconds !== 'number' || !Number.isFinite(record.medianResponseTimeSeconds) || record.medianResponseTimeSeconds < 0) errors.push(`${rel}: complete pilot evidence requires non-negative medianResponseTimeSeconds`);
    if (!record.discrimination || !allowedMethods.has(record.discrimination.method) || typeof record.discrimination.value !== 'number' || record.discrimination.value < -1 || record.discrimination.value > 1) errors.push(`${rel}: complete pilot evidence requires a valid discrimination statistic`);
    if (!record.completedAt || !Number.isFinite(Date.parse(record.completedAt))) errors.push(`${rel}: complete pilot evidence requires valid completedAt`);
  }
}

function recordsFor(item) { return records.filter((r) => r.data.itemId === item.id && String(r.data.itemVersion) === String(item.version)); }
function hasApprovedAssessmentReview(item) {
  return reviews.some((r) => r.objectId === item.id && String(r.objectVersion) === String(item.version) && r.reviewType === 'assessment' && r.status === 'approved');
}

for (const {file,data:item} of questionEntries) {
  const itemRecords = recordsFor(item);
  if (item.status === 'pilot' && itemRecords.length === 0) errors.push(`${file}: pilot item ${item.id}@${item.version} is missing a pilot evidence record`);
  if (item.status === 'active') {
    const complete = itemRecords.some((r) => r.data.status === 'complete');
    if (!complete) errors.push(`${file}: active item ${item.id}@${item.version} is missing complete pilot evidence`);
    if (!hasApprovedAssessmentReview(item)) errors.push(`${file}: active item ${item.id}@${item.version} is missing approved assessment review evidence`);
  }
}

if (errors.length) {
  console.error('Pilot-evidence validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Pilot-evidence validation passed. ${pilotFiles.length} pilot evidence record(s) checked; pilot/active promotion evidence rules enforced.`);
