import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { buildAcademyCatalog, createAcademyWebServer, loadModuleAssessment } from '../apps/web/server.mjs';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
const catalog = buildAcademyCatalog({ previewDrafts: false });
const course = catalog.courses.find((entry) => entry.id === 'COURSE-LH-TECH1-001');
assert.ok(course, 'Course 1 must be present in the public catalog');
assert.equal(course.modules.length, 6, 'Course 1 currently has six controlled modules');
assert.ok(course.modules.every((module) => typeof module.assessment === 'string' && module.assessment.startsWith('ASSESS-LH-TECH1-001-M')), 'every Course 1 module must expose its formative assessment id');

for (const module of course.modules) {
  const canonicalAssessment = readJson(`content/assessments/${module.assessment}.json`);
  const payload = loadModuleAssessment(module.id, { previewDrafts: false, seed: 'module-checkpoint-test' });
  assert.ok(payload, `${module.id} formative checkpoint must load`);
  assert.equal(payload.assessment.id, canonicalAssessment.id);
  assert.equal(payload.assessment.purpose, 'formative');
  assert.equal(payload.assessment.feedbackMode, 'immediate');
  assert.equal(payload.assessment.totalItems, canonicalAssessment.items.length);
  assert.equal(payload.items.length, 14, `${module.id} should currently expose its full 14-item formative bank`);
  assert.deepEqual(payload.items.map((item) => item.id), canonicalAssessment.items, `${module.id} must use the canonical controlled item list`);
  for (const item of payload.items) {
    const source = readJson(`content/questions/${item.id}.json`);
    assert.equal(source.purpose, 'formative');
    assert.deepEqual([...item.choices].sort(), [...source.choices].sort(), `${item.id} must preserve the controlled choice set`);
    assert.equal(item.choices[item.correct], source.choices[source.correct], `${item.id} shuffled key must still identify the canonical correct response`);
    assert.ok(typeof item.rationale === 'string' && item.rationale.length > 0, `${item.id} should provide immediate formative rationale`);
  }
}

const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'production', ACADEMY_PREVIEW_DRAFTS: '0' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/modules/MOD-LH-TECH1-001-SAFETY/assessment?seed=public-checkpoint`);
  assert.equal(response.status, 200, 'public Course 1 module checkpoint endpoint should be reachable');
  const body = await response.json();
  assert.equal(body.presentationSeed, 'public-checkpoint');
  assert.equal(body.assessment.totalItems, 14);
  assert.equal(body.assessment.passingScorePercent, 80);

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

console.log('Course 1 six-module formative checkpoint delivery tests passed.');