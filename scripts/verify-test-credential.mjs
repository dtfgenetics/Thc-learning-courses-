import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!inputArg) throw new Error('Usage: node scripts/verify-test-credential.mjs --input=<credential-record.json>');

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const record = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const expectedHash = crypto.createHash('sha256').update(JSON.stringify({ ...record, integrityHash: undefined })).digest('hex');
const validHash = expectedHash === record.integrityHash;
const recognizedStatus = ['test-issued', 'issued', 'valid'].includes(record.status);

console.log(JSON.stringify({
  verificationId: record.verificationId ?? null,
  valid: validHash && recognizedStatus,
  status: record.status ?? null,
  credentialDefinition: record.credentialDefinition ?? null,
  credentialVersion: record.credentialVersion ?? null,
  issuer: record.issuer?.name ?? null,
  reason: !validHash ? 'integrity-check-failed' : (!recognizedStatus ? 'credential-not-currently-valid' : null)
}, null, 2));

if (!(validHash && recognizedStatus)) process.exitCode = 2;
