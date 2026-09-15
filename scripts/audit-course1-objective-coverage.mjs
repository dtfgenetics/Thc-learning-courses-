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
const assessmentPrefix = 'ASSESS-LH-TECH1-001-';
const remediationPath = 'docs/learning-hub/tech1/course-001/instructor/OBJECTIVE-REMEDIATION-MATRIX.md';

const objectives = readDirJson('content/learning-objectives')
  .filter((entry) => entry.id?.startsWith(objectivePrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const lessons = readDirJson('content/lessons')
  .filter((entry) => entry.id?.startsWith(lessonPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const questions = readDirJson('content/questions')
  .filter((entry) => entry.id?.startsWith(itemPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const assessments = readDirJson('content/assessments')
  .filter((entry) => entry.id?.startsWith(assessmentPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const remediation = fs.readFileSync(remediationPath, 'utf8');

const errors = [];
const warnings = [];
const appliedTypes = new Set(['activity', 'scenario', 'steps', 'comparison', 'document', 'table']);
const assessedItemIds = new Set(assessments.flatMap((assessment) => assessment.items ?? []));

if (objectives.length !== 12) errors.push(`Expected 12 controlled Course 1 objectives, found ${objectives.length}.`);
if (lessons.length !== 18) errors.push(`Expected 18 canonical Course 1 lessons, found ${lessons.length}.`);
if (questions.length < 120) errors.push(`Expected at least 120 scored Course 1 knowledge items, found ${questions.length}.`);
if (assessments.length < 7) errors.push(`Expected at least 7 Course 1 assessment definitions, found ${assessments.length}.`);

function remediationSection(objectiveId) {
  const marker = `## \`${objectiveId}\``;
  const start = remediation.indexOf(marker);
  if (start < 0) return '';
  const next = remediation.indexOf('\n## `LO-LH-TECH1-001-', start + marker.length);
  return remediation.slice(start, next < 0 ? remediation.length : next);
}

const learningLoop = [];
for (const objective of objectives) {
  const teachingLessons = lessons.filter((lesson) => (lesson.learningObjectives ?? lesson.objectives ?? []).includes(objective.id));
  const alignedItems = questions.filter((item) => item.objective === objective.id);
  const assessedItems = alignedItems.filter((item) => assessedItemIds.has(item.id));
  const practiceLessons = teachingLessons.filter((lesson) => {
    const blocks = lesson.content?.blocks ?? [];
    const hasAppliedBlock = blocks.some((block) => appliedTypes.has(block.type));
    const hasPracticalApplication = typeof lesson.content?.practicalApplication === 'string' && lesson.content.practicalApplication.trim().length > 0;
    const hasWorkedExamples = Array.isArray(lesson.content?.workedExamples) && lesson.content.workedExamples.length > 0;
    return hasAppliedBlock || hasPracticalApplication || hasWorkedExamples;
  });
  const section = remediationSection(objective.id);
  const hasRemediation = section.includes('**Corrective coaching**') && section.includes('**Return-to-practice**') && section.includes('**Reassessment**');

  if (teachingLessons.length === 0) errors.push(`${objective.id} has no canonical lesson mapping.`);
  if (practiceLessons.length === 0) errors.push(`${objective.id} has no applied practice evidence in its mapped lessons.`);
  if (alignedItems.length === 0) errors.push(`${objective.id} has no Course 1 scored knowledge item mapping.`);
  if (assessedItems.length === 0) errors.push(`${objective.id} has no scored item referenced by a Course 1 assessment definition.`);
  if (!hasRemediation) errors.push(`${objective.id} lacks a complete corrective-coaching, return-to-practice and reassessment remediation section.`);
  if (alignedItems.length < 3) warnings.push(`${objective.id} has only ${alignedItems.length} scored knowledge items; human blueprint review should confirm sufficiency.`);

  learningLoop.push({
    objectiveId: objective.id,
    instructionLessons: teachingLessons.map((lesson) => lesson.id),
    practiceLessons: practiceLessons.map((lesson) => lesson.id),
    scoredItems: alignedItems.length,
    assessedItems: assessedItems.length,
    remediation: hasRemediation
  });
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
  const appliedBlocks = blocks.filter((block) => appliedTypes.has(block.type));
  const hasOtherPractice = Boolean(lesson.content?.practicalApplication) || (lesson.content?.workedExamples ?? []).length > 0;
  if (appliedBlocks.length === 0 && !hasOtherPractice) warnings.push(`${lesson.id} has no detected applied practice evidence; human instructional review should confirm adequacy.`);
}

const coveredObjectives = new Set(questions.map((item) => item.objective).filter(Boolean));
const lessonMappedObjectives = new Set(lessons.flatMap((lesson) => lesson.learningObjectives ?? lesson.objectives ?? []));
const assessedObjectives = new Set(questions.filter((item) => assessedItemIds.has(item.id)).map((item) => item.objective).filter(Boolean));

console.log(JSON.stringify({
  courseId: 'COURSE-LH-TECH1-001',
  objectives: objectives.length,
  lessons: lessons.length,
  assessments: assessments.length,
  scoredKnowledgeItems: questions.length,
  objectivesMappedToLessons: objectives.filter((objective) => lessonMappedObjectives.has(objective.id)).length,
  objectivesWithAppliedPractice: learningLoop.filter((row) => row.practiceLessons.length > 0).length,
  objectivesMappedToScoredItems: objectives.filter((objective) => coveredObjectives.has(objective.id)).length,
  objectivesMappedToAssessmentDefinitions: objectives.filter((objective) => assessedObjectives.has(objective.id)).length,
  objectivesWithCompleteRemediation: learningLoop.filter((row) => row.remediation).length,
  learningLoop,
  warnings
}, null, 2));

if (errors.length) {
  console.error('Course 1 objective learning-loop audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Course 1 objective learning-loop audit passed: every controlled objective has instruction, applied practice, scored assessment coverage and explicit remediation/reassessment guidance. Human quality review remains open.');
