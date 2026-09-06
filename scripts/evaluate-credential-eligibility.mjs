import fs from 'node:fs';
import path from 'node:path';

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

const missing = [];
const passedAssessments = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));

for (const requiredId of credential.eligibility.requiredAssessments ?? []) {
  const result = passedAssessments.get(requiredId);
  if (!result) {
    missing.push({ type: 'assessment', id: requiredId, reason: 'missing-result' });
    continue;
  }
  if (result.status !== 'passed') {
    missing.push({ type: 'assessment', id: requiredId, reason: 'not-passed' });
    continue;
  }
  if (Number(result.scorePercent) < Number(credential.eligibility.minimumPassingScorePercent)) {
    missing.push({ type: 'assessment', id: requiredId, reason: 'below-minimum-score', required: credential.eligibility.minimumPassingScorePercent, actual: result.scorePercent });
  }
}

const performance = new Map((evidence.performanceAssessments ?? []).map((row) => [row.assessmentId, row]));
for (const requiredId of credential.eligibility.requiredPerformanceAssessments ?? []) {
  const result = performance.get(requiredId);
  if (!result) {
    missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-result' });
    continue;
  }
  if (result.status !== 'passed') {
    missing.push({ type: 'performance-assessment', id: requiredId, reason: 'not-passed' });
    continue;
  }
  if (credential.eligibility.requireNoCriticalErrors === true && Number(result.criticalErrorCount ?? 0) > 0) {
    missing.push({ type: 'performance-assessment', id: requiredId, reason: 'critical-error', actual: Number(result.criticalErrorCount ?? 0) });
  }
}

const artifacts = new Map((evidence.portfolioArtifacts ?? []).map((row) => [row.artifactId, row]));
for (const requiredId of credential.eligibility.requiredPortfolioArtifacts ?? []) {
  const result = artifacts.get(requiredId);
  if (!result) {
    missing.push({ type: 'portfolio-artifact', id: requiredId, reason: 'missing-artifact' });
    continue;
  }
  if (!['accepted', 'verified', 'complete'].includes(result.status)) {
    missing.push({ type: 'portfolio-artifact', id: requiredId, reason: 'artifact-not-accepted' });
  }
}

const output = {
  credentialId: credential.id,
  credentialVersion: credential.version,
  learnerId: evidence.learnerId ?? null,
  eligible: missing.length === 0,
  requirementSummary: {
    writtenAssessments: (credential.eligibility.requiredAssessments ?? []).length,
    performanceAssessments: (credential.eligibility.requiredPerformanceAssessments ?? []).length,
    portfolioArtifacts: (credential.eligibility.requiredPortfolioArtifacts ?? []).length
  },
  missingRequirements: missing
};

console.log(JSON.stringify(output, null, 2));
if (!output.eligible) process.exitCode = 2;
