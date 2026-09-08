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

const thresholds = {
  estimatedMinutes: 40,
  sections: 5,
  vocabularyTerms: 5,
  workedExamples: 3,
  commonMistakes: 4
};

const rows = [];
for (const course of courses) {
  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    if (!module) continue;
    for (const lessonId of module.lessons ?? []) {
      const lesson = lessons.get(lessonId);
      if (!lesson) continue;
      const content = lesson.content ?? {};
      const metrics = {
        estimatedMinutes: lesson.estimatedMinutes ?? 0,
        sections: content.sections?.length ?? 0,
        vocabularyTerms: content.vocabulary?.length ?? 0,
        workedExamples: content.workedExamples?.length ?? 0,
        commonMistakes: content.commonMistakes?.length ?? 0
      };
      const deficits = Object.entries(thresholds)
        .filter(([key, minimum]) => metrics[key] < minimum)
        .map(([key, minimum]) => ({ metric: key, actual: metrics[key], minimum }));
      rows.push({
        course: course.id,
        courseTitle: course.title,
        module: module.id,
        lesson: lesson.id,
        lessonTitle: lesson.title,
        lessonStatus: lesson.status,
        ...metrics,
        depthReady: deficits.length === 0,
        deficits
      });
    }
  }
}

const byCourse = [];
for (const course of courses) {
  const courseRows = rows.filter((row) => row.course === course.id);
  byCourse.push({
    course: course.id,
    title: course.title,
    lessons: courseRows.length,
    depthReadyLessons: courseRows.filter((row) => row.depthReady).length,
    needsExpansion: courseRows.filter((row) => !row.depthReady).length,
    averageSections: courseRows.length ? Number((courseRows.reduce((sum, row) => sum + row.sections, 0) / courseRows.length).toFixed(2)) : 0,
    averageMinutes: courseRows.length ? Number((courseRows.reduce((sum, row) => sum + row.estimatedMinutes, 0) / courseRows.length).toFixed(2)) : 0,
    lessonsNeedingExpansion: courseRows.filter((row) => !row.depthReady).map((row) => row.lesson)
  });
}

byCourse.sort((a, b) => b.needsExpansion - a.needsExpansion || a.course.localeCompare(b.course));

const report = {
  generatedAt: new Date().toISOString(),
  purpose: 'Authoring-depth audit used before human review. It measures instructional richness, not scientific approval or release readiness.',
  thresholds,
  summary: {
    uniqueLessons: new Set(rows.map((row) => row.lesson)).size,
    courseLessonReferences: rows.length,
    depthReadyLessonReferences: rows.filter((row) => row.depthReady).length,
    lessonReferencesNeedingExpansion: rows.filter((row) => !row.depthReady).length,
    coursesWithExpansionNeeds: byCourse.filter((row) => row.needsExpansion > 0).length
  },
  byCourse,
  lessons: rows.filter((row) => !row.depthReady)
};

if (jsonOnly) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Content-depth audit: ${report.summary.depthReadyLessonReferences}/${report.summary.courseLessonReferences} course-lesson references meet authoring depth.`);
  console.log(`Courses needing expansion: ${report.summary.coursesWithExpansionNeeds}`);
  for (const course of byCourse) {
    console.log(`- ${course.course}: ${course.depthReadyLessons}/${course.lessons} depth-ready; avg ${course.averageSections} sections, ${course.averageMinutes} min`);
  }
}
