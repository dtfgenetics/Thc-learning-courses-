import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));

const course = read('content/courses/COURSE-LH-TECH1-004.json');
assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false);
assert.equal(course.finalAssessment, 'ASSESS-LH-TECH1-004-FINAL');
assert.ok(course.modules.includes('MOD-LH-TECH1-004-IRRIGATION'));
assert.equal(course.extensions?.dedicatedCourseAssessmentRequired, false);
assert.equal(course.extensions?.dedicatedPerformanceValidationRequired, true);
assert.equal(course.extensions?.mappedPractical, 'PRACTICAL-TECH1-B');
assert.equal(course.extensions?.dedicatedItemCount, 36);
assert.equal(course.extensions?.learnerAssetLayerBuilt, true);
assert.equal(course.extensions?.totalLearnerAssetCount, 8);

const module = read('content/modules/MOD-LH-TECH1-004-IRRIGATION.json');
assert.equal(module.lessons.length, 4);
for (const id of module.lessons) {
  assert.ok(exists(`content/lessons/${id}.json`), `missing Course 004 lesson ${id}`);
  const lesson = read(`content/lessons/${id}.json`);
  assert.ok(lesson.estimatedMinutes >= 45, `${id} should retain substantive learner time`);
  assert.ok(lesson.content?.overview?.length >= 40, `${id} should retain a substantive overview`);
  assert.ok(lesson.content?.summary?.length >= 40, `${id} should retain a substantive summary`);
  assert.ok((lesson.content?.blocks ?? []).length > 0, `${id} should retain rich instructional blocks`);
  assert.ok((lesson.references ?? []).length > 0, `${id} should retain evidence references`);
  for (const objective of lesson.learningObjectives ?? []) {
    assert.ok(exists(`content/learning-objectives/${objective}.json`), `missing objective ${objective}`);
  }
}

const formative = read('content/assessments/ASSESS-LH-TECH1-004-M01.json');
const final = read('content/assessments/ASSESS-LH-TECH1-004-FINAL.json');
assert.equal(formative.purpose, 'formative');
assert.equal(formative.items.length, 12);
assert.equal(final.status,'published');
assert.equal(final.purpose, 'summative');
assert.equal(final.items.length, 24);
assert.equal(new Set(final.items).size, 24);
assert.equal(new Set([...formative.items, ...final.items]).size, 36, 'Course 004 formative and summative items must remain distinct');

const expectedObjectives = [
  'LO-LH-TECH1-004-01',
  'LO-LH-TECH1-004-02',
  'LO-LH-TECH1-004-03',
  'LO-LH-TECH1-004-04',
  'LO-LH-TECH1-004-05',
  'LO-LH-TECH1-004-06'
];
assert.deepEqual(new Set(final.objectives), new Set(expectedObjectives));
assert.deepEqual(new Set(formative.objectives), new Set(expectedObjectives));
assert.equal(final.extensions?.courseDerivedAssessment, true, 'Course 4 final must remain explicitly course-derived');
assert.equal(final.extensions?.encyclopediaSubstitutionAllowed, false, 'Encyclopedia material cannot substitute for Course 4 instruction');
assert.equal(final.extensions?.untaughtMaterialAllowed, false, 'Course 4 final cannot assess untaught material');
const taughtMaterialMap = final.extensions?.taughtMaterialMap ?? {};
for (const objectiveId of expectedObjectives) {
  assert.ok(Array.isArray(taughtMaterialMap[objectiveId]) && taughtMaterialMap[objectiveId].length > 0, `${objectiveId}: final must map to dedicated taught material`);
  for (const lessonId of taughtMaterialMap[objectiveId]) {
    assert.match(lessonId, /^LESSON-LH-TECH1-004-/, `${objectiveId}: test-to-teaching map must stay inside Course 4`);
    assert.ok(module.lessons.includes(lessonId), `${objectiveId}: mapped lesson must belong to the dedicated Course 4 module`);
    const lesson = read(`content/lessons/${lessonId}.json`);
    assert.ok((lesson.learningObjectives ?? []).includes(objectiveId), `${objectiveId}: mapped lesson ${lessonId} must actually teach the objective`);
  }
}
assert.ok(exists('docs/learning-hub/tech1/course-004/TEST-TO-TEACHING-MAP.md'), 'Course 4 must retain a human-readable test-to-teaching audit');


const summativeCounts = new Map(expectedObjectives.map((id) => [id, 0]));
const formativeCounts = new Map(expectedObjectives.map((id) => [id, 0]));
const keyCounts = [0, 0, 0, 0];
let appliedOrHigher = 0;

