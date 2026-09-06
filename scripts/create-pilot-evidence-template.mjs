import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).filter((x) => x.startsWith('--') && x.includes('=')).map((x) => {
  const [key, ...rest] = x.slice(2).split('=');
  return [key, rest.join('=')];
}));
const itemId = args.item;
const analystId = args.analyst;
const write = process.argv.includes('--write');
if (!itemId) throw new Error('Usage: npm run pilot:template -- --item=ITEM-... --analyst=<reviewer-id> [--write]');
if (!analystId || analystId.length < 3) throw new Error('--analyst must be at least 3 characters');

const questionsDir = path.join(root, 'content/questions');
const file = fs.readdirSync(questionsDir).find((name) => name.endsWith('.json') && JSON.parse(fs.readFileSync(path.join(questionsDir, name), 'utf8')).id === itemId);
if (!file) throw new Error(`Unknown assessment item ${itemId}`);
const item = JSON.parse(fs.readFileSync(path.join(questionsDir, file), 'utf8'));
const record = {
  id: `PILOT-${item.id}-V${item.version}`,
  itemId: item.id,
  itemVersion: item.version,
  status: 'draft',
  sampleSize: 0,
  percentCorrect: null,
  discrimination: null,
  distractorSelection: (item.choices ?? []).map((_, choiceIndex) => ({choiceIndex, count: 0, proportion: 0})),
  omitRate: null,
  medianResponseTimeSeconds: null,
  responseTimeAnomalyRate: null,
  challengeHistory: [],
  analystId,
  completedAt: null,
  notes: null
};
const output = `${JSON.stringify(record, null, 2)}\n`;
if (write) {
  const dir = path.join(root, 'content/pilot-evidence');
  fs.mkdirSync(dir, {recursive:true});
  const target = path.join(dir, `${record.id}.json`);
  if (fs.existsSync(target)) throw new Error(`Pilot evidence already exists: ${path.relative(root, target)}`);
  fs.writeFileSync(target, output);
  console.error(`Created ${path.relative(root, target)}`);
}
process.stdout.write(output);
