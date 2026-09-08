import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const jsonOnly = process.argv.includes('--json');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(rel, name)));
}

const courses = readDirJson('content/courses');
const modules = new Map(readDirJson('content/modules').map((value) => [value.id, value]));
const lessons = new Map(readDirJson('content/lessons').map((value) => [value.id, value]));
const assessments = new Map(readDirJson('content/assessments').map((value) => [value.id, value]));
const credentials = readDirJson('content/credentials');
const questions = readDirJson('content/questions');

function isSubstantiveLesson(lesson) {
  const content = lesson?.content;
  return Boolean(
    content?.overview &&
    (content?.sections?.length ?? 0) >= 2 &&
    (content?.vocabulary?.length ?? 0) >= 1 &&
    (content?.commonMistakes?.length ?? 0) >= 1 &&
    content?.practicalApplication &&
    content?.summary
  );
}

const rows = [];
for (const course of courses) {
  const gaps = [];
  const courseModules = [];
  const courseLessonIds = new Set();
  const taughtObjectives = new Set();
  const formativeObjectives = new Set();
  const summativeObjectives = new Set();
  let substantiveLessons = 0;
  let sectionCount = 0;
  let estimatedMinutes = 0;

  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    if (!module) {
      gaps.push(`missing module ${moduleId}`);
      continue;
    }

    const moduleAssessment = assessments.get(module.assessment);
    if (!moduleAssessment) gaps.push(`${module.id}: missing module assessment ${module.assessment}`);
    for (const objective of moduleAssessment?.objectives ?? []) formativeObjectives.add(objective);

    let moduleLessonCount = 0;
    let moduleSubstantive = 0;
    for (const lessonId of module.lessons ?? []) {
      const lesson = lessons.get(lessonId);
      if (!lesson) {
        gaps.push(`${module.id}: missing lesson ${lessonId}`);
        continue;
      }
      courseLessonIds.add(lesson.id);
      moduleLessonCount += 1;
      for (const objective of lesson.learningObjectives ?? []) taughtObjectives.add(objective);
      if (isSubstantiveLesson(lesson)) {
        substantiveLessons += 1;
        moduleSubstantive += 1;
      } else {
        gaps.push(`${lesson.id}: incomplete instructional content`);
      }
      sectionCount += lesson.content?.sections?.length ?? 0;
      estimatedMinutes += lesson.estimatedMinutes ?? 0;
    }

    courseModules.push({
      id: module.id,
      status: module.status,
      lessons: moduleLessonCount,
      substantiveLessons: moduleSubstantive,
      assessment: moduleAssessment?.id ?? null,
      assessmentObjectives: moduleAssessment?.objectives?.length ?? 0
    });
  }

  const finalAssessment = course.finalAssessment ? assessments.get(course.finalAssessment) : null;
  if (course.credentialBearing && !course.finalAssessment) gaps.push('credential-bearing course has no finalAssessment');
  if (course.finalAssessment && !finalAssessment) gaps.push(`missing final assessment ${course.finalAssessment}`);

  const courseCompetencies = new Set(course.competencies ?? []);
  const relevantSummativeQuestions = questions.filter((question) =>
    courseCompetencies.has(question.competency) && ['summative', 'credential'].includes(question.purpose)
  );
  for (const question of relevantSummativeQuestions) summativeObjectives.add(question.objective);

  for (const competency of courseCompetencies) {
    const taught = [...courseLessonIds].some((lessonId) => lessons.get(lessonId)?.competencies?.includes(competency));
    if (!taught) gaps.push(`competency ${competency} is not taught by a course lesson`);
    const assessed = relevantSummativeQuestions.some((question) => question.competency === competency);
    if (course.credentialBearing && !assessed) gaps.push(`competency ${competency} has no summative/credential item`);
  }

  const courseCredentials = credentials.filter((credential) => credential.course === course.id);
  if (course.credentialBearing && courseCredentials.length === 0) gaps.push('credential-bearing course has no credential object');

  const allTaughtObjectives = [...taughtObjectives];
  const unformativelyAssessed = allTaughtObjectives.filter((objective) => !formativeObjectives.has(objective));
  const unsummativelyAssessed = allTaughtObjectives.filter((objective) => !summativeObjectives.has(objective));
  if (unformativelyAssessed.length) gaps.push(`${unformativelyAssessed.length} taught objective(s) missing module-assessment declaration`);
  if (course.credentialBearing && unsummativelyAssessed.length) gaps.push(`${unsummativelyAssessed.length} taught objective(s) missing summative/credential items`);

  let classification = 'complete-structure';
  if (gaps.length > 0) classification = substantiveLessons === 0 ? 'skeletal' : 'partial';
  else if (!course.credentialBearing) classification = 'instructional-complete';
  else classification = 'credential-structure-complete';

  rows.push({
    id: course.id,
    title: course.title,
    version: course.version,
    status: course.status,
    credentialBearing: course.credentialBearing,
    classification,
    moduleCount: courseModules.length,
    lessonCount: courseLessonIds.size,
    substantiveLessons,
    estimatedMinutes,
    sections: sectionCount,
    competencies: courseCompetencies.size,
    taughtObjectives: taughtObjectives.size,
    formativeObjectives: formativeObjectives.size,
    summativeObjectives: summativeObjectives.size,
    finalAssessment: finalAssessment?.id ?? null,
    credentials: courseCredentials.map((credential) => credential.id),
    modules: courseModules,
    gaps
  });
}

const priority = { skeletal: 0, partial: 1, 'complete-structure': 2, 'instructional-complete': 3, 'credential-structure-complete': 4 };
rows.sort((a, b) => (priority[a.classification] ?? 9) - (priority[b.classification] ?? 9) || a.id.localeCompare(b.id));

const report = {
  generatedAt: new Date().toISOString(),
  policy: 'Catalog completeness is an authoring/build measure. Human review, pilot evidence, and release approval remain separate later gates.',
  summary: {
    courses: rows.length,
    credentialBearingCourses: rows.filter((row) => row.credentialBearing).length,
    skeletal: rows.filter((row) => row.classification === 'skeletal').length,
    partial: rows.filter((row) => row.classification === 'partial').length,
    instructionalComplete: rows.filter((row) => ['complete-structure', 'instructional-complete', 'credential-structure-complete'].includes(row.classification)).length,
    totalLessons: rows.reduce((sum, row) => sum + row.lessonCount, 0),
    substantiveLessons: rows.reduce((sum, row) => sum + row.substantiveLessons, 0),
    estimatedMinutes: rows.reduce((sum, row) => sum + row.estimatedMinutes, 0)
  },
  courses: rows
};

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Course catalog: ${report.summary.courses} course(s)`);
  console.log(`Credential-bearing: ${report.summary.credentialBearingCourses}`);
  console.log(`Skeletal: ${report.summary.skeletal}; partial: ${report.summary.partial}; structurally complete: ${report.summary.instructionalComplete}`);
  console.log(`Substantive lessons: ${report.summary.substantiveLessons}/${report.summary.totalLessons}`);
  console.log(`Estimated learning time: ${report.summary.estimatedMinutes} minutes`);
  for (const row of rows) {
    console.log(`- ${row.id}: ${row.classification}; ${row.substantiveLessons}/${row.lessonCount} substantive lessons; ${row.gaps.length} gap(s)`);
    for (const gap of row.gaps) console.log(`  - ${gap}`);
  }
}
