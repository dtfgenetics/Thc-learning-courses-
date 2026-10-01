import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!inputArg) throw new Error('Usage: node scripts/project-public-verification.mjs --input=<issued-credential.json>');

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const record = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const definitionId = record.credentialDefinition ?? record.credentialDefinitionId;
if (!/^CRED-[A-Z0-9-]+$/.test(String(definitionId ?? ''))) throw new Error('Issued credential is missing a valid credential definition ID');
const definition = JSON.parse(fs.readFileSync(path.join(root, `content/credentials/${definitionId}.json`), 'utf8'));
const valid = ['test-issued', 'issued', 'valid'].includes(record.status);

const output = {
  verificationId: record.verificationId,
  valid,
  status: record.status,
  credential: {
    id: definition.id,
    title: definition.title,
    version: record.credentialVersion ?? record.credentialDefinitionVersion ?? definition.version,
    role: definition.role ?? null,
    description: definition.publicDescription ?? null
  },
  issuer: {
    name: record.issuer?.name ?? 'Teaching Healthy Cultivation',
    url: record.issuer?.url ?? 'https://dtfseeds.com/'
  },
  issuedAt: record.issuedAt ?? null,
  evidenceSummary: record.publicEvidenceSummary ?? null,
  limitations: definition.limitations ?? [],
  disclaimer: record.disclaimer ?? null
};

console.log(JSON.stringify(output, null, 2));
