import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateCredentialEligibility } from '../packages/domain/credential-eligibility.mjs';

const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const credential=read('content/credentials/CRED-CULT-TECH-I-001.json');
const passing=read('tests/fixtures/tech1-eligibility-pass.json');
const failing=read('tests/fixtures/tech1-eligibility-fail.json');

assert.equal(credential.credentialProgram,'CREDPROG-CULT-TECH-I-001');
assert.equal(credential.course,'COURSE-LH-TECH1-007');
assert.deepEqual(credential.eligibility.requiredCourseCompletions,[
  'COURSE-LH-TECH1-001','COURSE-LH-TECH1-002','COURSE-LH-TECH1-003','COURSE-LH-TECH1-004','COURSE-LH-TECH1-005','COURSE-LH-TECH1-006','COURSE-LH-TECH1-007'
]);
assert.equal(credential.eligibility.requiredPerformanceAssessments.length,7);

const passResult=evaluateCredentialEligibility({credential,evidence:passing});
assert.equal(passResult.requirementsSatisfied,true,'complete synthetic Technician I evidence should satisfy learner requirements');
assert.equal(passResult.requirementSummary.courseCompletion,7);
assert.equal(passResult.requirementSummary.writtenAssessments,1);
assert.equal(passResult.requirementSummary.performanceAssessments,7);
assert.equal(passResult.releaseAuthorized,false,'draft Technician I credential must remain release-blocked');
assert.equal(passResult.eligible,false,'release-blocked Technician I credential must not become issuance-eligible');
for(const reason of ['credential-definition-not-approved','human-review-incomplete','accessibility-review-incomplete','pilot-incomplete','standard-setting-incomplete','release-approval-missing','certification-use-not-authorized']){
  assert.ok(passResult.releaseBlockers.some((row)=>row.reason===reason),`Technician I release blocker missing: ${reason}`);
}

const failResult=evaluateCredentialEligibility({credential,evidence:failing});
assert.equal(failResult.requirementsSatisfied,false);
assert.ok(failResult.missingRequirements.some((row)=>row.type==='course-completion'&&row.id==='COURSE-LH-TECH1-006'&&row.reason==='missing-course-completion'));
assert.ok(failResult.missingRequirements.some((row)=>row.type==='performance-assessment'&&row.id==='PRACTICAL-TECH1-C'&&row.reason==='critical-error'));

console.log('Technician I canonical seven-course credential eligibility and fail-closed release governance contracts passed.');
