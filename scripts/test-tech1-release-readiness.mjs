import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/report-tech1-release-readiness.mjs'], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr || 'release readiness reporter should execute');
const result = JSON.parse(run.stdout);

assert.equal(result.structureValid, true, `Technician I release-readiness structure must resolve cleanly: ${JSON.stringify(result.malformed)}`);
assert.equal(result.releaseReady, false, 'Technician I must remain release-blocked until real validation evidence and final approval exist');
assert.equal(result.summary.requiredCourses, 7);
assert.equal(result.summary.practicals, 6);
assert.equal(result.summary.capstone, 'CAPSTONE-TECH1-SHIFT-001');
assert.equal(result.summary.credentialAssessment, 'ASSESS-CRED-TECH1-001');
assert.equal(result.summary.publicCredentialAssessmentItems, 0, 'public credential blueprint must contain zero operational secure items');

const reasons = new Set(result.blockers.map((row) => row.reason));
for (const reason of [
  'program-status-not-approved',
  'program-validation-jobTaskAnalysis-incomplete',
  'program-validation-smeEmployerValidation-incomplete',
  'program-validation-assessmentReview-incomplete',
  'program-validation-accessibilityReview-incomplete',
  'standard-setting-incomplete',
  'release-gate-humanTechnicalReview-incomplete',
  'release-gate-humanAssessmentReview-incomplete',
  'release-gate-renderedAccessibilityReview-incomplete',
  'release-gate-controlledPilotEvidence-incomplete',
  'release-gate-practicalValidation-incomplete',
  'release-gate-capstoneValidation-incomplete',
  'release-gate-evaluatorCalibration-incomplete',
  'release-gate-interRaterEvidence-incomplete',
  'release-gate-blueprintWeightsFinalization-incomplete',
  'release-gate-secureOperationalItemBank-incomplete',
  'release-gate-secureAssessmentStore-incomplete',
  'release-gate-equivalentSecureForms-incomplete',
  'release-gate-formalStandardSetting-incomplete',
  'release-gate-candidateEvidenceRetentionPrivacyPolicy-incomplete',
  'release-gate-credentialIssuanceWorkflowApproval-incomplete',
  'release-gate-finalProgramReleaseApproval-incomplete',
  'secure-capstone-form-not-approved',
  'practical-set-not-validated'
]) {
  assert.ok(reasons.has(reason), `missing expected fail-closed blocker ${reason}`);
}

const assessment = JSON.parse(fs.readFileSync('content/assessments/ASSESS-CRED-TECH1-001.json', 'utf8'));
assert.equal(assessment.status, 'draft');
assert.equal(assessment.purpose, 'credential');
assert.deepEqual(assessment.items, []);
assert.equal(assessment.extensions?.operationalUseAuthorized, false);
assert.equal(assessment.extensions?.publicRepositoryItemsMayBeUsedForOperationalCredentialForms, false);
assert.equal(assessment.extensions?.secureOperationalItemBankRequired, true);

console.log(`Technician I release readiness passed: structure resolves and issuance remains fail-closed behind ${result.blockers.length} explicit blocker(s).`);
