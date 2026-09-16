import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const courseArg = args.find((arg) => arg.startsWith('--course='));
const courseId = courseArg?.slice('--course='.length) || 'COURSE-LH-TECH1-002';
const requireComplete = args.includes('--require-complete-learning-loop');
const requireBalancedAssessment = args.includes('--require-balanced-assessment');

const exists = (rel) => fs.existsSync(path.join(root, rel));
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const readDirJson = (rel) => {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
};

const coursePath = `content/courses/${courseId}.json`;
if (!exists(coursePath)) {
  console.error(`${courseId}: course definition not found at ${coursePath}`);
  process.exit(1);
}

const course = readJson(coursePath);
const courseKey = courseId.replace(/^COURSE-/, '');
const match = courseId.match(/COURSE-LH-TECH1-(\d{3})$/);
if (!match) {
  console.error(`${courseId}: this audit currently supports COURSE-LH-TECH1-### identifiers.`);
  process.exit(1);
}
const courseNumber = match[1];
const docsDir = `docs/learning-hub/tech1/course-${courseNumber}`;
const remediationPath = `${docsDir}/instructor/OBJECTIVE-REMEDIATION-MATRIX.md`;

const objectivePrefix = `LO-${courseKey}-`;
const lessonPrefix = `LESSON-${courseKey}-`;
const assessmentPrefix = `ASSESS-${courseKey}-`;
const itemPrefix = `ITEM-${courseKey}-`;

