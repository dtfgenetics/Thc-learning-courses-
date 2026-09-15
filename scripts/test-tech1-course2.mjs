import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));
const course = read('content/courses/COURSE-LH-TECH1-002.json');
assert.equal(course.status, 'draft');
assert.equal(course.finalAssessment, 'ASSESS-LH-TECH1-002-FINAL');
assert.ok(course.modules.includes('MOD-LH-TECH1-002-OBSERVATION'));
assert.equal(course.extensions?.dedicatedCourseAssessmentRequired, false);
assert.equal(course.extensions?.dedicatedPerformanceValidationRequired, true);

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

const final = read('content/assessments/ASSESS-LH-TECH1-002-FINAL.json');
assert.equal(final.status, 'draft');
assert.equal(final.purpose, 'summative');
assert.equal(final.items.length, 20);
assert.equal(new Set(final.items).size, 20);
assert.deepEqual(new Set(final.objectives), new Set(['LO-LH-TECH1-002-01','LO-LH-TECH1-002-02','LO-LH-TECH1-002-03','LO-LH-TECH1-002-04','LO-LH-TECH1-002-05']));
const objectiveCounts = new Map(final.objectives.map((id) => [id, 0]));
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
  objectiveCounts.set(item.objective, objectiveCounts.get(item.objective) + 1);
  if (['apply','analyze','evaluate','create'].includes(item.bloomLevel)) appliedOrHigher++;
}
for (const [id, count] of objectiveCounts) assert.ok(count >= 4, `${id} requires at least four course-specific items; found ${count}`);
assert.ok(appliedOrHigher >= 18, `Course 002 bank should be predominantly applied/analyze; found ${appliedOrHigher}/20`);
assert.equal(final.extensions?.linkedCredentialPractical, 'PRACTICAL-TECH1-A');
console.log('Course 002 production slice passed: four dedicated lessons, five objectives and twenty source-backed course items are wired while release remains draft-gated.');
