import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const readiness=JSON.parse(fs.readFileSync('registry/system-readiness.json','utf8'));
const staging=fs.readFileSync('scripts/check-staging-readiness.mjs','utf8');
const status=fs.readFileSync('scripts/report-system-status.mjs','utf8');
const curriculumWorkflow=fs.readFileSync('.github/workflows/validate.yml','utf8');
const stagingWorkflow=fs.readFileSync('.github/workflows/staging-candidate.yml','utf8');

assert.equal(readiness.productionReady,false,'Academy must remain fail-closed for production');
assert.equal(readiness.areas.curriculum.gates.substantiveContentComplete,false,'global curriculum completion must remain false while the intended Academy build is unfinished');
assert.equal(readiness.areas.curriculum.gates.stagingContentSliceValidated,true,'validated staging curriculum slice should be tracked independently');
const reviewQueue=JSON.parse(execFileSync(process.execPath,['scripts/build-review-queue.mjs','--summary-only'],{encoding:'utf8'}));
const unresolved=(lane)=> {
  const row=reviewQueue.lanes?.[lane] ?? {};
  return (row.pending ?? 0)+(row.blocked ?? 0)+(row.revisionRequired ?? 0);
};
assert.equal(readiness.areas.curriculum.gates.scientificReviewComplete,unresolved('lesson-scientific')===0,'scientific review readiness must match the live object/version review queue');
assert.equal(readiness.areas.curriculum.gates.editorialReviewComplete,unresolved('lesson-editorial')===0,'editorial review readiness must match the live object/version review queue');
const assessmentUnresolved=unresolved('assessment-definition')+unresolved('formative-item')+unresolved('credential-item');
assert.equal(readiness.areas.assessment.gates.humanAssessmentReviewComplete,assessmentUnresolved===0,'assessment review readiness must reopen when current assessment/item objects are unapproved');
assert.equal(readiness.areas.assessment.gates.pilotStatisticsComplete,false,'content approval must not fabricate pilot statistics');
assert.match(staging,/\['curriculum', 'stagingContentSliceValidated'\]/,'staging readiness must use the validated slice gate');
assert.doesNotMatch(staging,/\['curriculum', 'substantiveContentComplete'\]/,'staging readiness must not require a false global completion claim');
assert.match(status,/\['curriculum', 'stagingContentSliceValidated'\]/,'system status staging calculation must use the validated slice gate');
assert.match(curriculumWorkflow,/actions\/checkout@v\d+[\s\S]*?fetch-depth:\s*0/,'curriculum quality CI must preserve git history for versioned review-queue truthfulness');
assert.match(stagingWorkflow,/actions\/checkout@v\d+[\s\S]*?fetch-depth:\s*0/,'staging candidate CI must preserve git history for versioned review-queue truthfulness');

for(const [area,gate] of [
  ['runtime','authenticationIntegrated'],
  ['runtime','authorizationIntegrated'],
  ['runtime','lessonModuleCourseCompletion'],
  ['runtime','assessmentAttemptLifecycle'],
  ['runtime','learnerTranscriptProjection'],
  ['runtime','productionPersistenceAdapterCodeReady'],
  ['assessment','secureOperationalStoreIntegrationCodeReady'],
  ['assessment','secureFormConstructionCodeReady'],
  ['security','adminMfaEnforcementCodeReady'],
  ['security','rowLevelAuthorizationPolicyCodeReady'],
  ['operations','backupRestoreContractCodeReady'],
  ['operations','monitoringAlertingContractCodeReady'],
  ['operations','productionValidationEvidenceContractReady'],
  ['credentials','revocationTransactionCodeReady'],
  ['credentials','productionSigningIntegrationCodeReady'],
  ['api','learnerOpenApiContract'],
  ['api','learnerOpenApiRuntimeParity'],
  ['learnerExperience','publishedCourseEnrollmentUi'],
  ['learnerExperience','rolePathwayDiscovery'],
  ['learnerExperience','consolidatedDashboard'],
  ['learnerExperience','privacyBoundedCredentialTranscript'],
  ['learnerExperience','practicalEvidenceSubmissionRepositoryImplemented'],
  ['learnerExperience','practicalEvidenceSubmissionWorkflowCodeReady']
]) assert.equal(readiness.areas[area]?.gates?.[gate],true,`${area}.${gate} should reflect merged deterministic capability`);

for(const [area,gate] of [
  ['runtime','productionPersistenceAdapter'],
  ['api','productionDatabaseIntegration'],
  ['assessment','secureOperationalStoreIntegration'],
  ['security','adminMfaEnforced'],
  ['security','rowLevelAuthorization'],
  ['security','securityReviewComplete'],
  ['learnerExperience','practicalEvidenceSubmissionWorkflow'],
  ['operations','stagingEnvironment'],
  ['operations','productionEnvironment'],
  ['operations','backupRestoreTested'],
  ['operations','monitoringAndAlerting']
]) assert.equal(readiness.areas[area]?.gates?.[gate],false,`${area}.${gate} must remain false until deployed/validated evidence exists`);

console.log('System readiness truthfulness and staging-slice boundary: PASS');
