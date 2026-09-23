import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateCredentialEligibility } from '../packages/domain/credential-eligibility.mjs';

const root = process.cwd();
const credentialsDir = path.join(root, 'content/credentials');
const courseDir = path.join(root, 'content/courses');
const files = fs.readdirSync(credentialsDir).filter((name) => name.endsWith('.json')).sort();
const candidateControls = JSON.parse(fs.readFileSync(path.join(root, 'registry/candidate-governance-controls.json'), 'utf8'));
assert.ok(files.length > 0, 'credential inventory must not be empty');
assert.ok(['approval-pending','approved'].includes(candidateControls.status), 'candidate governance status must be approval-pending or approved');
assert.equal(candidateControls.controls?.retest?.remediationRequiredBeforeRetest, true);
assert.equal(candidateControls.controls?.retest?.equivalentSecureFormOrVariantRequired, true);
assert.equal(candidateControls.controls?.retest?.criticalFailureNonCompensatory, true);

if (candidateControls.operationalUseAuthorized === true) {
  assert.equal(candidateControls.status, 'approved', 'operational candidate governance requires approved registry status');
  assert.ok(candidateControls.appliedApprovalRecordId, 'operational candidate governance must record applied approval provenance');
  assert.notEqual(candidateControls.controls?.retest?.finalAttemptLimit, null, 'approved operational retest policy must be explicit');
  assert.notEqual(candidateControls.controls?.retest?.waitingPeriodHours, null, 'approved operational waiting-period policy must be explicit');
  assert.notEqual(candidateControls.controls?.retest?.feePolicy, null, 'approved operational fee policy must be explicit');
  assert.equal(candidateControls.controls?.privacyRetention?.retentionScheduleApproved, true, 'approved operational governance requires a retention schedule');
  assert.ok(Object.values(candidateControls.controls?.privacyRetention?.retentionPeriods ?? {}).every((value) => value !== null && value !== ''), 'approved retention periods must be explicit');
} else {
  assert.equal(candidateControls.status, 'approval-pending', 'unapplied candidate governance must remain approval-pending');
  assert.equal(candidateControls.controls?.retest?.finalAttemptLimit, null, 'unapproved retest limits must not be invented');
  assert.equal(candidateControls.controls?.retest?.waitingPeriodHours, null, 'unapproved waiting periods must not be invented');
  assert.equal(candidateControls.controls?.retest?.feePolicy, null, 'unapproved fee policy must not be invented');
  assert.equal(candidateControls.controls?.privacyRetention?.retentionScheduleApproved, false, 'retention schedule must remain open until approved');
  assert.ok(Object.values(candidateControls.controls?.privacyRetention?.retentionPeriods ?? {}).every((value) => value === null), 'unapproved retention periods must remain unset');
}
assert.equal(candidateControls.controls?.accommodation?.constructPreservationRequired, true);
assert.equal(candidateControls.controls?.accommodation?.minimumNecessaryAssessorDisclosure, true);
assert.equal(candidateControls.controls?.appeal?.preserveOriginalRecord, true);
assert.equal(candidateControls.controls?.appeal?.secureAnswerKeyDisclosureAllowed, false);
assert.equal(candidateControls.controls?.securityIncident?.silentEvidenceMutationAllowed, false);
assert.equal(candidateControls.controls?.publicVerification?.rawScoresPublicByDefault, false);
assert.equal(candidateControls.controls?.publicVerification?.secureItemsPublic, false);
for (const source of candidateControls.sourceDrafts ?? []) {
  assert.ok(fs.existsSync(path.join(root, source)), `candidate governance source draft missing: ${source}`);
}

for (const file of files) {
  const credential = JSON.parse(fs.readFileSync(path.join(credentialsDir, file), 'utf8'));
  assert.ok(credential.governance, `${credential.id} must declare credential governance`);
  assert.equal(credential.governance.certificationUseStatus, 'validation-pending', `${credential.id} must remain validation-pending until approved evidence changes it`);
  assert.equal(credential.governance.releaseApprovalStatus, 'not-requested', `${credential.id} must not imply release approval`);
  for (const field of ['humanReviewStatus', 'accessibilityReviewStatus', 'pilotStatus', 'standardSettingStatus']) {
    assert.ok(credential.governance[field], `${credential.id} must declare ${field}`);
  }
  const coursePath = path.join(courseDir, `${credential.course}.json`);
  assert.ok(fs.existsSync(coursePath), `${credential.id} must reference an existing course`);
  const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  assert.equal(credential.courseVersion, course.version, `${credential.id} must pin the current course version`);
  assert.equal(credential.eligibility.requireCourseCompletion, true, `${credential.id} must require versioned course completion`);
  assert.equal(credential.extensions?.thresholdGovernance?.configuredScoreIsProvisional, true, `${credential.id} configured score must be explicitly provisional before standard setting`);
  assert.equal(credential.extensions?.thresholdGovernance?.certificationUseBlockedUntilStandardSetting, true, `${credential.id} must block certification use until standard setting`);

  const noEvidence = evaluateCredentialEligibility({ credential, evidence: {} });
  assert.equal(noEvidence.eligible, false, `${credential.id} must fail closed without learner evidence and release approval`);
  assert.equal(noEvidence.releaseAuthorized, false, `${credential.id} must not report release authorization while validation-pending`);
  assert.ok(noEvidence.releaseBlockers.length > 0, `${credential.id} must expose release blockers while validation-pending`);
}

const synthetic = {
  id: 'CRED-SYNTHETIC-001',
  title: 'Synthetic Credential',
  version: '1.0.0',
  status: 'approved',
  course: 'COURSE-SYNTHETIC-001',
  eligibility: { requiredAssessments: [], minimumPassingScorePercent: 80 }
};
const missingGovernance = evaluateCredentialEligibility({ credential: synthetic, evidence: {} });
assert.equal(missingGovernance.eligible, false);
assert.ok(missingGovernance.releaseBlockers.some((row) => row.reason === 'credential-governance-missing'));

console.log(`Credential governance regression passed for ${files.length} credential definitions.`);
