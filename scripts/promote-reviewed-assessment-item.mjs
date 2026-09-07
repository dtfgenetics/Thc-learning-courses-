#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { evaluateAssessmentItemPromotion } from './lib/assessment-item-promotion.mjs';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).filter((arg) => arg.startsWith('--') && arg.includes('=')).map((arg) => {
  const [key, ...rest] = arg.slice(2).split('=');
  return [key, rest.join('=')];
}));
const write = process.argv.includes('--write');
const objectId = String(args.object ?? '').trim();
if (!/^ITEM-[A-Z0-9-]+$/.test(objectId)) throw new Error('Use --object=ITEM-... to select one assessment item.');

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

const itemPath = path.join(root, 'content/questions', `${objectId}.json`);
if (!fs.existsSync(itemPath)) throw new Error(`Assessment item ${objectId} does not exist.`);
const item = JSON.parse(fs.readFileSync(itemPath, 'utf8'));
const reviews = readDirJson('content/reviews');
const referenceIds = new Set(readDirJson('content/references').map((reference) => reference.id));
const result = evaluateAssessmentItemPromotion({ item, reviews, referenceIds });

if (!result.eligible) {
  console.error(`Assessment item ${objectId}@${item.version} is not eligible for activation:`);
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exit(1);
}

const output = {
  objectId,
  objectVersion: item.version,
  fromStatus: item.status,
  toStatus: 'active',
  approvedReviewId: result.approvedReviewId,
  write
};

if (write) {
  fs.writeFileSync(itemPath, `${JSON.stringify(result.promoted, null, 2)}\n`);
  output.message = 'Item activated. Run the full review, schema, duplicate, objective-coverage, item-bank, and curriculum quality gates before merge.';
} else {
  output.message = 'Dry run only. Re-run with --write after reviewing this promotion evidence.';
}

console.log(JSON.stringify(output, null, 2));
