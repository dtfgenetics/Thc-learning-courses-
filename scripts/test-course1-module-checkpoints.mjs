import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { buildAcademyCatalog, createAcademyWebServer, loadModuleAssessment } from '../apps/web/server.mjs';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
const catalog = buildAcademyCatalog({ previewDrafts: false });
const course = catalog.courses.find((entry) => entry.id === 'COURSE-LH-TECH1-001');
assert.ok(course, 'Course 1 must be present in the public catalog');
assert.ok(course.modules.length > 0, 'Course 1 must expose its controlled module sequence without imposing a module-count ceiling');
assert.ok(course.modules.every((module) => typeof module.assessment === 'string' && module.assessment.startsWith('ASSESS-')), 'every current Course 1 module must expose its configured formative assessment id');

for (const module of course.modules) {
  const canonicalAssessment = readJson(`content/assessments/${module.assessment}.json`);
  const payload = loadModuleAssessment(module.id, { previewDrafts: false, seed: 'module-checkpoint-test' });
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
    assert.equal(item.choices[item.correct], source.choices[source.correct], `${item.id} shuffled key must still identify the canonical correct response`);
    assert.ok(typeof item.rationale === 'string' && item.rationale.length > 0, `${item.id} should provide immediate formative rationale`);
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

  const app = await fetch(`${base}/app.js`);
  assert.equal(app.status, 200);
  const appText = await app.text();
  assert.match(appText, /Module checkpoint · formative test/, 'catalog should expose module checkpoint actions');
  assert.match(appText, /development target for feedback and remediation, not a credential cut score or certification decision/, 'module checkpoint UI must state the non-credential development-threshold boundary');
  assert.match(appText, /\/api\/modules\//, 'module checkpoint UI must call the controlled module assessment endpoint');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 1 formative module checkpoint delivery tests passed without fixed module or item-count ceilings.');