import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { evaluateCredentialEligibility } from '../packages/domain/credential-eligibility.mjs';
import { loadRequiredPerformanceDefinitions } from './lib/load-performance-definitions.mjs';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
const credentialArg = process.argv.find((arg) => arg.startsWith('--credential='));
if (!process.argv.includes('--test') || !inputArg) {
  throw new Error('Test issuer requires --test and --input=<learner-evidence.json>. Production issuance is intentionally unavailable.');
}

const inputValue = inputArg.slice('--input='.length);
const inputPath = path.isAbsolute(inputValue) ? inputValue : path.join(root, inputValue);
const evidence = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const credentialId = credentialArg ? credentialArg.slice('--credential='.length) : 'CRED-CULT-FOUNDATIONS-001';
if (!/^CRED-[A-Z0-9-]+$/.test(credentialId)) throw new Error(`Invalid credential ID ${credentialId}`);
const credential = JSON.parse(fs.readFileSync(path.join(root, `content/credentials/${credentialId}.json`), 'utf8'));
const performanceDefinitions = loadRequiredPerformanceDefinitions({ root, credential });
const eligibility = evaluateCredentialEligibility({ credential, evidence, performanceDefinitions });
if (!eligibility.eligible) {
  const details = eligibility.missingRequirements.map((row) => `${row.id}:${row.reason}`).join(', ');
  throw new Error(`Credential eligibility failed for required evidence: ${details}`);
}

const required = credential.eligibility.requiredAssessments ?? [];
const passed = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));
const performance = new Map((evidence.performanceAssessments ?? []).map((row) => [row.assessmentId, row]));
const artifacts = new Map((evidence.portfolioArtifacts ?? []).map((row) => [row.artifactId, row]));

const subjectSource = String(evidence.learnerId ?? 'synthetic-subject');
const subjectId = `SUBJECT-${crypto.createHash('sha256').update(subjectSource).digest('hex').slice(0, 16).toUpperCase()}`;
const verificationId = crypto.createHash('sha256').update(`${subjectId}:${credential.id}:${credential.version}`).digest('hex').slice(0, 24).toUpperCase();
const performanceEvidence = (credential.eligibility.requiredPerformanceAssessments ?? []).map((id) => ({
  assessmentId: id,
  scorePercent: performance.get(id)?.scorePercent == null ? null : Number(performance.get(id).scorePercent),
  status: 'passed',
  criticalErrorCount: Number(performance.get(id)?.criticalErrorCount ?? 0),
  evidenceVerified: performance.get(id)?.evidenceVerified === true
}));
const portfolioEvidence = (credential.eligibility.requiredPortfolioArtifacts ?? []).map((id) => ({ artifactId: id, status: artifacts.get(id).status }));

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
  performanceEvidence,
  portfolioEvidence,
  publicEvidenceSummary: {
    writtenAssessments: required.length,
    performanceAssessments: performanceEvidence.length,
    portfolioArtifacts: portfolioEvidence.length
  },
  issuer: {
    name: 'Teaching Healthy Cultivation',
    url: 'https://dtfseeds.com/'
  },
  disclaimer: 'Test educational credential only. Not a state cannabis license, occupational license, government certification, or authorization to cultivate, manufacture, possess, distribute, or sell cannabis.',
  integrityHash: ''
};

record.integrityHash = crypto.createHash('sha256').update(JSON.stringify({ ...record, integrityHash: undefined })).digest('hex');
console.log(JSON.stringify(record, null, 2));