for (const id of final.items) {
  const q = read(`content/questions/${id}.json`);
  assert.equal(q.purpose, 'summative');
  assert.ok(Array.isArray(q.references) && q.references.length > 0, `${id} must retain evidence references`);
  assert.ok(final.competencies.includes(q.competency), `${id} competency should be controlled by final assessment`);
  assert.ok(final.objectives.includes(q.objective), `${id} objective should be controlled by final assessment`);
  summativeCounts.set(q.objective, summativeCounts.get(q.objective) + 1);
  keyCounts[q.correct]++;
  if (['apply', 'analyze', 'evaluate', 'create'].includes(q.bloomLevel)) appliedOrHigher++;
}
for (const [id, count] of summativeCounts) assert.equal(count, 4, `${id} should have four summative items; found ${count}`);
assert.ok(appliedOrHigher >= 22, `Course 004 final should remain predominantly applied/analyze; found ${appliedOrHigher}/24`);
assert.ok(Math.max(...keyCounts) <= 6, `unbalanced key positions: ${keyCounts.join(',')}`);

for (const id of formative.items) {
  const q = read(`content/questions/${id}.json`);
  assert.equal(q.purpose, 'formative');
  assert.ok(formative.objectives.includes(q.objective), `${id} objective should be controlled by formative assessment`);
  assert.ok(Array.isArray(q.references) && q.references.length > 0, `${id} must retain evidence references`);
  formativeCounts.set(q.objective, formativeCounts.get(q.objective) + 1);
}
assert.deepEqual([...formativeCounts.values()], [2, 2, 2, 2, 2, 2], 'Course 004 formative distribution changed; review objective balance before accepting the new bank');

const packageFiles = [
  'docs/learning-hub/tech1/course-004/OBJECTIVE-COVERAGE.md',
  'docs/learning-hub/tech1/course-004/LEARNER-MATERIALS.md',
  'docs/learning-hub/tech1/course-004/EVIDENCE-DOSSIER.md',
  'docs/learning-hub/tech1/course-004/instructor/INSTRUCTOR-GUIDE.md',
  'docs/learning-hub/tech1/course-004/instructor/OBJECTIVE-REMEDIATION-MATRIX.md',
  'docs/learning-hub/tech1/course-004/assessor/PRACTICAL-B-ASSESSOR-GUIDE.md',
  'docs/learning-hub/tech1/course-004/assessor/PRACTICAL-B-CALIBRATION-VALIDATION-PACKET.md',
  'docs/learning-hub/tech1/course-004/accessibility/COURSE4-RENDERED-ACCESSIBILITY-UX-REVIEW.md',
  'docs/learning-hub/tech1/course-004/FINAL-HUMAN-REVIEW-WORKLIST.md',
  'docs/learning-hub/tech1/course-004/COURSE-PACKAGE-MANIFEST.md'
];
for (const file of packageFiles) assert.ok(exists(file), `missing Course 004 package artifact ${file}`);

await import('./test-course4-practical-crosswalk.mjs');
await import('./test-course4-visual-registry.mjs');

const visualRegistry = read('visuals/COURSE4-ASSET-REGISTRY.json');
const producedAssets = (visualRegistry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.equal(producedAssets.length, 8, 'Course 4 should expose the current eight governed learner assets');
assert.equal(producedAssets.filter((asset) => asset.deliveryType === 'embedded-visual').length, 6);
assert.equal(producedAssets.filter((asset) => asset.deliveryType === 'downloadable-practice').length, 2);

const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const asset of producedAssets) {
    assert.match(asset.learnerPath ?? '', /^\/assets\/course4\/[A-Za-z0-9._-]+\.webp$/, `${asset.id} should use the owner-approved Course 4 WebP learner path`);
    const response = await fetch(`${base}${asset.learnerPath}`);
    assert.equal(response.status, 200, `${asset.learnerPath} should be delivered by the Academy runtime`);
    assert.match(response.headers.get('content-type') ?? '', /^image\/webp/, `${asset.learnerPath} should use the WebP content type`);
  }
  const invalidCourseDirectory = await fetch(`${base}/assets/course4x/sample-ph-ec-context.webp`);
  assert.equal(invalidCourseDirectory.status, 404, 'course asset routing must only accept course<number> directories');
  const missingAsset = await fetch(`${base}/assets/course4/not-a-real-asset.webp`);
  assert.equal(missingAsset.status, 404, 'course asset routing must return 404 for missing controlled assets');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 004 production slice passed: four lessons, six objectives, 12 referenced formative items, 24 balanced summative items, complete package artifacts, Practical B crosswalk, visual registry and all eight governed Course 4 learner assets are wired through the Academy runtime while human/release gates remain open.');
