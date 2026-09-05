import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!inputArg) throw new Error('Usage: node scripts/project-public-verification.mjs --input=<issued-credential.json>');

const record = JSON.parse(fs.readFileSync(path.join(root, inputArg.slice('--input='.length)), 'utf8'));
const definition = JSON.parse(fs.readFileSync(path.join(root, 'content/credentials/CRED-CULT-FOUNDATIONS-001.json'), 'utf8'));
const valid = ['test-issued', 'issued', 'valid'].includes(record.status);

const output = {
  verificationId: record.verificationId,
  valid,
  status: record.status,
  credential: {
    id: definition.id,
    title: definition.title,
    version: record.credentialVersion
  },
  issuer: {
    name: record.issuer?.name ?? 'Teaching Healthy Cultivation',
    url: record.issuer?.url ?? 'https://dtfseeds.com/'
  },
  issuedAt: record.issuedAt ?? null,
  disclaimer: record.disclaimer ?? null
};

console.log(JSON.stringify(output, null, 2));
