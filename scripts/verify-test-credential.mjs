import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!inputArg) throw new Error('Usage: node scripts/verify-test-credential.mjs --input=<credential-record.json>');

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const record = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/issued-credential.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateRecord = ajv.compile(schema);
const schemaValid = validateRecord(record);

const expectedHash = crypto.createHash('sha256').update(JSON.stringify({ ...record, integrityHash: undefined })).digest('hex');
const validHash = expectedHash === record.integrityHash;
const recognizedStatus = ['test-issued', 'issued', 'valid'].includes(record.status);
const valid = schemaValid && validHash && recognizedStatus;
let reason = null;
if (!schemaValid) reason = 'invalid-record-schema';
else if (!validHash) reason = 'integrity-check-failed';
else if (!recognizedStatus) reason = 'credential-not-currently-valid';

console.log(JSON.stringify({
  verificationId: record.verificationId ?? null,
  valid,
  status: record.status ?? null,
  credentialDefinition: record.credentialDefinition ?? null,
  credentialVersion: record.credentialVersion ?? null,
  issuer: record.issuer?.name ?? null,
  reason,
  schemaErrors: schemaValid ? [] : (validateRecord.errors ?? []).map((issue) => ({
    path: issue.instancePath || '/',
    message: issue.message
  }))
}, null, 2));

if (!valid) process.exitCode = 2;
