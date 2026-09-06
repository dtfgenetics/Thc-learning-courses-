import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');

try {
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${base}/healthz`);
  assert.equal(health.status, 200);
  const healthBody = await health.json();
  assert.equal(healthBody.ok, true);
  assert.equal(healthBody.mode, 'staging-preview');

  const home = await fetch(`${base}/academy`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await home.text(), /THC Academy/);

  const catalogResponse = await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.mode, 'staging-preview');
  assert.ok(Array.isArray(catalog.courses) && catalog.courses.length > 0, 'expected at least one course');

  const serializedCatalog = JSON.stringify(catalog);
  for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'content/questions']) {
    assert.equal(serializedCatalog.includes(forbidden), false, `catalog leaked ${forbidden}`);
  }

  const lessonId = catalog.courses
    .flatMap((course) => course.modules)
    .flatMap((module) => module.lessons)
    .map((lesson) => lesson.id)
    .find(Boolean);
  assert.ok(lessonId, 'expected at least one visible lesson');

  const lessonResponse = await fetch(`${base}/api/lessons/${lessonId}`);
  assert.equal(lessonResponse.status, 200);
  const lesson = await lessonResponse.json();
  assert.equal(lesson.id, lessonId);
  assert.equal(Object.hasOwn(lesson, 'assessment'), false, 'public lesson must not expose assessment mapping');
  assert.equal(Object.hasOwn(lesson, 'questions'), false, 'public lesson must not expose question bank content');
  assert.ok(lesson.content && typeof lesson.content === 'object');

  const traversal = await fetch(`${base}/api/lessons/..%2Fquestions%2FITEM-TEST`);
  assert.equal(traversal.status, 404);

  console.log(`Academy learner web tests passed; courses=${catalog.courses.length}; sampleLesson=${lessonId}.`);
} finally {
  server.close();
  await once(server, 'close');
}
