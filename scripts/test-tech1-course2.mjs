import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const readText = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const course = read('content/courses/COURSE-LH-TECH1-002.json');
assert.equal(course.status,'published');
assert.equal(course.extensions?.academicPublicationStatus,'owner-approved-public-academic-release');
assert.equal(course.extensions?.professionalCredentialUseAuthorized,false);
assert.equal(course.finalAssessment, 'ASSESS-LH-TECH1-002-FINAL');
assert.ok(course.modules.includes('MOD-LH-TECH1-002-OBSERVATION'));
assert.equal(course.extensions?.dedicatedCourseAssessmentRequired, false);
assert.equal(course.extensions?.dedicatedPerformanceValidationRequired, true);
assert.equal(course.extensions?.dedicatedItemCount, 32);

const packageArtifacts = [
  'docs/learning-hub/tech1/course-002/COURSE-PACKAGE-MANIFEST.md',
  'docs/learning-hub/tech1/course-002/OBJECTIVE-COVERAGE.md',
  'docs/learning-hub/tech1/course-002/ASSESSMENT-COVERAGE-REPORT.md',
  'docs/learning-hub/tech1/course-002/LEARNER-MATERIALS.md',
  'docs/learning-hub/tech1/course-002/EVIDENCE-DOSSIER.md',
  'docs/learning-hub/tech1/course-002/FINAL-HUMAN-REVIEW-WORKLIST.md',
  'docs/learning-hub/tech1/course-002/instructor/INSTRUCTOR-GUIDE.md',
  'docs/learning-hub/tech1/course-002/instructor/OBJECTIVE-REMEDIATION-MATRIX.md',
  'docs/learning-hub/tech1/course-002/accessibility/COURSE2-RENDERED-ACCESSIBILITY-UX-REVIEW.md',
  'docs/learning-hub/tech1/course-002/assessor/PRACTICAL-A-ASSESSOR-GUIDE.md',
  'docs/learning-hub/tech1/course-002/assessor/PRACTICAL-A-CALIBRATION-VALIDATION-PACKET.md',
  'registry/course2-completion-status.json'
];
for (const artifact of packageArtifacts) assert.ok(exists(artifact), `missing Course 2 package artifact ${artifact}`);

const module = read('content/modules/MOD-LH-TECH1-002-OBSERVATION.json');
assert.equal(module.lessons.length, 4);
assert.equal(module.assessment, 'ASSESS-LH-TECH1-002-M01');
for (const lessonId of module.lessons) {
  assert.ok(exists(`content/lessons/${lessonId}.json`), `missing Course 002 lesson ${lessonId}`);
  const lesson = read(`content/lessons/${lessonId}.json`);
  assert.ok(lesson.estimatedMinutes >= 45);
  assert.ok(lesson.content?.overview?.length >= 40);
  for (const objective of lesson.learningObjectives) assert.ok(exists(`content/learning-objectives/${objective}.json`), `missing objective ${objective}`);
}

const controlledObjectives = [
  'LO-LH-TECH1-002-01',
  'LO-LH-TECH1-002-02',
  'LO-LH-TECH1-002-03',
  'LO-LH-TECH1-002-04',
  'LO-LH-TECH1-002-05'
];

const remediationText = readText('docs/learning-hub/tech1/course-002/instructor/OBJECTIVE-REMEDIATION-MATRIX.md');
for (const objectiveId of controlledObjectives) {
  const marker = `## \`${objectiveId}\``;
  const start = remediationText.indexOf(marker);
  assert.ok(start >= 0, `${objectiveId}: remediation section missing`);
  const next = remediationText.indexOf('\n## `LO-LH-TECH1-002-', start + marker.length);
  const section = remediationText.slice(start, next < 0 ? remediationText.length : next);
  assert.ok(section.includes('**Corrective coaching**'), `${objectiveId}: corrective coaching missing`);
  assert.ok(section.includes('**Return-to-practice**'), `${objectiveId}: return-to-practice missing`);
  assert.ok(section.includes('**Reassessment**'), `${objectiveId}: reassessment guidance missing`);
}

