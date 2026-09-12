import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer, sanitizeAssessmentStimulus } from '../apps/web/server.mjs';

async function startServer(env) {
  const server = createAcademyWebServer({ env });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

const sanitizedProbe = sanitizeAssessmentStimulus([
  {
    type: 'image',
    src: '/assets/course1/cultivation-work-area-hazard-scan.svg',
    alt: 'Assessment evidence image',
    caption: 'Visible learner context',
    answer: 'SECRET-ANSWER',
    correct: 2,
    scoringKey: 'SECRET-KEY'
  },
  { type: 'unsupported-secret-type', answer: 'ANOTHER-SECRET' }
]);
assert.equal(sanitizedProbe.length, 1, 'assessment stimulus sanitizer should drop unsupported block types');
const serializedProbe = JSON.stringify(sanitizedProbe);
for (const forbidden of ['SECRET-ANSWER', 'SECRET-KEY', 'ANOTHER-SECRET', '"correct"', 'scoringKey']) {
  assert.equal(serializedProbe.includes(forbidden), false, `assessment stimulus sanitizer leaked ${forbidden}`);
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
  assert.match(homeHtml, /course-assessment\.css/, 'Academy shell should load the Course 1 final stylesheet');
  assert.match(homeHtml, /course-assessment\.js/, 'Academy shell should load the Course 1 final client');
  assert.match(homeHtml, /assessor\.css/, 'Academy shell should load assessor styles');
  assert.match(homeHtml, /assessor\.js/, 'Academy shell should load the assessor client');
  assert.match(homeHtml, /id="tab-assessor"[^>]*hidden/, 'assessor navigation must default hidden');

  const richRendererResponse = await fetch(`${base}/rich-content.js`);
  assert.equal(richRendererResponse.status, 200);
  assert.match(await richRendererResponse.text(), /renderRichBlocks/, 'rich lesson renderer should be publicly served');
  const richStylesResponse = await fetch(`${base}/rich-content.css`);
  assert.equal(richStylesResponse.status, 200);
  assert.match(await richStylesResponse.text(), /rich-scenario/, 'rich lesson styles should include scenario presentation');
  const appResponse = await fetch(`${base}/app.js`);
  assert.equal(appResponse.status, 200);
  assert.match(await appResponse.text(), /renderRichBlocks\(fieldset, item\.stimulus\)/, 'practice UI should render sanitized rich evidence stimuli before choices');

  const assessmentClient = await fetch(`${base}/course-assessment.js`);
  assert.equal(assessmentClient.status, 200);
  const assessmentClientText = await assessmentClient.text();
  assert.match(assessmentClientText, /assessment-attempts/, 'Course 1 final client should expose the authenticated assessment workflow');
  assert.match(assessmentClientText, /separate from the Technician I credential examination/, 'Course 1 final client must state the separate credential-exam boundary without labeling academic course content restricted');
  const assessmentStyles = await fetch(`${base}/course-assessment.css`);
  assert.equal(assessmentStyles.status, 200);
  assert.match(await assessmentStyles.text(), /course-assessment-choice/, 'Course 1 final styles should include assessment controls');

  const assessorClient = await fetch(`${base}/assessor.js`);
  assert.equal(assessorClient.status, 200);
  const assessorClientText = await assessorClient.text();
  assert.match(assessorClientText, /evaluator\/capabilities/, 'assessor client should require evaluator capability');
  assert.match(assessorClientText, /Finalize evaluation/, 'assessor client should expose trusted finalization workflow');
  assert.match(assessorClientText, /remediationSummary/, 'assessor runtime should project learner-safe remediation feedback');
  const assessorStyles = await fetch(`${base}/assessor.css`);
  assert.equal(assessorStyles.status, 200);
  assert.match(await assessorStyles.text(), /assessor-domain-grid/, 'assessor styles should include the scoring grid');

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

  const courseOne = catalog.courses.find((course) => course.id === 'COURSE-LH-TECH1-001');
  assert.ok(courseOne, 'Course 1 should be present in the staging catalog');
  const courseOneLessonIds = courseOne.modules.flatMap((module) => module.lessons).map((lessonEntry) => lessonEntry.id).filter(Boolean);
  assert.ok(courseOneLessonIds.length >= 18, 'Course 1 should retain at least the current 18-lesson curriculum while remaining extensible');
  assert.equal(new Set(courseOneLessonIds).size, courseOneLessonIds.length, 'Course 1 lesson graph should not contain duplicate lesson ids');

  const observedRichTypes = new Set();
  for (const richLessonId of courseOneLessonIds) {
    const richLessonResponse = await fetch(`${base}/api/lessons/${richLessonId}`);
    assert.equal(richLessonResponse.status, 200, `${richLessonId} should be available`);
    const richLesson = await richLessonResponse.json();
    assert.ok(Array.isArray(richLesson.content?.blocks) && richLesson.content.blocks.length > 0, `${richLessonId} should expose ordered rich content blocks`);
    for (const block of richLesson.content.blocks) {
      assert.equal(typeof block.type, 'string', `${richLessonId} rich blocks should declare a type`);
      observedRichTypes.add(block.type);
      if (block.type === 'image') {
        assert.match(block.src ?? '', /^\/assets\/course1\/[A-Za-z0-9._-]+\.svg$/, `${richLessonId} image blocks should use controlled Course 1 asset paths`);
        assert.ok(typeof block.alt === 'string' && block.alt.trim().length > 0, `${richLessonId} image blocks should include learner-facing alt text`);
      }
      if (block.type === 'steps') {
        assert.ok(Array.isArray(block.items) && block.items.length > 0, `${richLessonId} step blocks should use the canonical non-empty items array`);
        assert.equal(Object.hasOwn(block, 'steps'), false, `${richLessonId} step blocks should not use the legacy steps alias`);
      }
    }
  }
  for (const requiredType of ['text', 'callout', 'image', 'steps', 'comparison', 'table', 'scenario', 'activity', 'document']) {
    assert.ok(observedRichTypes.has(requiredType), `Course 1 rich curriculum should exercise ${requiredType} blocks`);
  }

  const visualRegistry = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'visuals/ASSET-REGISTRY.json'), 'utf8'));
  assert.equal(visualRegistry.courseId, 'COURSE-LH-TECH1-001');
  assert.equal(visualRegistry.policy?.expandable, true, 'visual registry should remain explicitly expandable');
  assert.equal(visualRegistry.policy?.maximumAssetCount, null, 'visual registry must not impose an artificial asset maximum');
  const producedAssets = (visualRegistry.assets ?? []).filter((asset) => asset.status === 'produced');
  assert.ok(producedAssets.length >= 12, 'the first 12 core Course 1 visuals should be produced');
  assert.equal(new Set(producedAssets.map((asset) => asset.id)).size, producedAssets.length, 'produced visual ids should be unique');
  assert.equal(new Set(producedAssets.map((asset) => asset.learnerPath)).size, producedAssets.length, 'produced learner asset paths should be unique');

  for (const asset of producedAssets) {
    assert.match(asset.learnerPath ?? '', /^\/assets\/course1\/[A-Za-z0-9._-]+\.svg$/, `${asset.id} should use a controlled Course 1 learner path`);
    const assetResponse = await fetch(`${base}${asset.learnerPath}`);
    assert.equal(assetResponse.status, 200, `${asset.learnerPath} should be served`);
    const svg = await assetResponse.text();
    assert.match(svg, /<svg[\s>]/, `${asset.learnerPath} should contain SVG markup`);
    assert.match(svg, /<title[\s>]/, `${asset.learnerPath} should include an accessible title`);
    assert.match(svg, /<desc[\s>]/, `${asset.learnerPath} should include an accessible description`);
  }

  const courseOnePractice = await fetch(`${base}/api/lessons/LESSON-LH-TECH1-001-01/practice?seed=qa-seed`);
  assert.equal(courseOnePractice.status, 200);
  const practice = await courseOnePractice.json();
  assert.equal(practice.presentationSeed, 'qa-seed');
  assert.ok(practice.items.length > 0, 'Course 1 lesson practice should expose researched formative items in staging');
  assert.ok(practice.items.every((item) => item.objective === 'LO-LH-TECH1-001-01'), 'lesson practice must be objective-aligned, not only competency-aligned');
  assert.ok(new Set(practice.items.map((item) => item.correct)).size > 1, 'choice presentation must not lock every keyed answer to one position');
  const visualPracticeItem = practice.items.find((item) => item.id === 'ITEM-LH-TECH1-001-M01-001');
  assert.ok(visualPracticeItem, 'visual Course 1 safety practice item should be returned');
  assert.ok(Array.isArray(visualPracticeItem.stimulus) && visualPracticeItem.stimulus.length === 1, 'visual practice item should expose a sanitized evidence stimulus');
  assert.equal(visualPracticeItem.stimulus[0].type, 'image');
  assert.equal(visualPracticeItem.stimulus[0].src, '/assets/course1/cultivation-work-area-hazard-scan.svg');
  assert.ok(typeof visualPracticeItem.stimulus[0].alt === 'string' && visualPracticeItem.stimulus[0].alt.length > 0, 'assessment image stimulus should include alt text');
  for (const forbidden of ['answer', 'correct', 'scoringKey', 'extensions']) {
    assert.equal(Object.hasOwn(visualPracticeItem.stimulus[0], forbidden), false, `visual assessment stimulus should not expose ${forbidden}`);
  }
  for (const item of practice.items) {
    const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/questions', `${item.id}.json`), 'utf8'));
    assert.deepEqual([...item.choices].sort(), [...source.choices].sort(), `${item.id} presentation must preserve the source choice set`);
    assert.equal(item.choices[item.correct], source.choices[source.correct], `${item.id} remapped key must identify the source correct answer`);
  }

  const visualPracticeCoverage = [
    ['LESSON-LH-TECH1-001-01', 'ITEM-LH-TECH1-001-M01-001', '/assets/course1/cultivation-work-area-hazard-scan.svg'],
    ['LESSON-LH-TECH1-001-04', 'ITEM-LH-TECH1-001-M02-001', '/assets/course1/biosecurity-pathway-map.svg'],
    ['LESSON-LH-TECH1-001-07', 'ITEM-LH-TECH1-001-M03-001', '/assets/course1/controlled-document-anatomy.svg'],
    ['LESSON-LH-TECH1-001-10', 'ITEM-LH-TECH1-001-M04-001', '/assets/course1/material-genealogy.svg'],
    ['LESSON-LH-TECH1-001-13', 'ITEM-LH-TECH1-001-M05-001', '/assets/course1/operator-care-servicing-boundary.svg'],
    ['LESSON-LH-TECH1-001-17', 'ITEM-LH-TECH1-001-M06-012', '/assets/course1/shift-handoff-model.svg']
  ];
  for (const [practiceLessonId, expectedItemId, expectedAsset] of visualPracticeCoverage) {
    const response = await fetch(`${base}/api/lessons/${practiceLessonId}/practice?seed=visual-coverage`);
    assert.equal(response.status, 200, `${practiceLessonId} practice endpoint should be available`);
    const payload = await response.json();
    const visualItem = payload.items.find((item) => item.id === expectedItemId);
    assert.ok(visualItem, `${practiceLessonId} should deliver ${expectedItemId}`);
    assert.ok(Array.isArray(visualItem.stimulus) && visualItem.stimulus.length > 0, `${expectedItemId} should include evidence stimulus`);
    const image = visualItem.stimulus.find((block) => block.type === 'image');
    assert.ok(image, `${expectedItemId} should include an image evidence block`);
    assert.equal(image.src, expectedAsset, `${expectedItemId} should use its module-aligned visual`);
    assert.ok(typeof image.alt === 'string' && image.alt.trim().length > 0, `${expectedItemId} should include accessible image text`);
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

console.log('Academy learner web, Course 1 final/practical assessor assets, and staging governance tests passed.');
