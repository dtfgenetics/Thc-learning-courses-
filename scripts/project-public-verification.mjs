import fs from 'node:fs';
import path from 'node:path';
import { publicCredentialView } from '../packages/domain/credential-runtime.mjs';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!inputArg) throw new Error('Usage: node scripts/project-public-verification.mjs --input=<issued-credential.json>');

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const record = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const definitionId = record.credentialDefinition ?? record.credentialDefinitionId;
if (!/^CRED-[A-Z0-9-]+$/.test(String(definitionId ?? ''))) throw new Error('Issued credential is missing a valid credential definition ID');
const definition = JSON.parse(fs.readFileSync(path.join(root, `content/credentials/${definitionId}.json`), 'utf8'));
const statusHistory = Array.isArray(record.statusHistory) ? record.statusHistory : [];
const projected = publicCredentialView({
  ...record,
  credentialDefinitionVersion: record.credentialDefinitionVersion ?? record.credentialVersion,
  payloadJson: {
    ...(record.payloadJson ?? {}),
    issuer: record.issuer ?? record.payloadJson?.issuer ?? null,
    publicEvidenceSummary: record.publicEvidenceSummary ?? record.payloadJson?.publicEvidenceSummary ?? null
  }
}, definition, { statusHistory });

const output = {
  ...projected,
  valid: ['test-issued', 'issued', 'valid'].includes(record.status)
};

console.log(JSON.stringify(output, null, 2));
