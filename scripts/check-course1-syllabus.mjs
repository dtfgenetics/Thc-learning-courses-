import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const syllabus = fs.readFileSync(path.join(root, 'docs/learning-hub/tech1/course-001/COURSE-SYLLABUS.md'), 'utf8');
const course = readJson('content/courses/COURSE-LH-TECH1-001.json');
const assessment = readJson(`content/assessments/${course.finalAssessment}.json`);
const practical = readJson('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json');

function normalized(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function includesNormalized(haystack, needle) {
  return normalized(haystack).includes(normalized(needle));
}

assert.equal(course.status, 'published');
assert.match(syllabus, new RegExp(course.id));
assert.match(syllabus, new RegExp(course.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(syllabus, new RegExp(`\\*\\*Version:\\*\\*\\s+${course.version.replaceAll('.', '\\.')}`));

const lessonIds = [];
let lessonMinutes = 0;
const moduleTitles = [];
const objectiveIds = new Set();
for (const moduleId of course.modules ?? []) {
  const module = readJson(`content/modules/${moduleId}.json`);
  moduleTitles.push(module.title);
  assert.equal(module.status, 'published', `${module.id} must be published`);
  assert.ok(syllabus.includes(module.title), `syllabus must include module title ${module.title}`);
  for (const lessonId of module.lessons ?? []) {
    lessonIds.push(lessonId);
    const lesson = readJson(`content/lessons/${lessonId}.json`);
    lessonMinutes += Number(lesson.estimatedMinutes ?? 0);
    for (const objectiveId of lesson.learningObjectives ?? lesson.objectives ?? []) objectiveIds.add(objectiveId);
  }
}
assert.equal(course.modules.length, 6, 'Course 1 syllabus assumes the canonical six-module sequence');
assert.equal(lessonIds.length, 18, 'Course 1 syllabus must represent all 18 canonical lessons');
assert.equal(lessonMinutes, 945, 'Course 1 current lesson estimate must remain 945 minutes until canonical lesson estimates change');
assert.match(syllabus, /945 minutes\s*\/\s*15\.75 hours/i);

for (const objectiveId of assessment.objectives ?? []) objectiveIds.add(objectiveId);
assert.equal(objectiveIds.size, 12, 'Course 1 must expose 12 canonical learning objectives');
for (const objectiveId of objectiveIds) {
  const objective = readJson(`content/learning-objectives/${objectiveId}.json`);
  assert.equal(objective.status, 'published', `${objectiveId} must be published`);
  assert.ok(syllabus.includes(objectiveId), `syllabus must include ${objectiveId}`);
  assert.ok(includesNormalized(syllabus, objective.statement), `syllabus must preserve the canonical statement for ${objectiveId}`);
}

for (const competencyId of course.competencies ?? []) {
  const competency = readJson(`content/competencies/${competencyId}.json`);
  assert.equal(competency.status, 'published', `${competencyId} must be published`);
  assert.ok(includesNormalized(syllabus, competency.title), `syllabus must name competency ${competency.title}`);
}

assert.equal(Number(assessment.passingScorePercent), 80);
assert.match(syllabus, /at least \*\*80% overall\*\*/i);
const competencyMinimums = assessment.extensions?.gradingPolicy?.competencyMinimums ?? {};
for (const [competencyId, minimum] of Object.entries(competencyMinimums)) {
  const competency = readJson(`content/competencies/${competencyId}.json`);
  const relevantBlock = normalized(syllabus);
  assert.ok(relevantBlock.includes(normalized(competency.title)), `syllabus grading section must identify ${competency.title}`);
  assert.match(syllabus, new RegExp(`${Number(minimum)}%`), `syllabus must include ${competencyId} minimum ${minimum}%`);
}

assert.equal(Number(practical.scoring.totalPoints), 100);
assert.equal(Number(practical.passingStandard.minimumPercent), 80);
assert.equal(practical.passingStandard.noCriticalErrors, true);
assert.match(syllabus, /eight domains for 100 points/i);
assert.match(syllabus, /zero critical errors/i);
assert.match(syllabus, /every required evidence output reviewed/i);
assert.match(syllabus, /every required evidence output verified/i);
for (const domain of practical.scoring.domains ?? []) assert.ok(includesNormalized(syllabus, domain.name), `syllabus must name practical domain ${domain.name}`);

for (const phrase of [
  'all 18 canonical lesson IDs completed',
  'the public Course 1 final passed',
  'the Course 1 integrated practical passed',
  'does not automatically award THC Cultivation Technician I',
  'no fixed attempt cap or cooldown',
  'Academic integrity',
  'Accessibility and accommodations',
  'Technical requirements',
  'Learner support',
  'Evidence and source policy',
  'Continuous improvement'
]) assert.ok(includesNormalized(syllabus, phrase), `syllabus missing academic-course contract: ${phrase}`);

for (const sourceFamily of ['OSHA', 'NIOSH', 'EPA Worker Protection Standard', 'GS1', 'HSE', 'MHRA']) assert.ok(syllabus.includes(sourceFamily), `syllabus must identify source family ${sourceFamily}`);
assert.equal(/guaranteed\s+credential/i.test(syllabus), false, 'syllabus must not promise credential issuance');
assert.equal(/academic\s+credit\s+hours?/i.test(syllabus), false, 'syllabus must not claim academic credit hours');

console.log(`Course 1 syllabus audit passed: ${course.modules.length} modules, ${lessonIds.length} lessons, ${lessonMinutes} minutes, ${objectiveIds.size} outcomes, ${course.competencies.length} competencies, and canonical written/practical completion rules are represented.`);
