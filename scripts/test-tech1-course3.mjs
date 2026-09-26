import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));

const course = read('content/courses/COURSE-LH-TECH1-003.json');
assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false);
assert.equal(course.finalAssessment, 'ASSESS-LH-TECH1-003-FINAL');
assert.ok(course.modules.includes('MOD-LH-TECH1-003-MONITORING'));
assert.equal(course.extensions?.dedicatedCourseAssessmentRequired, false);
assert.equal(course.extensions?.dedicatedPerformanceValidationRequired, true);
assert.equal(course.extensions?.dedicatedItemCount, 32);
assert.equal(course.extensions?.learnerAssetLayerBuilt, true);
assert.equal(course.extensions?.totalLearnerAssetCount, 7);

const module = read('content/modules/MOD-LH-TECH1-003-MONITORING.json');
assert.equal(module.lessons.length, 4);
for (const id of module.lessons) {
  assert.ok(exists(`content/lessons/${id}.json`), `missing Course 003 lesson ${id}`);
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

const formative = read('content/assessments/ASSESS-LH-TECH1-003-M01.json');
const final = read('content/assessments/ASSESS-LH-TECH1-003-FINAL.json');
assert.equal(formative.purpose, 'formative');
assert.equal(formative.items.length, 12);
assert.equal(final.status,'published');
assert.equal(final.purpose, 'summative');
assert.equal(final.items.length, 20);
assert.equal(new Set(final.items).size, 20);
assert.equal(new Set([...formative.items, ...final.items]).size, 32, 'Course 003 formative and summative items must be distinct');

const expectedObjectives = ['LO-LH-TECH1-003-01','LO-LH-TECH1-003-02','LO-LH-TECH1-003-03','LO-LH-TECH1-003-04','LO-LH-TECH1-003-05'];
assert.deepEqual(new Set(final.objectives), new Set(expectedObjectives));
assert.deepEqual(new Set(formative.objectives), new Set(expectedObjectives));
assert.equal(final.extensions?.courseDerivedAssessment, true, 'Course 3 final must remain explicitly course-derived');
assert.equal(final.extensions?.encyclopediaSubstitutionAllowed, false, 'Encyclopedia material cannot substitute for Course 3 instruction');
assert.equal(final.extensions?.untaughtMaterialAllowed, false, 'Course 3 final cannot assess untaught material');
const taughtMaterialMap = final.extensions?.taughtMaterialMap ?? {};
for (const objectiveId of expectedObjectives) {
  assert.ok(Array.isArray(taughtMaterialMap[objectiveId]) && taughtMaterialMap[objectiveId].length > 0, `${objectiveId}: final must map to dedicated taught material`);
  for (const lessonId of taughtMaterialMap[objectiveId]) {
    assert.match(lessonId, /^LESSON-LH-TECH1-003-/, `${objectiveId}: test-to-teaching map must stay inside Course 3`);
    assert.ok(module.lessons.includes(lessonId), `${objectiveId}: mapped teaching lesson must be in the dedicated Course 3 module`);
    const lesson = read(`content/lessons/${lessonId}.json`);
    assert.ok((lesson.learningObjectives ?? []).includes(objectiveId), `${objectiveId}: mapped lesson ${lessonId} must actually teach the objective`);
  }
}
assert.ok(exists('docs/learning-hub/tech1/course-003/TEST-TO-TEACHING-MAP.md'), 'Course 3 must retain a human-readable test-to-teaching audit');


const summativeCounts = new Map(expectedObjectives.map((id) => [id, 0]));
const formativeCounts = new Map(expectedObjectives.map((id) => [id, 0]));
const keyCounts = [0, 0, 0, 0];
let appliedOrHigher = 0;

for (const id of final.items) {
  const q = read(`content/questions/${id}.json`);
  assert.equal(q.status, 'draft');
  assert.equal(q.purpose, 'summative');
  assert.ok(final.competencies.includes(q.competency), `${id} competency should be controlled by final assessment`);
  assert.ok(final.objectives.includes(q.objective), `${id} objective should be controlled by final assessment`);
  assert.ok(Array.isArray(q.references) && q.references.length > 0, `${id} must retain evidence references`);
  summativeCounts.set(q.objective, summativeCounts.get(q.objective) + 1);
  keyCounts[q.correct]++;
  if (['apply', 'analyze', 'evaluate', 'create'].includes(q.bloomLevel)) appliedOrHigher++;
}
for (const [id, count] of summativeCounts) {
  assert.ok(count >= 4, `${id} needs >=4 summative items, found ${count}`);
}
assert.ok(appliedOrHigher >= 18, `Course 003 final should be predominantly applied/analyze; found ${appliedOrHigher}/20`);
assert.ok(Math.max(...keyCounts) <= 6, `unbalanced key positions: ${keyCounts.join(',')}`);

for (const id of formative.items) {
  const q = read(`content/questions/${id}.json`);
  assert.equal(q.status, 'draft');
  assert.equal(q.purpose, 'formative');
  assert.ok(formative.objectives.includes(q.objective), `${id} objective should be controlled by formative assessment`);
  assert.ok(Array.isArray(q.references) && q.references.length > 0, `${id} must retain evidence references`);
  formativeCounts.set(q.objective, formativeCounts.get(q.objective) + 1);
}
for (const [id, count] of formativeCounts) {
  assert.ok(count >= 1, `${id} needs formative coverage, found ${count}`);
}
assert.deepEqual([...formativeCounts.values()], [2, 2, 3, 2, 3], 'Course 003 formative distribution changed; review objective balance before accepting the new bank');

const packageFiles = [
  'docs/learning-hub/tech1/course-003/OBJECTIVE-COVERAGE.md',
  'docs/learning-hub/tech1/course-003/LEARNER-MATERIALS.md',
  'docs/learning-hub/tech1/course-003/EVIDENCE-DOSSIER.md',
  'docs/learning-hub/tech1/course-003/instructor/INSTRUCTOR-GUIDE.md',
  'docs/learning-hub/tech1/course-003/instructor/OBJECTIVE-REMEDIATION-MATRIX.md',
  'docs/learning-hub/tech1/course-003/accessibility/COURSE3-RENDERED-ACCESSIBILITY-UX-REVIEW.md',
  'docs/learning-hub/tech1/course-003/FINAL-HUMAN-REVIEW-WORKLIST.md',
  'docs/learning-hub/tech1/course-003/COURSE-PACKAGE-MANIFEST.md'
];
for (const file of packageFiles) assert.ok(exists(file), `missing Course 003 package artifact ${file}`);

await import('./test-course3-practical-crosswalk.mjs');
await import('./test-course3-visual-registry.mjs');

const crosswalk = read('registry/course3-practical-a-crosswalk.json');
assert.equal(crosswalk.courseSpecificReadiness?.learnerAssetLayerBuilt, true, 'Course 003 practical crosswalk should reflect the produced learner asset layer');

const visualRegistry = read('visuals/COURSE3-ASSET-REGISTRY.json');
const producedAssets = (visualRegistry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.equal(producedAssets.length, 7, 'Course 3 should expose the current seven governed learner assets');

const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const asset of producedAssets) {
    assert.match(asset.learnerPath ?? '', /^\/assets\/course3\/[A-Za-z0-9._-]+\.webp$/, `${asset.id} should use the owner-approved Course 3 WebP learner path`);
    const response = await fetch(`${base}${asset.learnerPath}`);
    assert.equal(response.status, 200, `${asset.learnerPath} should be delivered by the Academy runtime`);
    assert.match(response.headers.get('content-type') ?? '', /^image\/webp/, `${asset.learnerPath} should use the WebP content type`);
  }
  const invalidCourseDirectory = await fetch(`${base}/assets/course3x/environment-measurement-context.webp`);
  assert.equal(invalidCourseDirectory.status, 404, 'course asset routing must only accept course<number> directories');
  const missingAsset = await fetch(`${base}/assets/course3/not-a-real-asset.webp`);
  assert.equal(missingAsset.status, 404, 'course asset routing must return 404 for missing controlled assets');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 003 production slice passed: four lessons, five objectives, 12 referenced formative items, 20 balanced summative items, complete package artifacts, Practical A crosswalk, visual registry and all seven governed Course 3 learner assets are wired through the Academy runtime while human/release gates remain open.');
