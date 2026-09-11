import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: path.join(rel, name), data: readJson(path.join(rel, name)) }));
}

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

const requestedCourseId = argValue('course') || process.env.RELEASE_COURSE_ID || process.env.THC_RELEASE_COURSE || null;
const lessons = new Map(readDirJson('content/lessons').map(({ data }) => [data.id, data]));
const modules = new Map(readDirJson('content/modules').map(({ data }) => [data.id, data]));
const courses = new Map(readDirJson('content/courses').map(({ data }) => [data.id, data]));
const assessments = new Map(readDirJson('content/assessments').map(({ data }) => [data.id, data]));
const questions = new Map(readDirJson('content/questions').map(({ data }) => [data.id, data]));
const credentials = readDirJson('content/credentials').map(({ data }) => data);

const observations = [];
const course = requestedCourseId ? courses.get(requestedCourseId) : null;

if (!requestedCourseId) observations.push('No course scope supplied; pass --course=COURSE-... for a focused audit.');
if (requestedCourseId && !course) observations.push(`Course ${requestedCourseId} was not found.`);

let moduleCount = 0;
let lessonCount = 0;
let assessmentCount = 0;
let itemCount = 0;

if (course) {
  const seenLessons = new Set();
  const seenAssessments = new Set();
  const seenItems = new Set();

  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    if (!module) {
      observations.push(`${course.id}: mapped module ${moduleId} does not exist.`);
      continue;
    }
    moduleCount += 1;

    for (const lessonId of module.lessons ?? []) {
      if (seenLessons.has(lessonId)) continue;
      seenLessons.add(lessonId);
      if (!lessons.has(lessonId)) observations.push(`${module.id}: mapped lesson ${lessonId} does not exist.`);
      else lessonCount += 1;
    }

    if (module.assessment && !seenAssessments.has(module.assessment)) {
      seenAssessments.add(module.assessment);
      const assessment = assessments.get(module.assessment);
      if (!assessment) {
        observations.push(`${module.id}: assessment ${module.assessment} does not exist.`);
      } else {
        assessmentCount += 1;
        for (const itemId of assessment.items ?? []) {
          if (seenItems.has(itemId)) continue;
          seenItems.add(itemId);
          if (!questions.has(itemId)) observations.push(`${assessment.id}: item ${itemId} does not exist.`);
          else itemCount += 1;
        }
      }
    }
  }

  if (course.finalAssessment) {
    const assessment = assessments.get(course.finalAssessment);
    if (!assessment) observations.push(`${course.id}: final assessment ${course.finalAssessment} does not exist.`);
    else if (!seenAssessments.has(assessment.id)) {
      assessmentCount += 1;
      for (const itemId of assessment.items ?? []) {
        if (seenItems.has(itemId)) continue;
        seenItems.add(itemId);
        if (!questions.has(itemId)) observations.push(`${assessment.id}: item ${itemId} does not exist.`);
        else itemCount += 1;
      }
    }
  }
}

const mappedCredentials = course ? credentials.filter((credential) => credential.course === course.id).map((credential) => credential.id) : [];

console.log(JSON.stringify({
  mode: 'informational-release-audit',
  blocking: false,
  courseId: course?.id ?? requestedCourseId,
  courseVersion: course?.version ?? null,
  modules: moduleCount,
  lessons: lessonCount,
  assessments: assessmentCount,
  items: itemCount,
  mappedCredentials,
  observations
}, null, 2));
