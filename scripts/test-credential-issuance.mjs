import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function run(args) {
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}

const issued = run(['scripts/issue-test-credential.mjs', '--test', '--input=tests/fixtures/eligibility-pass.json']);
if (issued.status !== 0) throw new Error(`Expected test issuance to succeed.\n${issued.stdout}\n${issued.stderr}`);
const record = JSON.parse(issued.stdout);
if (record.status !== 'test-issued') throw new Error('Issued record did not use test-issued status');
if (!record.subjectId?.startsWith('SUBJECT-')) throw new Error('Issued record did not use opaque subject ID');

const tempPath = path.join(os.tmpdir(), 'thc-test-credential.json');
fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));
const verified = run(['scripts/verify-test-credential.mjs', `--input=${tempPath}`]);
if (verified.status !== 0) throw new Error(`Expected verification to succeed.\n${verified.stdout}\n${verified.stderr}`);
const verifyResult = JSON.parse(verified.stdout);
if (!verifyResult.valid) throw new Error('Verifier returned valid=false for untampered record');

const rejected = run(['scripts/issue-test-credential.mjs', '--test', '--input=tests/fixtures/eligibility-fail.json']);
if (rejected.status === 0) throw new Error('Expected below-threshold learner evidence to be rejected for issuance');

record.assessmentEvidence[0].scorePercent = 100;
fs.writeFileSync(tempPath, JSON.stringify(record, null, 2));
const tampered = run(['scripts/verify-test-credential.mjs', `--input=${tempPath}`]);
if (tampered.status !== 2) throw new Error('Expected tampered credential verification to fail');

console.log('Test credential issuance and verification tests passed.');
