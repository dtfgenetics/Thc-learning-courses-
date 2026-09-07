#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).filter((arg) => arg.startsWith('--') && arg.includes('=')).map((arg) => {
  const [key, ...rest] = arg.slice(2).split('=');
  return [key, rest.join('=')];
}));
const write = process.argv.includes('--write');
const confirm = process.argv.includes('--confirm');
const itemId = args.item;
const target = args.to;

if (!itemId || !target) throw new Error('Usage: node scripts/promote-assessment-item.mjs --item=ITEM-... --to=pilot|active [--write --confirm]');
if (!['pilot', 'active'].includes(target)) throw new Error('--to must be pilot or active');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(dir, name)));
}

const questionDir = path.join(root, 'content/questions');
const questionFile = fs.readdirSync(questionDir).find((name) => {
  if (!name.endsWith('.json')) return false;
  return readJson(path.join(questionDir, name)).id === itemId;
});
if (!questionFile) throw new Error(`Unknown assessment item ${itemId}`);
const file = path.join(questionDir, questionFile);
const item = readJson(file);
const reviews = readDirJson('content/reviews');
const pilots = readDirJson('content/pilot-evidence');

const approvedReview = reviews.find((review) =>
  review.objectId === item.id &&
  String(review.objectVersion) === String(item.version) &&
  review.reviewType === 'assessment' &&
  review.status === 'approved'
) ?? null;
const matchingPilots = pilots.filter((record) =>
  record.itemId === item.id && String(record.itemVersion) === String(item.version) && record.status !== 'invalidated'
);
const completePilot = matchingPilots.find((record) => record.status === 'complete') ?? null;

const errors = [];
if (!approvedReview) errors.push(`${item.id}@${item.version} is missing approved assessment review evidence`);
if (target === 'pilot' && matchingPilots.length === 0) errors.push(`${item.id}@${item.version} has no registered pilot evidence record`);
if (target === 'active' && !completePilot) errors.push(`${item.id}@${item.version} has no complete pilot evidence record`);
if (['flagged', 'retired'].includes(item.status)) errors.push(`${item.id} cannot be promoted from status ${item.status}`);
if (target === 'pilot' && item.status === 'active') errors.push(`${item.id} is already active and cannot be demoted to pilot by this tool`);

const result = {
  item: item.id,
  version: item.version,
  from: item.status,
  to: target,
  approvedReview: approvedReview?.id ?? null,
  pilotRecords: matchingPilots.map((record) => ({id: record.id, status: record.status, sampleSize: record.sampleSize ?? null})),
  completePilot: completePilot?.id ?? null,
  eligible: errors.length === 0,
  errors
};
console.log(JSON.stringify(result, null, 2));

if (errors.length) process.exit(1);
if (!write) process.exit(0);
if (!confirm) throw new Error('Refusing to change item lifecycle without --confirm.');
if (item.status === target) {
  console.error(`${item.id} is already ${target}; no file change required.`);
  process.exit(0);
}

item.status = target;
fs.writeFileSync(file, `${JSON.stringify(item, null, 2)}\n`);
console.error(`Promoted ${item.id}@${item.version} from ${result.from} to ${target}. Run npm run pilot:validate and the full test suite before commit.`);
