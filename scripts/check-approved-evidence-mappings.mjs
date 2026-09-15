import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const approvedDir = path.join(root, 'automation/curriculum-ingestion/reviews/approved');
const promotionScript = path.join(root, 'scripts/promote-evidence-mapping.mjs');

if (!fs.existsSync(approvedDir)) {
  console.log('Approved evidence mapping check passed for 0 review record(s).');
  process.exit(0);
}

const files = fs.readdirSync(approvedDir)
  .filter((name) => name.endsWith('.json'))
  .sort();
const failures = [];

for (const name of files) {
  const rel = path.join('automation/curriculum-ingestion/reviews/approved', name);
  const result = spawnSync(process.execPath, [promotionScript, `--review=${rel}`], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    failures.push(`${rel}: ${`${result.stderr}\n${result.stdout}`.trim()}`);
  }
}

if (failures.length) {
  console.error(`Approved evidence mapping check failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Approved evidence mapping check passed for ${files.length} review record(s).`);
