import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!process.argv.includes('--test') || !inputArg) {
  throw new Error('Test issuer requires --test and --input=<learner-evidence.json>. Production issuance is intentionally unavailable.');
}

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const evidence = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const credential = JSON.parse(fs.readFileSync(path.join(root, 'content/credentials/CRED-CULT-FOUNDATIONS-001.json'), 'utf8'));

const required = credential.eligibility.requiredAssessments ?? [];
const passed = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));
const missing = [];
for (const id of required) {
  const row = passed.get(id);
  if (!row || row.status !== 'passed' || Number(row.scorePercent) < Number(credential.eligibility.minimumPassingScorePercent)) {
    missing.push(id);
  }
}
if (missing.length) throw new Error(`Credential eligibility failed for required assessment(s): ${missing.join(', ')}`);

const subjectSource = String(evidence.learnerId ?? 'synthetic-subject');
const subjectId = `SUBJECT-${crypto.createHash('sha256').update(subjectSource).digest('hex').slice(0, 16).toUpperCase()}`;
const verificationId = crypto.createHash('sha256').update(`${subjectId}:${credential.id}:${credential.version}`).digest('hex').slice(0, 24).toUpperCase();

const record = {
  id: `TEST-CREDENTIAL-${verificationId}`,
  credentialDefinition: credential.id,
  credentialVersion: credential.version,
  subjectId,
  status: 'test-issued',
  issuedAt: '2026-09-05T00:00:00.000Z',
  verificationId,
  assessmentEvidence: required.map((id) => ({
    assessmentId: id,
    scorePercent: Number(passed.get(id).scorePercent),
    status: 'passed'
  })),
  issuer: {
    name: 'Teaching Healthy Cultivation',
    url: 'https://dtfseeds.com/'
  },
  disclaimer: 'Test educational credential only. Not a state cannabis license, occupational license, government certification, or authorization to cultivate, manufacture, possess, distribute, or sell cannabis.',
  integrityHash: ''
};

record.integrityHash = crypto.createHash('sha256').update(JSON.stringify({ ...record, integrityHash: undefined })).digest('hex');
console.log(JSON.stringify(record, null, 2));
