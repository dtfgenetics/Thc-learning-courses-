import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { buildAcademyCatalog, createAcademyWebServer, gradeModuleAssessmentItem, loadModuleAssessment } from '../apps/web/server.mjs';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
const catalog = buildAcademyCatalog({ previewDrafts: false });
const course = catalog.courses.find((entry) => entry.id === 'COURSE-LH-TECH1-001');
assert.ok(course, 'Course 1 must be present in the public catalog');
assert.ok(course.modules.length > 0, 'Course 1 must expose its controlled module sequence without imposing a module-count ceiling');
assert.ok(course.modules.every((module) => typeof module.assessment === 'string' && module.assessment.startsWith('ASSESS-')), 'every current Course 1 module must expose its configured formative assessment id');

for (const module of course.modules) {
  const canonicalAssessment = readJson(`content/assessments/${module.assessment}.json`);
  const seed = 'module-checkpoint-test';
  const payload = loadModuleAssessment(module.id, { previewDrafts: false, seed });
  assert.ok(payload, `${module.id} formative checkpoint must load`);
  assert.equal(payload.assessment.id, canonicalAssessment.id);
  assert.equal(payload.assessment.purpose, 'formative');
  assert.equal(payload.assessment.feedbackMode, 'immediate');
  assert.equal(payload.assessment.totalItems, canonicalAssessment.items.length);
  assert.ok(payload.items.length > 0, `${module.id} should expose its current non-empty controlled formative bank`);
  assert.deepEqual(payload.items.map((item) => item.id), canonicalAssessment.items, `${module.id} must use the canonical controlled item list without freezing its size`);
  for (const item of payload.items) {
    const source = readJson(`content/questions/${item.id}.json`);
    assert.equal(source.purpose, 'formative');
    assert.deepEqual([...item.choices].sort(), [...source.choices].sort(), `${item.id} must preserve the controlled choice set`);
    assert.equal(Object.hasOwn(item, 'correct'), false, `${item.id} must not expose the shuffled answer key before the learner responds`);
    assert.equal(Object.hasOwn(item, 'rationale'), false, `${item.id} must not expose formative rationale before the learner responds`);
    const canonicalCorrectChoice = source.choices[source.correct];
    const selectedIndex = item.choices.indexOf(canonicalCorrectChoice);
    assert.ok(selectedIndex >= 0, `${item.id} presented choices must contain the canonical keyed response`);
    const grade = gradeModuleAssessmentItem(module.id, { itemId: item.id, selectedIndex, seed, previewDrafts: false });
    assert.ok(grade, `${item.id} should grade against the exact presentation seed`);
    assert.equal(grade.isCorrect, true, `${item.id} canonical keyed response should remain correct after shuffling`);
    assert.equal(grade.correctChoice, canonicalCorrectChoice, `${item.id} server-side grading should identify the canonical keyed response`);
    assert.equal(grade.rationale, source.rationale, `${item.id} rationale should be released only in post-response feedback`);
  }
}

const firstModule = course.modules[0];
const firstCanonicalAssessment = readJson(`content/assessments/${firstModule.assessment}.json`);
const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'production', ACADEMY_PREVIEW_DRAFTS: '0' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/modules/${encodeURIComponent(firstModule.id)}/assessment?seed=public-checkpoint`);
  assert.equal(response.status, 200, 'public Course 1 module checkpoint endpoint should be reachable');
  const body = await response.json();
  assert.equal(body.presentationSeed, 'public-checkpoint');
  assert.equal(body.assessment.totalItems, firstCanonicalAssessment.items.length);
  assert.equal(body.assessment.passingScorePercent, Number(firstCanonicalAssessment.passingScorePercent));
  assert.ok(body.items.every((item) => !Object.hasOwn(item, 'correct') && !Object.hasOwn(item, 'rationale')), 'public checkpoint GET must not expose answer keys or rationales');

  const sample = body.items[0];
  const source = readJson(`content/questions/${sample.id}.json`);
  const correctChoice = source.choices[source.correct];
  const selectedIndex = sample.choices.indexOf(correctChoice);
  const gradeResponse = await fetch(`${base}/api/modules/${encodeURIComponent(firstModule.id)}/assessment/grade`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ itemId: sample.id, selectedIndex, presentationSeed: body.presentationSeed })
  });
  assert.equal(gradeResponse.status, 200, 'public Course 1 module checkpoint should grade after a learner response');
  const grade = await gradeResponse.json();
  assert.equal(grade.isCorrect, true);
  assert.equal(grade.correctChoice, correctChoice);
  assert.equal(grade.rationale, source.rationale);

  const app = await fetch(`${base}/app.js`);
  assert.equal(app.status, 200);
  const appText = await app.text();
  assert.match(appText, /Module checkpoint · formative test/, 'catalog should expose module checkpoint actions');
  assert.match(appText, /development target for feedback and remediation, not a credential cut score or certification decision/, 'module checkpoint UI must state the non-credential development-threshold boundary');
  assert.match(appText, /\/api\/modules\//, 'module checkpoint UI must call the controlled module assessment endpoint');
  assert.match(appText, /\/assessment\/grade/, 'module checkpoint UI must request server-side feedback after a response');
  assert.doesNotMatch(appText, /item\.correct/, 'learner UI must not depend on a pre-answer client-side answer key');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 1 formative module checkpoint delivery, answer-key non-disclosure, seeded shuffling, and post-response server-side grading tests passed without fixed module or item-count ceilings.');
