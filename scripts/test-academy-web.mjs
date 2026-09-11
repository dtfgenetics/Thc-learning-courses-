import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
  assert.match(homeHtml, /rich-content\.css/, 'Academy shell should load the rich-content stylesheet');

  const richRendererResponse = await fetch(`${base}/rich-content.js`);
  assert.equal(richRendererResponse.status, 200);
  assert.match(await richRendererResponse.text(), /renderRichBlocks/, 'rich lesson renderer should be publicly served');
  const richStylesResponse = await fetch(`${base}/rich-content.css`);
  assert.equal(richStylesResponse.status, 200);
  assert.match(await richStylesResponse.text(), /rich-scenario/, 'rich lesson styles should include scenario presentation');

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
  assert.ok(Array.isArray(catalog.courses) && catalog.courses.length > 0);
  const serializedCatalog = JSON.stringify(catalog);
  for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'content/questions']) assert.equal(serializedCatalog.includes(forbidden), false, `catalog leaked ${forbidden}`);

  const lessonId = catalog.courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).map((lesson) => lesson.id).find(Boolean);
  const lessonResponse = await fetch(`${base}/api/lessons/${lessonId}`);
  assert.equal(lessonResponse.status, 200);
  const lesson = await lessonResponse.json();
  assert.equal(Object.hasOwn(lesson, 'assessment'), false);
  assert.equal(Object.hasOwn(lesson, 'questions'), false);

  const richLessonResponse = await fetch(`${base}/api/lessons/LESSON-LH-TECH1-001-01`);
  assert.equal(richLessonResponse.status, 200);
  const richLesson = await richLessonResponse.json();
  assert.ok(Array.isArray(richLesson.content?.blocks) && richLesson.content.blocks.length > 0, 'Course 1 lesson 1 should expose ordered rich content blocks');
  const richTypes = new Set(richLesson.content.blocks.map((block) => block.type));
  for (const requiredType of ['image', 'steps', 'callout', 'comparison', 'scenario', 'activity']) assert.ok(richTypes.has(requiredType), `Course 1 lesson 1 should exercise rich block type ${requiredType}`);

  for (const assetPath of ['/assets/course1/hazard-control-decision-flow.svg', '/assets/course1/ppe-hazcom-decision-map.svg', '/assets/course1/cultivation-work-area-hazard-scan.svg']) {
    const assetResponse = await fetch(`${base}${assetPath}`);
    assert.equal(assetResponse.status, 200, `${assetPath} should be served`);
    assert.match(await assetResponse.text(), /<svg[\s>]/, `${assetPath} should contain SVG markup`);
  }

  const courseOnePractice = await fetch(`${base}/api/lessons/LESSON-LH-TECH1-001-01/practice?seed=qa-seed`);
  assert.equal(courseOnePractice.status, 200);
  const practice = await courseOnePractice.json();
  assert.equal(practice.presentationSeed, 'qa-seed');
  assert.ok(practice.items.length > 0, 'Course 1 lesson practice should expose researched formative items in staging');
  assert.ok(practice.items.every((item) => item.objective === 'LO-LH-TECH1-001-01'), 'lesson practice must be objective-aligned, not only competency-aligned');
  assert.ok(new Set(practice.items.map((item) => item.correct)).size > 1, 'choice presentation must not lock every keyed answer to one position');
  for (const item of practice.items) {
    const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/questions', `${item.id}.json`), 'utf8'));
    assert.deepEqual([...item.choices].sort(), [...source.choices].sort(), `${item.id} presentation must preserve the source choice set`);
    assert.equal(item.choices[item.correct], source.choices[source.correct], `${item.id} remapped key must identify the source correct answer`);
  }
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
