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
  { status:'valid', actorId:'PRIVATE-SYSTEM', reason:'PRIVATE-ISSUANCE', createdAt:'2026-09-05T00:01:00.000Z' }
];
const tempPath = path.join(os.tmpdir(), 'thc-public-projection-source.json');
fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));

const projected = run(['scripts/project-public-verification.mjs', `--input=${tempPath}`]);
if (projected.status !== 0) throw new Error(`Public projection failed.\n${projected.stdout}\n${projected.stderr}`);
const result = JSON.parse(projected.stdout);

for (const forbidden of ['subjectId', 'assessmentEvidence', 'integrityHash', 'actorId', 'reason']) {
  if (Object.prototype.hasOwnProperty.call(result, forbidden)) throw new Error(`Public verification leaked forbidden field ${forbidden}`);
}
const serialized = JSON.stringify(result);
for (const forbiddenValue of ['PRIVATE-SYSTEM','PRIVATE-ISSUANCE']) {
  if (serialized.includes(forbiddenValue)) throw new Error(`Public verification leaked private lifecycle value ${forbiddenValue}`);
}
if (!result.verificationId || !result.credential?.title || !result.issuer?.name) throw new Error('Public verification omitted required safe fields');
if (!result.credential?.version || !result.credential?.currentDefinitionVersion) throw new Error('Public verification omitted credential version evidence');
if (!result.lifecycle || result.lifecycle.validityType !== 'indefinite') throw new Error('Public verification omitted lifecycle policy');
if (!Array.isArray(result.statusHistory) || result.statusHistory.length !== 1) throw new Error('Public verification omitted sanitized status history');
if (result.valid !== true) throw new Error('Issued/valid educational credential should project valid=true');

const suspendedPath = path.join(os.tmpdir(), 'thc-public-projection-suspended.json');
fs.writeFileSync(suspendedPath, JSON.stringify({ ...record, status:'suspended' }, null, 2));
const suspendedProjection = run(['scripts/project-public-verification.mjs', `--input=${suspendedPath}`]);
if (suspendedProjection.status !== 0) throw new Error(`Suspended public projection failed.\n${suspendedProjection.stdout}\n${suspendedProjection.stderr}`);
if (JSON.parse(suspendedProjection.stdout).valid !== false) throw new Error('Suspended credential must not project valid=true');

console.log('Public verification lifecycle, version and privacy tests passed.');
