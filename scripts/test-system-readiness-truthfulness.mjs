import assert from 'node:assert/strict';
import fs from 'node:fs';

const readiness=JSON.parse(fs.readFileSync('registry/system-readiness.json','utf8'));
const staging=fs.readFileSync('scripts/check-staging-readiness.mjs','utf8');
const status=fs.readFileSync('scripts/report-system-status.mjs','utf8');

assert.equal(readiness.productionReady,false,'Academy must remain fail-closed for production');
assert.equal(readiness.areas.curriculum.gates.substantiveContentComplete,false,'global curriculum completion must remain false while the intended Academy build is unfinished');
assert.equal(readiness.areas.curriculum.gates.stagingContentSliceValidated,true,'validated staging curriculum slice should be tracked independently');
assert.match(staging,/\['curriculum', 'stagingContentSliceValidated'\]/,'staging readiness must use the validated slice gate');
assert.doesNotMatch(staging,/\['curriculum', 'substantiveContentComplete'\]/,'staging readiness must not require a false global completion claim');
assert.match(status,/\['curriculum', 'stagingContentSliceValidated'\]/,'system status staging calculation must use the validated slice gate');

for(const [area,gate] of [
  ['runtime','authenticationIntegrated'],
  ['runtime','authorizationIntegrated'],
  ['runtime','lessonModuleCourseCompletion'],
  ['runtime','assessmentAttemptLifecycle'],
  ['runtime','learnerTranscriptProjection'],
  ['api','learnerOpenApiContract'],
  ['api','learnerOpenApiRuntimeParity'],
  ['learnerExperience','publishedCourseEnrollmentUi'],
  ['learnerExperience','rolePathwayDiscovery'],
  ['learnerExperience','consolidatedDashboard'],
  ['learnerExperience','privacyBoundedCredentialTranscript'],
  ['learnerExperience','practicalEvidenceSubmissionRepositoryImplemented']
]) assert.equal(readiness.areas[area]?.gates?.[gate],true,`${area}.${gate} should reflect merged deterministic capability`);

for(const [area,gate] of [
  ['runtime','productionPersistenceAdapter'],
  ['api','productionDatabaseIntegration'],
  ['security','rowLevelAuthorization'],
  ['security','securityReviewComplete'],
  ['learnerExperience','practicalEvidenceSubmissionWorkflow'],
  ['operations','stagingEnvironment'],
  ['operations','productionEnvironment']
]) assert.equal(readiness.areas[area]?.gates?.[gate],false,`${area}.${gate} must remain false until deployed/validated evidence exists`);

console.log('System readiness truthfulness and staging-slice boundary: PASS');
