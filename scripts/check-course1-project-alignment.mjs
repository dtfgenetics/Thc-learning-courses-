import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

const courseId = 'COURSE-LH-TECH1-001';
const lessonIds = Array.from({ length: 18 }, (_, index) => `LESSON-LH-TECH1-001-${String(index + 1).padStart(2, '0')}`);
const practiceMap = readJson('docs/learning-hub/tech1/course-001/COURSE1-LESSON-PRACTICE-MAP.json');
const visualRegistry = readJson('visuals/ASSET-REGISTRY.json');

assert.equal(practiceMap.courseId, courseId, 'Course 1 practice map must target the canonical Course 1 ID');
assert.equal(practiceMap.version >= 2, true, 'Course 1 practice map must use the knowledge-check architecture');
assert.equal(practiceMap.architecture?.lessonKnowledgeCheck?.label, 'Lesson Knowledge Check');
assert.equal(practiceMap.architecture?.lessonKnowledgeCheck?.retryable, true, 'Lesson checks must remain retryable');
assert.equal(practiceMap.architecture?.lessonKnowledgeCheck?.formSizeIsCeiling, undefined, 'Lesson checks must not introduce an artificial form-size ceiling');
assert.equal(practiceMap.architecture?.moduleAssessment?.formSizeIsCeiling, false, 'Module assessment inventory must remain expandable');
assert.equal(practiceMap.architecture?.courseFinal?.separateFromCredentialExam, true, 'Course final must remain separate from the professional credential exam');

const mappedLessons = new Map((practiceMap.lessons ?? []).map((entry) => [entry.lessonId, entry]));
assert.equal(mappedLessons.size, 18, 'Course 1 must map exactly its 18 canonical lessons once');

for (const lessonId of lessonIds) {
  const lessonPath = `content/lessons/${lessonId}.json`;
  assert.ok(fs.existsSync(path.join(root, lessonPath)), `${lessonId} must exist`);
  const lesson = readJson(lessonPath);
  const map = mappedLessons.get(lessonId);
  assert.ok(map, `${lessonId} must have a Lesson Knowledge Check mapping`);
  assert.equal(map.knowledgeCheck, 'runtime-objective-aligned', `${lessonId} must use objective-aligned lesson practice`);
  assert.ok(Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0, `${lessonId} must declare learning objectives`);
  assert.ok(map.cumulativeAssessmentId, `${lessonId} must map to a cumulative module assessment`);
  assert.ok(lesson.content?.overview, `${lessonId} must include an instructional overview`);
  assert.ok(Array.isArray(lesson.content?.blocks) && lesson.content.blocks.length > 0, `${lessonId} must use expandable rich lesson blocks`);
  const hasApplication = lesson.content.blocks.some((block) => ['scenario', 'activity', 'document', 'comparison', 'steps'].includes(block.type));
  assert.equal(hasApplication, true, `${lessonId} must include active/application learning, not only explanatory text`);
  const hasRemediation = lesson.content.blocks.some((block) => block.type === 'callout' && /remediation/i.test(block.title ?? ''));
  assert.equal(hasRemediation, true, `${lessonId} must include a remediation cue`);
}

const moduleIds = [...new Set((practiceMap.lessons ?? []).map((entry) => entry.cumulativeAssessmentId))];
assert.deepEqual(moduleIds.sort(), [1,2,3,4,5,6].map((n) => `ASSESS-LH-TECH1-001-M0${n}`).sort(), 'Course 1 must retain six cumulative module assessments');

assert.equal(visualRegistry.courseId, courseId, 'Visual registry must target Course 1');
assert.equal(visualRegistry.policy?.expandable, true, 'Visual system must remain expandable');
assert.equal(visualRegistry.policy?.maximumAssetCount, null, 'Visual system must not impose an asset-count ceiling');

for (const asset of visualRegistry.assets ?? []) {
  assert.ok(asset.id && asset.title && asset.learnerPath && asset.sourcePath, 'Every registered visual needs identity, title and public paths');
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0, `${asset.id} must map to at least one lesson`);
  assert.ok(fs.existsSync(path.join(root, asset.sourcePath)), `${asset.id} public asset must physically exist at ${asset.sourcePath}`);
  for (const lessonId of asset.primaryLessons) {
    assert.ok(lessonIds.includes(lessonId), `${asset.id} must not point outside Course 1`);
  }
}

console.log('Course 1 project alignment gate passed: 18 lessons, knowledge checks, module assessments, rich application/remediation blocks, and public visual registry are structurally aligned.');
