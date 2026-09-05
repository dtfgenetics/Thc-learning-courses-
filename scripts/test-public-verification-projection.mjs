import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function run(args) {
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}

const issued = run(['scripts/issue-test-credential.mjs', '--test', '--input=tests/fixtures/eligibility-pass.json']);
if (issued.status !== 0) throw new Error(`Test credential issuance failed.\n${issued.stdout}\n${issued.stderr}`);
const record = JSON.parse(issued.stdout);
const tempPath = path.join(os.tmpdir(), 'thc-public-projection-source.json');
fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));

const projected = run(['scripts/project-public-verification.mjs', `--input=${tempPath}`]);
if (projected.status !== 0) throw new Error(`Public projection failed.\n${projected.stdout}\n${projected.stderr}`);
const result = JSON.parse(projected.stdout);

for (const forbidden of ['subjectId', 'assessmentEvidence', 'integrityHash']) {
  if (Object.prototype.hasOwnProperty.call(result, forbidden)) throw new Error(`Public verification leaked forbidden field ${forbidden}`);
}
if (!result.verificationId || !result.credential?.title || !result.issuer?.name) throw new Error('Public verification omitted required safe fields');

console.log('Public verification projection privacy tests passed.');
