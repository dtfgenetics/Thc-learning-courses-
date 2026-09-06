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
record.statusHistory = [
  { status: 'valid', actorId: 'PRIVATE-SYSTEM', reason: 'initial-validation', createdAt: '2026-09-01T12:00:00.000Z' },
  { status: 'suspended', actorId: 'PRIVATE-ADMIN', reason: 'private-review', createdAt: '2026-09-02T12:00:00.000Z' },
  { status: 'valid', actorId: 'PRIVATE-ADMIN', reason: 'private-cleared', createdAt: '2026-09-03T12:00:00.000Z' }
];
const tempPath = path.join(os.tmpdir(), 'thc-public-projection-source.json');
fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));

const projected = run(['scripts/project-public-verification.mjs', `--input=${tempPath}`]);
if (projected.status !== 0) throw new Error(`Public projection failed.\n${projected.stdout}\n${projected.stderr}`);
const result = JSON.parse(projected.stdout);

for (const forbidden of ['subjectId', 'assessmentEvidence', 'integrityHash', 'PRIVATE-SYSTEM', 'PRIVATE-ADMIN', 'private-review', 'private-cleared', 'actorId', 'reason']) {
  if (JSON.stringify(result).includes(forbidden)) throw new Error(`Public verification leaked forbidden field/value ${forbidden}`);
}
if (!result.verificationId || !result.credential?.title || !result.issuer?.name) throw new Error('Public verification omitted required safe fields');
if (result.credential.currentDefinitionVersion == null) throw new Error('Public verification omitted current credential definition version');
if (!result.lifecycle || result.lifecycle.validityType == null) throw new Error('Public verification omitted lifecycle policy');
if (!Array.isArray(result.statusHistory) || result.statusHistory.length !== 3) throw new Error('Public verification omitted sanitized status history');
if (result.statusHistory.some((event) => !event.status || !event.createdAt)) throw new Error('Public status history omitted safe status/timestamp fields');

console.log('Public verification lifecycle projection privacy tests passed.');