const formative = read('content/assessments/ASSESS-LH-TECH1-002-M01.json');
const final = read('content/assessments/ASSESS-LH-TECH1-002-FINAL.json');
assert.equal(formative.purpose, 'formative');
assert.equal(formative.items.length, 12);
assert.equal(final.status,'published');
assert.equal(final.purpose, 'summative');
assert.equal(final.items.length, 20);
assert.equal(new Set(final.items).size, 20);
assert.equal(new Set([...formative.items, ...final.items]).size, 32, 'formative and summative Course 002 items must be distinct');
assert.deepEqual(new Set(final.objectives), new Set(controlledObjectives));
assert.deepEqual(new Set(formative.objectives), new Set(controlledObjectives));
assert.equal(final.extensions?.courseDerivedAssessment, true, 'Course 2 final must remain explicitly course-derived');
assert.equal(final.extensions?.encyclopediaSubstitutionAllowed, false, 'Encyclopedia material cannot substitute for Course 2 instruction');
assert.equal(final.extensions?.untaughtMaterialAllowed, false, 'Course 2 final cannot assess untaught material');
const taughtMaterialMap = final.extensions?.taughtMaterialMap ?? {};
for (const objectiveId of controlledObjectives) {
  assert.ok(Array.isArray(taughtMaterialMap[objectiveId]) && taughtMaterialMap[objectiveId].length > 0, `${objectiveId}: final must map to dedicated taught material`);
  for (const lessonId of taughtMaterialMap[objectiveId]) {
    assert.match(lessonId, /^LESSON-LH-TECH1-002-/, `${objectiveId}: test-to-teaching map must stay inside Course 2`);
    assert.ok(module.lessons.includes(lessonId), `${objectiveId}: mapped teaching lesson must be in the dedicated Course 2 module`);
    const lesson = read(`content/lessons/${lessonId}.json`);
    assert.ok((lesson.learningObjectives ?? []).includes(objectiveId), `${objectiveId}: mapped lesson ${lessonId} must actually teach the objective`);
  }
}
assert.ok(exists('docs/learning-hub/tech1/course-002/TEST-TO-TEACHING-MAP.md'), 'Course 2 must retain a human-readable test-to-teaching audit');


const summativeObjectiveCounts = new Map(controlledObjectives.map((id) => [id, 0]));
const formativeObjectiveCounts = new Map(controlledObjectives.map((id) => [id, 0]));
const keyCounts = [0,0,0,0];
let appliedOrHigher = 0;
for (const itemId of final.items) {
  const file = `content/questions/${itemId}.json`;
  assert.ok(exists(file), `missing item ${itemId}`);
  const item = read(file);
  assert.equal(item.status, 'draft');
  assert.equal(item.purpose, 'summative');
  assert.ok(final.competencies.includes(item.competency));
  assert.ok(final.objectives.includes(item.objective));
  assert.ok(Array.isArray(item.references) && item.references.length > 0);
  summativeObjectiveCounts.set(item.objective, summativeObjectiveCounts.get(item.objective) + 1);
  keyCounts[item.correct]++;
  if (['apply','analyze','evaluate','create'].includes(item.bloomLevel)) appliedOrHigher++;
}
for (const [id, count] of summativeObjectiveCounts) assert.ok(count >= 4, `${id} requires at least four course-specific summative items; found ${count}`);
const summativeCounts = [...summativeObjectiveCounts.values()];
assert.ok(Math.max(...summativeCounts) - Math.min(...summativeCounts) <= 1, `summative objective distribution should remain balanced; found ${summativeCounts.join(',')}`);
assert.ok(appliedOrHigher >= 18, `Course 002 summative bank should be predominantly applied/analyze; found ${appliedOrHigher}/20`);
assert.ok(Math.max(...keyCounts) <= 6, `summative answer-key positions should be balanced; found ${keyCounts.join(',')}`);

for (const itemId of formative.items) {
  const file = `content/questions/${itemId}.json`;
  assert.ok(exists(file), `missing formative item ${itemId}`);
  const item = read(file);
  assert.equal(item.purpose, 'formative');
  assert.ok(formative.objectives.includes(item.objective));
  assert.ok(Array.isArray(item.references) && item.references.length > 0, `${itemId} must retain evidence references`);
  formativeObjectiveCounts.set(item.objective, formativeObjectiveCounts.get(item.objective) + 1);
}
for (const [id, count] of formativeObjectiveCounts) assert.ok(count >= 1, `${id} requires at least one formative item; found ${count}`);
assert.equal([...formativeObjectiveCounts.values()].reduce((sum, count) => sum + count, 0), 12);
assert.equal([...summativeObjectiveCounts.values()].reduce((sum, count) => sum + count, 0), 20);
assert.equal(final.extensions?.linkedCredentialPractical, 'PRACTICAL-TECH1-A');

await import('./test-course2-visual-registry.mjs');
await import('./test-course2-practical-crosswalk.mjs');