const objectives = readDirJson('content/learning-objectives')
  .filter((entry) => entry.id?.startsWith(objectivePrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const lessons = readDirJson('content/lessons')
  .filter((entry) => entry.id?.startsWith(lessonPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const assessments = readDirJson('content/assessments')
  .filter((entry) => entry.id?.startsWith(assessmentPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const questions = readDirJson('content/questions')
  .filter((entry) => entry.id?.startsWith(itemPrefix))
  .sort((a, b) => a.id.localeCompare(b.id));
const remediation = exists(remediationPath) ? readText(remediationPath) : '';

const appliedTypes = new Set(['activity', 'scenario', 'steps', 'comparison', 'document', 'table']);
const assessedItemIds = new Set(assessments.flatMap((assessment) => assessment.items ?? []));
const errors = [];
const warnings = [];

if (!objectives.length) errors.push('No controlled course-specific objectives found.');
if (!lessons.length) errors.push('No dedicated course-specific lessons found.');
if (!assessments.length) errors.push('No course-specific assessment definitions found.');
if (!questions.length) errors.push('No course-specific scored question objects found.');

for (const assessment of assessments) {
  for (const itemId of assessment.items ?? []) {
    if (!questions.some((item) => item.id === itemId)) {
      errors.push(`${assessment.id} references unresolved course item ${itemId}.`);
    }
  }
}

function remediationSection(objectiveId) {
  if (!remediation) return '';
  const marker = `## \`${objectiveId}\``;
  const start = remediation.indexOf(marker);
  if (start < 0) return '';
  const next = remediation.indexOf('\n## `LO-', start + marker.length);
  return remediation.slice(start, next < 0 ? remediation.length : next);
}

function hasAppliedPractice(lesson) {
  const blocks = lesson.content?.blocks ?? [];
  return blocks.some((block) => appliedTypes.has(block.type)) ||
    Boolean(lesson.content?.practicalApplication) ||
    Boolean((lesson.content?.workedExamples ?? []).length);
}

const rows = [];
for (const objective of objectives) {
  const teachingLessons = lessons.filter((lesson) =>
    (lesson.learningObjectives ?? lesson.objectives ?? []).includes(objective.id));
  const practiceLessons = teachingLessons.filter(hasAppliedPractice);
  const alignedItems = questions.filter((item) => item.objective === objective.id);
  const assessedItems = alignedItems.filter((item) => assessedItemIds.has(item.id));
  const formativeItems = assessedItems.filter((item) => item.purpose === 'formative');
  const summativeItems = assessedItems.filter((item) => item.purpose === 'summative');
  const referenceBackedItems = assessedItems.filter((item) => (item.references ?? []).length > 0);
  const section = remediationSection(objective.id);
  const hasRemediation = section.includes('**Corrective coaching**') &&
    section.includes('**Return-to-practice**') &&
    section.includes('**Reassessment**');

  if (!teachingLessons.length) errors.push(`${objective.id}: no dedicated lesson teaches this objective.`);
  if (!practiceLessons.length) errors.push(`${objective.id}: no applied practice detected in mapped lessons.`);
  if (!assessedItems.length) errors.push(`${objective.id}: no scored item used by a course assessment definition.`);
  if (assessedItems.length !== referenceBackedItems.length) {
    errors.push(`${objective.id}: ${assessedItems.length - referenceBackedItems.length} assessed item(s) lack evidence references.`);
  }
  if (!hasRemediation) {
    const message = `${objective.id}: remediation matrix lacks corrective coaching, return-to-practice, or reassessment guidance.`;
    if (requireComplete) errors.push(message); else warnings.push(message);
  }
  if (!formativeItems.length) {
    const message = `${objective.id}: no item-level formative coverage detected.`;
    if (requireBalancedAssessment) errors.push(message); else warnings.push(message);
  }
  if (!summativeItems.length) {
    const message = `${objective.id}: no item-level summative coverage detected.`;
    if (requireBalancedAssessment) errors.push(message); else warnings.push(message);
  }

  rows.push({
    objectiveId: objective.id,
    bloomLevel: objective.bloomLevel ?? null,
    instructionLessons: teachingLessons.map((lesson) => lesson.id),
    practiceLessons: practiceLessons.map((lesson) => lesson.id),
    alignedQuestionObjects: alignedItems.length,
    assessedItems: assessedItems.length,
    formativeItems: formativeItems.length,
    summativeItems: summativeItems.length,
    referenceBackedAssessedItems: referenceBackedItems.length,
    remediationComplete: hasRemediation
  });
}

for (const lesson of lessons) {
  const mappedObjectives = lesson.learningObjectives ?? lesson.objectives ?? [];
  if (!mappedObjectives.length) errors.push(`${lesson.id}: no controlled objective mapping.`);
  if (!(lesson.references ?? []).length) errors.push(`${lesson.id}: no lesson-level evidence references.`);
  if (!lesson.content?.overview) errors.push(`${lesson.id}: missing overview.`);
  if (!lesson.content?.summary) errors.push(`${lesson.id}: missing summary.`);
  if (!(lesson.content?.blocks ?? []).length) errors.push(`${lesson.id}: missing rich instructional blocks.`);
}

for (const item of questions.filter((entry) => assessedItemIds.has(entry.id))) {
  if (!objectives.some((objective) => objective.id === item.objective)) {
    errors.push(`${item.id}: objective ${item.objective ?? '<missing>'} is outside the controlled course objective set.`);
  }
  if (!(item.references ?? []).length) errors.push(`${item.id}: assessed item has no evidence references.`);
}

const result = {
  courseId,
  courseTitle: course.title,
  lifecycle: course.status,
  objectiveCount: objectives.length,
  lessonCount: lessons.length,
  assessmentCount: assessments.length,
  questionObjectCount: questions.length,
  assessedQuestionCount: questions.filter((item) => assessedItemIds.has(item.id)).length,
  objectivesWithInstruction: rows.filter((row) => row.instructionLessons.length > 0).length,
  objectivesWithPractice: rows.filter((row) => row.practiceLessons.length > 0).length,
  objectivesWithScoredAssessment: rows.filter((row) => row.assessedItems > 0).length,
  objectivesWithFormativeItems: rows.filter((row) => row.formativeItems > 0).length,
  objectivesWithSummativeItems: rows.filter((row) => row.summativeItems > 0).length,
  objectivesWithCompleteRemediation: rows.filter((row) => row.remediationComplete).length,
  remediationPath,
  rows,
  warnings,
  errors,
  machineLearningLoopPass: errors.length === 0,
  humanQualityReviewStillRequired: true
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) {
  console.error(`${courseId} objective learning-loop audit failed:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`${courseId} objective learning-loop audit passed at the selected machine-check level. Human instructional, assessment, accessibility, pilot and release review remain open.`);
