import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { evaluateCredentialEligibility } from '../packages/domain/credential-eligibility.mjs';

const credential = JSON.parse(fs.readFileSync('content/credentials/CRED-CULT-FOUNDATIONS-001.json', 'utf8'));
const passEvidence = JSON.parse(fs.readFileSync('tests/fixtures/eligibility-pass.json', 'utf8'));
const failEvidence = JSON.parse(fs.readFileSync('tests/fixtures/eligibility-fail.json', 'utf8'));

function run(input) {
  return spawnSync(process.execPath, ['scripts/evaluate-credential-eligibility.mjs', `--input=${input}`], { encoding: 'utf8' });
}

const draftRun = run('tests/fixtures/eligibility-pass.json');
assert.equal(draftRun.status, 2, 'validation-pending credential must fail closed even when learner requirements are satisfied');
const draftResult = JSON.parse(draftRun.stdout);
assert.equal(draftResult.requirementsSatisfied, true);
assert.equal(draftResult.releaseAuthorized, false);
assert.equal(draftResult.eligible, false);
for (const reason of [
  'credential-definition-not-approved',
  'human-review-incomplete',
  'accessibility-review-incomplete',
  'pilot-incomplete',
  'standard-setting-incomplete',
  'release-approval-missing',
  'certification-use-not-authorized'
]) {
  assert.ok(draftResult.releaseBlockers.some((row) => row.reason === reason), `missing release blocker ${reason}`);
}

const authorizedCredential = structuredClone(credential);
authorizedCredential.status = 'approved';
authorizedCredential.governance = {
  certificationUseStatus: 'authorized',
  humanReviewStatus: 'complete',
  accessibilityReviewStatus: 'complete',
  pilotStatus: 'complete',
  standardSettingStatus: 'complete',
  releaseApprovalStatus: 'approved'
};

const passResult = evaluateCredentialEligibility({ credential: authorizedCredential, evidence: passEvidence });
assert.equal(passResult.requirementsSatisfied, true);
assert.equal(passResult.releaseAuthorized, true);
assert.equal(passResult.eligible, true);

const failResult = evaluateCredentialEligibility({ credential: authorizedCredential, evidence: failEvidence });
assert.equal(failResult.eligible, false);
assert.ok(failResult.missingRequirements.some((row) => row.reason === 'below-minimum-score'));

const wrongVersion = structuredClone(passEvidence);
wrongVersion.courseCompletions[0].courseVersion = '1.0.0';
const wrongVersionResult = evaluateCredentialEligibility({ credential: authorizedCredential, evidence: wrongVersion });
assert.equal(wrongVersionResult.eligible, false);
assert.ok(wrongVersionResult.missingRequirements.some((row) => row.reason === 'course-version-mismatch'));

const noCompletion = structuredClone(passEvidence);
noCompletion.courseCompletions = [];
const noCompletionResult = evaluateCredentialEligibility({ credential: authorizedCredential, evidence: noCompletion });
assert.equal(noCompletionResult.eligible, false);
assert.ok(noCompletionResult.missingRequirements.some((row) => row.reason === 'missing-course-completion'));

const missingScore = structuredClone(passEvidence);
delete missingScore.assessments[0].scorePercent;
const missingScoreResult = evaluateCredentialEligibility({ credential: authorizedCredential, evidence: missingScore });
assert.equal(missingScoreResult.eligible, false);
assert.ok(missingScoreResult.missingRequirements.some((row) => row.reason === 'missing-score'));

console.log('Credential eligibility tests passed: learner requirements, course-version evidence, and release governance all fail closed.');
