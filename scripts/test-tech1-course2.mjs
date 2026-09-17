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
assert.equal(course.status, 'draft');
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
assert.equal(final.status, 'draft');
assert.equal(final.purpose, 'summative');
assert.equal(final.items.length, 20);
assert.equal(new Set(final.items).size, 20);
assert.equal(new Set([...formative.items, ...final.items]).size, 32, 'formative and summative Course 002 items must be distinct');
assert.deepEqual(new Set(final.objectives), new Set(controlledObjectives));
assert.deepEqual(new Set(formative.objectives), new Set(controlledObjectives));

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
assert.equal(completionStatus.academicPublication, 'draft');
assert.equal(completionStatus.machineResolvableWorkComplete, false);
assert.equal(completionStatus.goldStandardPackageComplete, false);
assert.equal(completionStatus.certificationEvidenceValidated, false);
assert.ok((completionStatus.nextMachineActions ?? []).length > 0, 'Course 2 must remain fail-closed while machine work remains');
assert.ok((completionStatus.nextHumanActions ?? []).length > 0, 'Course 2 must retain real human validation gates');

const visualRegistry = read('visuals/COURSE2-ASSET-REGISTRY.json');
const producedAssets = (visualRegistry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.equal(producedAssets.length, 10, 'Course 2 should expose the current 10 governed learner assets');

const server = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const asset of producedAssets) {
    assert.match(asset.learnerPath ?? '', /^\/assets\/course2\/[A-Za-z0-9._-]+\.svg$/, `${asset.id} should use a controlled Course 2 learner path`);
    const response = await fetch(`${base}${asset.learnerPath}`);
    assert.equal(response.status, 200, `${asset.learnerPath} should be delivered by the Academy runtime`);
    assert.match(response.headers.get('content-type') ?? '', /^image\/svg\+xml/, `${asset.learnerPath} should use the SVG content type`);
    const svg = await response.text();
    assert.match(svg, /<svg[\s>]/, `${asset.learnerPath} should contain SVG markup`);
    assert.match(svg, /<title[\s>]/, `${asset.learnerPath} should include an accessible title`);
    assert.match(svg, /<desc[\s>]/, `${asset.learnerPath} should include an accessible description`);
  }
  const invalidCourseDirectory = await fetch(`${base}/assets/course2x/representative-crop-walk-route.svg`);
  assert.equal(invalidCourseDirectory.status, 404, 'course asset routing must only accept course<number> directories');
  const missingAsset = await fetch(`${base}/assets/course2/not-a-real-asset.svg`);
  assert.equal(missingAsset.status, 404, 'course asset routing must return 404 for missing controlled assets');
} finally {
  server.close();
  await once(server, 'close');
}

console.log(`Course 002 production slice passed: four lessons, five objectives, ${[...formativeObjectiveCounts.values()].join('/')} formative distribution, ${[...summativeObjectiveCounts.values()].join('/')} summative distribution, remediation/reassessment package, Practical A crosswalk/assessor controls, visual registry, and all governed Course 2 learner assets are wired through the Academy runtime while release remains draft-gated.`);
