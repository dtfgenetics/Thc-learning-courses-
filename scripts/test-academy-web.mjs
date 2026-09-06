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

  const governanceClient = await fetch(`${base}/governance.js`);
  assert.equal(governanceClient.status, 200);

  const governanceResponse = await fetch(`${base}/api/staging/governance`);
  assert.equal(governanceResponse.status, 200);
  const governance = await governanceResponse.json();
  assert.equal(governance.mode, 'staging-governance');
  assert.ok(governance.inventory.lessons > 0);
  assert.ok(governance.inventory.assessments > 0);
  assert.ok(governance.inventory.questions > 0);
  assert.ok(Array.isArray(governance.readiness.productionBlockers));
  const serializedGovernance = JSON.stringify(governance);
  for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'reviewer', 'reviewerId', 'subjectHash']) {
    assert.equal(serializedGovernance.includes(forbidden), false, `governance summary leaked ${forbidden}`);
  }

  const catalogResponse = await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.ok(Array.isArray(catalog.courses) && catalog.courses.length > 0);
  const serializedCatalog = JSON.stringify(catalog);
  for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'content/questions']) assert.equal(serializedCatalog.includes(forbidden), false, `catalog leaked ${forbidden}`);

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
} finally {
  production.close();
  await once(production, 'close');
}

console.log('Academy learner web and staging governance tests passed.');
