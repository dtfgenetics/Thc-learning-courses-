import fs from 'node:fs';
import path from 'node:path';

function readDirJson(rel) {
  return fs.readdirSync(rel)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(rel, name), 'utf8')));
}

const objectivePrefix = 'LO-LH-TECH1-001-';
const lessonPrefix = 'LESSON-LH-TECH1-001-';
const itemPrefix = 'ITEM-LH-TECH1-001-';

const objectives = readDirJson('content/learning-objectives')
  .filter((entry) => entry.id?.startsWith(objectivePrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const lessons = readDirJson('content/lessons')
  .filter((entry) => entry.id?.startsWith(lessonPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const questions = readDirJson('content/questions')
  .filter((entry) => entry.id?.startsWith(itemPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));

const errors = [];
const warnings = [];

if (objectives.length !== 12) errors.push(`Expected 12 controlled Course 1 objectives, found ${objectives.length}.`);
if (lessons.length !== 18) errors.push(`Expected 18 canonical Course 1 lessons, found ${lessons.length}.`);
if (questions.length < 120) errors.push(`Expected at least 120 scored Course 1 knowledge items, found ${questions.length}.`);

for (const objective of objectives) {
  const teachingLessons = lessons.filter((lesson) => (lesson.learningObjectives ?? lesson.objectives ?? []).includes(objective.id));
  const alignedItems = questions.filter((item) => item.objective === objective.id);
  if (teachingLessons.length === 0) errors.push(`${objective.id} has no canonical lesson mapping.`);
  if (alignedItems.length === 0) errors.push(`${objective.id} has no Course 1 scored knowledge item mapping.`);
  if (alignedItems.length < 3) warnings.push(`${objective.id} has only ${alignedItems.length} scored knowledge items; human blueprint review should confirm sufficiency.`);
}

for (const lesson of lessons) {
  const refs = lesson.references ?? [];
  const objectivesForLesson = lesson.learningObjectives ?? lesson.objectives ?? [];
  const blocks = lesson.content?.blocks ?? [];
  if (objectivesForLesson.length === 0) errors.push(`${lesson.id} has no controlled learning objective.`);
  if (refs.length === 0) errors.push(`${lesson.id} has no lesson-level references.`);
  if (!lesson.content?.overview) errors.push(`${lesson.id} has no overview.`);
  if (!lesson.content?.summary) errors.push(`${lesson.id} has no summary.`);
  if (blocks.length === 0) errors.push(`${lesson.id} has no rich instructional blocks.`);
  const appliedBlocks = blocks.filter((block) => ['activity', 'scenario', 'steps', 'comparison', 'document', 'table'].includes(block.type));
  if (appliedBlocks.length === 0) warnings.push(`${lesson.id} has no detected applied rich block; human instructional review should confirm adequate practice.`);
}

const coveredObjectives = new Set(questions.map((item) => item.objective).filter(Boolean));
const lessonMappedObjectives = new Set(lessons.flatMap((lesson) => lesson.learningObjectives ?? lesson.objectives ?? []));

console.log(JSON.stringify({
  courseId: 'COURSE-LH-TECH1-001',
  objectives: objectives.length,
  lessons: lessons.length,
  scoredKnowledgeItems: questions.length,
  objectivesMappedToLessons: objectives.filter((objective) => lessonMappedObjectives.has(objective.id)).length,
  objectivesMappedToScoredItems: objectives.filter((objective) => coveredObjectives.has(objective.id)).length,
  warnings
}, null, 2));

if (errors.length) {
  console.error('Course 1 objective-coverage audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Course 1 objective-coverage audit passed. Warnings remain human-review inputs and do not auto-close validation gates.');
