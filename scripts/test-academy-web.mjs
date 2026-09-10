import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

async function startServer(env) {
  const server = createAcademyWebServer({ env });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

const staging = await startServer({ ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' });
try {
  const base = `http://127.0.0.1:${staging.address().port}`;
  const health = await fetch(`${base}/healthz`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).mode, 'staging-preview');

  const home = await fetch(`${base}/academy`);
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.match(homeHtml, /THC Academy/);
  assert.match(homeHtml, /governance-dashboard/);
  assert.match(homeHtml, /id="tab-progress"/);
  assert.match(homeHtml, /id="tab-assessor"/);

  const governanceClient = await fetch(`${base}/governance.js`);
  assert.equal(governanceClient.status, 200);
  const governanceClientText = await governanceClient.text();
  assert.match(governanceClientText, /Activation evidence complete/);

  const governanceResponse = await fetch(`${base}/api/staging/governance`);
  assert.equal(governanceResponse.status, 200);
  const governance = await governanceResponse.json();
  assert.equal(governance.mode, 'staging-governance');
  assert.ok(governance.inventory.lessons > 0);
  assert.ok(governance.inventory.assessments > 0);
  assert.ok(governance.inventory.questions > 0);
  assert.ok(Array.isArray(governance.readiness.productionBlockers));
  for (const key of ['credentialItems', 'itemsWithPilotRecord', 'itemsWithCompleteEvidence', 'itemsWithApprovedAssessmentReview', 'itemsWithActivationEvidenceComplete', 'activeItems']) {
    assert.equal(typeof governance.pilot[key], 'number', `pilot.${key} must be numeric`);
    assert.ok(governance.pilot[key] >= 0, `pilot.${key} must be non-negative`);
  }
  assert.ok(governance.pilot.itemsWithActivationEvidenceComplete <= governance.pilot.credentialItems);
  assert.ok(governance.pilot.activeItems <= governance.pilot.credentialItems);
  const serializedGovernance = JSON.stringify(governance);
  for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'reviewer', 'reviewerId', 'subjectHash', 'participantId', 'selectedChoiceIndex']) {
    assert.equal(serializedGovernance.includes(forbidden), false, `governance summary leaked ${forbidden}`);
  }

  const catalogResponse = await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.mode, 'staging-preview');
  assert.ok(Array.isArray(catalog.courses) && catalog.courses.length > 0);
  assert.ok(Array.isArray(catalog.credentials) && catalog.credentials.length > 0, 'staging catalog must expose credential definitions');
  assert.ok(Array.isArray(catalog.assessorPerformanceAssessments) && catalog.assessorPerformanceAssessments.length > 0, 'staging catalog must expose assessor performance definitions');
  const specialistCredential = catalog.credentials.find((credential) => credential.id === 'CRED-CANOPY-FLOWERING-ADVANCED-001');
  assert.ok(specialistCredential, 'specialist credential must be discoverable in staging');
  assert.equal(specialistCredential.status, 'draft');
  assert.deepEqual(specialistCredential.eligibility.requiredPerformanceAssessments, ['PRACTICAL-SPEC-CANOPY-FLOWERING-001']);
  assert.equal(specialistCredential.eligibility.requireVerifiedPerformanceEvidence, true);
  const specialistPractical = catalog.assessorPerformanceAssessments.find((definition) => definition.id === 'PRACTICAL-SPEC-CANOPY-FLOWERING-001');
  assert.ok(specialistPractical, 'specialist practical must be discoverable in assessor staging catalog');
  assert.ok(Array.isArray(specialistPractical.deliveryModes) && specialistPractical.deliveryModes.length > 0);
  assert.ok(Array.isArray(specialistPractical.scoring?.domains) && specialistPractical.scoring.domains.length > 0);
  assert.ok(Array.isArray(specialistPractical.criticalErrors) && specialistPractical.criticalErrors.length > 0);
  const serializedCatalog = JSON.stringify(catalog);
  for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'content/questions', 'selectedChoiceIndex', 'subjectHash']) assert.equal(serializedCatalog.includes(forbidden), false, `catalog leaked ${forbidden}`);

  const lessonId = catalog.courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).map((lesson) => lesson.id).find(Boolean);
  const lessonResponse = await fetch(`${base}/api/lessons/${lessonId}`);
  assert.equal(lessonResponse.status, 200);
  const lesson = await lessonResponse.json();
  assert.equal(Object.hasOwn(lesson, 'assessment'), false);
  assert.equal(Object.hasOwn(lesson, 'questions'), false);
} finally {
  staging.close();
  await once(staging, 'close');
}

const production = await startServer({ ...process.env, NODE_ENV: 'production', ACADEMY_PREVIEW_DRAFTS: '0' });
try {
  const base = `http://127.0.0.1:${production.address().port}`;
  const governanceResponse = await fetch(`${base}/api/staging/governance`);
  assert.equal(governanceResponse.status, 404, 'staging governance endpoint must disappear in production');

  const catalogResponse = await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.mode, 'published-only');
  assert.ok(Array.isArray(catalog.credentials));
  assert.ok(catalog.credentials.every((credential) => credential.status === 'published'), 'production catalog may expose only published credentials');
  assert.deepEqual(catalog.assessorPerformanceAssessments, [], 'assessor rubric definitions must not be exposed through the public production catalog');
  assert.equal(catalog.credentials.some((credential) => credential.id === 'CRED-CANOPY-FLOWERING-ADVANCED-001'), false, 'draft specialist credential must not leak into production catalog');
} finally {
  production.close();
  await once(production, 'close');
}

console.log('Academy learner web, credential catalog, assessor staging, and governance tests passed.');
