import fs from 'node:fs';
import path from 'node:path';
import { evaluateCredentialEligibility } from '../packages/domain/credential-eligibility.mjs';
import { loadRequiredPerformanceDefinitions } from '../packages/domain/performance-definitions.mjs';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
const credentialArg = process.argv.find((arg) => arg.startsWith('--credential='));
if (!inputArg) throw new Error('Usage: node scripts/evaluate-credential-eligibility.mjs --input=<learner-evidence.json> [--credential=CRED-...]');

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const evidence = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const credentialId = credentialArg ? credentialArg.slice('--credential='.length) : 'CRED-CULT-FOUNDATIONS-001';
if (!/^CRED-[A-Z0-9-]+$/.test(credentialId)) throw new Error(`Invalid credential ID ${credentialId}`);
const credential = JSON.parse(fs.readFileSync(path.join(root, `content/credentials/${credentialId}.json`), 'utf8'));
const performanceDefinitions = loadRequiredPerformanceDefinitions({ root, credential });
const output = evaluateCredentialEligibility({ credential, evidence, performanceDefinitions });

console.log(JSON.stringify(output, null, 2));
if (!output.eligible) process.exitCode = 2;
