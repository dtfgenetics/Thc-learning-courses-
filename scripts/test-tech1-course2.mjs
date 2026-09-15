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
assert.equal(course.extensions?.dedicatedItemCount, 32);

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

const formative = read('content/assessments/ASSESS-LH-TECH1-002-M01.json');
const final = read('content/assessments/ASSESS-LH-TECH1-002-FINAL.json');
assert.equal(formative.purpose, 'formative');
assert.equal(formative.items.length, 12);
assert.equal(final.status, 'draft');
assert.equal(final.purpose, 'summative');
assert.equal(final.items.length, 20);
assert.equal(new Set(final.items).size, 20);
assert.equal(new Set([...formative.items, ...final.items]).size, 32, 'formative and summative Course 002 items must be distinct');
assert.deepEqual(new Set(final.objectives), new Set(['LO-LH-TECH1-002-01','LO-LH-TECH1-002-02','LO-LH-TECH1-002-03','LO-LH-TECH1-002-04','LO-LH-TECH1-002-05']));
const objectiveCounts = new Map(final.objectives.map((id) => [id, 0]));
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
  objectiveCounts.set(item.objective, objectiveCounts.get(item.objective) + 1);
  keyCounts[item.correct]++;
  if (['apply','analyze','evaluate','create'].includes(item.bloomLevel)) appliedOrHigher++;
}
for (const [id, count] of objectiveCounts) assert.ok(count >= 4, `${id} requires at least four course-specific summative items; found ${count}`);
assert.ok(appliedOrHigher >= 18, `Course 002 summative bank should be predominantly applied/analyze; found ${appliedOrHigher}/20`);
assert.ok(Math.max(...keyCounts) <= 6, `summative answer-key positions should be balanced; found ${keyCounts.join(',')}`);
for (const itemId of formative.items) {
  const item = read(`content/questions/${itemId}.json`);
  assert.equal(item.purpose, 'formative');
  assert.ok(formative.objectives.includes(item.objective));
}
assert.equal(final.extensions?.linkedCredentialPractical, 'PRACTICAL-TECH1-A');
console.log('Course 002 production slice passed: four lessons, five objectives, 12 distinct formative items and 20 balanced summative items are wired while release remains draft-gated.');

await import('./test-course2-visual-registry.mjs');
await import('./test-course2-practical-crosswalk.mjs');
