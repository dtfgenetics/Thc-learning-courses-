import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
if (!inputArg) throw new Error('Usage: node scripts/evaluate-credential-eligibility.mjs --input=<learner-evidence.json>');

const inputPath = inputArg.slice('--input='.length);
const evidence = JSON.parse(fs.readFileSync(path.join(root, inputPath), 'utf8'));
const credential = JSON.parse(fs.readFileSync(path.join(root, 'content/credentials/CRED-CULT-FOUNDATIONS-001.json'), 'utf8'));

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

const output = {
  credentialId: credential.id,
  credentialVersion: credential.version,
  learnerId: evidence.learnerId ?? null,
  eligible: missing.length === 0,
  missingRequirements: missing
};

console.log(JSON.stringify(output, null, 2));
if (!output.eligible) process.exitCode = 2;