const completionStatus = read('registry/course2-completion-status.json');
assert.equal(completionStatus.courseId, course.id);
assert.equal(completionStatus.academicPublication, 'published');
assert.equal(completionStatus.machineResolvableWorkComplete, true, 'Course 2 machine-resolvable work must be complete after owner-approved raster cutover and verified deployed surface QA');
assert.equal(completionStatus.certificationEvidenceValidated, false, 'Course 2 academic machine completion must not imply validated professional credential evidence');
assert.equal(completionStatus.nextMachineActions.length, 0, 'Course 2 cannot retain machine actions after verified raster cutover');
assert.equal(completionStatus.goldStandardPackageComplete, false);
assert.equal(completionStatus.certificationEvidenceValidated, false);
assert.equal(completionStatus.deployedMachineSurfaceQa?.state, 'verified', 'Course 2 machine completion requires verified deployed learner-surface QA');
assert.equal(completionStatus.ownerReleaseApproval?.state, 'approved', 'Course 2 owner-approved academic raster release must be recorded');
assert.ok((completionStatus.nextHumanActions ?? []).length > 0, 'Course 2 must retain real human validation gates');

const visualRegistry = read('visuals/COURSE2-ASSET-REGISTRY.json');
const producedAssets = (visualRegistry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.equal(producedAssets.length, 10, 'Course 2 should expose the current 10 governed learner assets');

const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`;

  const catalogResponse = await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status, 200, 'Course 2 staging catalog should be available');
  const catalog = await catalogResponse.json();
  const courseTwo = (catalog.courses ?? []).find((entry) => entry.id === course.id);
  assert.ok(courseTwo, 'Course 2 must appear in the draft-preview Academy catalog');
  const observationModule = (courseTwo.modules ?? []).find((entry) => entry.id === module.id);
  assert.ok(observationModule, 'Course 2 dedicated observation module must appear in the learner catalog graph');
  const catalogLessonIds = (observationModule.lessons ?? []).map((entry) => entry.id).filter(Boolean);
  assert.deepEqual(catalogLessonIds, module.lessons, 'Course 2 dedicated lesson ordering must match the canonical module');

  for (const lessonId of module.lessons) {
    const sourceLesson = read(`content/lessons/${lessonId}.json`);
    const lessonResponse = await fetch(`${base}/api/lessons/${lessonId}`);
    assert.equal(lessonResponse.status, 200, `${lessonId} should be reachable through the learner lesson endpoint`);
    const lesson = await lessonResponse.json();
    assert.equal(lesson.id, lessonId);
    assert.equal(Object.hasOwn(lesson, 'assessment'), false, `${lessonId} learner projection must not expose assessment source linkage`);
    assert.equal(Object.hasOwn(lesson, 'questions'), false, `${lessonId} learner projection must not expose raw question objects`);
    assert.ok(Array.isArray(lesson.content?.blocks) && lesson.content.blocks.length > 0, `${lessonId} must expose ordered rich content blocks`);
    for (const block of lesson.content.blocks) {
      if (block.type === 'image') {
        assert.match(block.src ?? '', /^\/assets\/course2\/[A-Za-z0-9._-]+\.webp$/, `${lessonId} image blocks must use governed Course 2 WebP asset paths`);
        assert.ok(typeof block.alt === 'string' && block.alt.trim().length > 0, `${lessonId} image blocks must retain learner-facing alt text`);
      }
    }

    const practiceResponse = await fetch(`${base}/api/lessons/${lessonId}/practice?seed=course2-route-qa`);
    assert.equal(practiceResponse.status, 200, `${lessonId} practice endpoint should be reachable`);
    const practice = await practiceResponse.json();
    assert.equal(practice.presentationSeed, 'course2-route-qa');
    assert.ok(Array.isArray(practice.items) && practice.items.length > 0, `${lessonId} should expose objective-aligned formative practice in draft preview`);
    const lessonObjectives = new Set(sourceLesson.learningObjectives ?? []);
    assert.ok(practice.items.every((item) => lessonObjectives.has(item.objective)), `${lessonId} practice must stay inside the lesson objective set`);
    for (const item of practice.items) {
      assert.equal(Object.hasOwn(item, 'correct'), false, `${item.id} pre-answer practice projection must not expose the shuffled answer key`);
      assert.equal(Object.hasOwn(item, 'rationale'), false, `${item.id} pre-answer practice projection must not expose the source rationale`);
      assert.equal(Object.hasOwn(item, 'references'), false, `${item.id} learner practice projection should not expose internal source-reference IDs`);
    }

    const sample = practice.items[0];
    const gradeResponse = await fetch(`${base}/api/lessons/${lessonId}/practice/grade`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ itemId: sample.id, selectedIndex: 0, presentationSeed: practice.presentationSeed })
    });
    assert.equal(gradeResponse.status, 200, `${lessonId} should provide post-response formative feedback`);
    const grade = await gradeResponse.json();
    assert.equal(grade.itemId, sample.id);
    assert.equal(typeof grade.isCorrect, 'boolean');
    assert.ok(typeof grade.correctChoice === 'string' && sample.choices.includes(grade.correctChoice), `${sample.id} grading feedback should identify a presented choice`);
    assert.ok(typeof grade.rationale === 'string', `${sample.id} grading feedback should provide post-answer rationale`);
  }

  const moduleResponse = await fetch(`${base}/api/modules/${module.id}/assessment?seed=course2-module-qa`);
  assert.equal(moduleResponse.status, 200, 'Course 2 module checkpoint should be reachable in draft preview');
  const moduleCheckpoint = await moduleResponse.json();
  assert.equal(moduleCheckpoint.presentationSeed, 'course2-module-qa');
  assert.equal(moduleCheckpoint.items.length, formative.items.length);
  for (const item of moduleCheckpoint.items) {
    assert.equal(Object.hasOwn(item, 'correct'), false, `${item.id} module checkpoint must not expose the shuffled answer key before response`);
    assert.equal(Object.hasOwn(item, 'rationale'), false, `${item.id} module checkpoint must not expose rationale before response`);
    assert.equal(Object.hasOwn(item, 'references'), false, `${item.id} module checkpoint must not expose internal source-reference IDs`);
  }
  const moduleSample = moduleCheckpoint.items[0];
  const moduleGradeResponse = await fetch(`${base}/api/modules/${module.id}/assessment/grade`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ itemId: moduleSample.id, selectedIndex: 0, presentationSeed: moduleCheckpoint.presentationSeed })
  });
  assert.equal(moduleGradeResponse.status, 200, 'Course 2 module checkpoint should grade only after a learner response');
  const moduleGrade = await moduleGradeResponse.json();
  assert.equal(moduleGrade.itemId, moduleSample.id);
  assert.equal(typeof moduleGrade.isCorrect, 'boolean');
  assert.ok(typeof moduleGrade.correctChoice === 'string' && moduleSample.choices.includes(moduleGrade.correctChoice));
  assert.ok(typeof moduleGrade.rationale === 'string');

  const invalidGrade = await fetch(`${base}/api/modules/${module.id}/assessment/grade`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ itemId: moduleSample.id, selectedIndex: 0, presentationSeed: 'bad seed with spaces' })
  });
  assert.equal(invalidGrade.status, 400, 'invalid presentation seeds must fail closed rather than grading against a new random form');

  for (const asset of producedAssets) {
    assert.match(asset.learnerPath ?? '', /^\/assets\/course2\/[A-Za-z0-9._-]+\.webp$/, `${asset.id} should use a controlled Course 2 WebP learner path`);
    const response = await fetch(`${base}${asset.learnerPath}`);
    assert.equal(response.status, 200, `${asset.learnerPath} should be delivered by the Academy runtime`);
    assert.match(response.headers.get('content-type') ?? '', /^image\/webp/, `${asset.learnerPath} should use the WebP content type`);
    const body = Buffer.from(await response.arrayBuffer());
    assert.ok(body.length > 0, `${asset.learnerPath} should return raster bytes`);
  }
  const invalidCourseDirectory = await fetch(`${base}/assets/course2x/representative-crop-walk-route.webp`);
  assert.equal(invalidCourseDirectory.status, 404, 'course asset routing must only accept course<number> directories');
  const missingAsset = await fetch(`${base}/assets/course2/not-a-real-asset.webp`);
  assert.equal(missingAsset.status, 404, 'course asset routing must return 404 for missing controlled assets');
} finally {
  server.close();
  await once(server, 'close');
}

console.log(`Course 002 production slice passed: four lessons, five objectives, ${[...formativeObjectiveCounts.values()].join('/')} formative distribution, ${[...summativeObjectiveCounts.values()].join('/')} summative distribution, remediation/reassessment package, Practical A crosswalk/assessor controls, secure learner catalog/lesson/practice/module-checkpoint routes with server-side grading, visual registry, and all governed Course 2 WebP learner assets are wired through the Academy runtime while professional credential validation remains separately gated.`);
