import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

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

const registry = readJson('registry/cultivation-foundations.json');
const lessons = new Map(readDirJson('content/lessons').map(({ data }) => [data.id, data]));
const modules = new Map(readDirJson('content/modules').map(({ data }) => [data.id, data]));
const courses = new Map(readDirJson('content/courses').map(({ data }) => [data.id, data]));
const assessments = new Map(readDirJson('content/assessments').map(({ data }) => [data.id, data]));
const questions = readDirJson('content/questions').map(({ data }) => data);
const reviews = readDirJson('content/reviews').map(({ data }) => data);

if (registry.status === 'draft') errors.push('registry/cultivation-foundations.json: release registry is still draft');
if (registry.publicationReady !== true) errors.push('registry/cultivation-foundations.json: publicationReady must be true for a production release');

for (const [gate, value] of Object.entries(registry.gates ?? {})) {
  if (value !== true) errors.push(`registry/cultivation-foundations.json: release gate ${gate} is not true`);
}

const course = courses.get(registry.course);
if (!course) {
  errors.push(`registry/cultivation-foundations.json: course ${registry.course} does not exist`);
} else if (course.status !== 'published') {
  errors.push(`${course.id}: course status must be published for a production release`);
}

const finalAssessment = assessments.get(registry.summativeAssessment);
if (!finalAssessment) {
  errors.push(`registry/cultivation-foundations.json: summative assessment ${registry.summativeAssessment} does not exist`);
} else if (!['active', 'approved', 'published'].includes(finalAssessment.status)) {
  errors.push(`${finalAssessment.id}: final assessment must be active, approved, or published for a production release`);
}

function hasApprovedReview(objectId, objectVersion, reviewType) {
  return reviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
}

if (finalAssessment && !hasApprovedReview(finalAssessment.id, finalAssessment.version, 'assessment')) {
  errors.push(`${finalAssessment.id}@${finalAssessment.version}: missing approved assessment review record`);
}

const checkedLessons = new Set();
const checkedModuleAssessments = new Set();
for (const domain of registry.domains ?? []) {
  const module = modules.get(domain.module);
  if (!module) {
    errors.push(`${domain.id}: mapped module ${domain.module} does not exist`);
    continue;
  }

  if (module.status !== 'published') {
    errors.push(`${module.id}: module status must be published for a production release`);
  }

  for (const lessonId of module.lessons ?? []) {
    if (checkedLessons.has(lessonId)) continue;
    checkedLessons.add(lessonId);
    const lesson = lessons.get(lessonId);
    if (!lesson) {
      errors.push(`${module.id}: mapped lesson ${lessonId} does not exist`);
      continue;
    }

    if (lesson.status !== 'published') {
      errors.push(`${lesson.id}: lesson status must be published for a production release`);
    }

    for (const reviewType of ['scientific', 'editorial']) {
      if (!hasApprovedReview(lesson.id, lesson.version, reviewType)) {
        errors.push(`${lesson.id}@${lesson.version}: missing approved ${reviewType} review record`);
      }
    }
  }

  if (module.assessment && !checkedModuleAssessments.has(module.assessment)) {
    checkedModuleAssessments.add(module.assessment);
    const assessment = assessments.get(module.assessment);
    if (!assessment) {
      errors.push(`${module.id}: module assessment ${module.assessment} does not exist`);
    } else {
      if (!['active', 'approved', 'published'].includes(assessment.status)) {
        errors.push(`${assessment.id}: module assessment must be active, approved, or published for a production release`);
      }
      if (!hasApprovedReview(assessment.id, assessment.version, 'assessment')) {
        errors.push(`${assessment.id}@${assessment.version}: missing approved assessment review record`);
      }
      for (const itemId of assessment.items ?? []) {
        const item = questions.find((question) => question.id === itemId);
        if (!item) {
          errors.push(`${assessment.id}: assessment item ${itemId} does not exist`);
          continue;
        }
        if (item.status !== 'active') errors.push(`${item.id}: module assessment item must be active for production`);
        if (!hasApprovedReview(item.id, item.version, 'assessment')) {
          errors.push(`${item.id}@${item.version}: missing approved assessment review record`);
        }
      }
    }
  }
}

if (finalAssessment?.blueprint) {
  const minimumActive = Number(finalAssessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0);
  for (const row of finalAssessment.blueprint) {
    const activeItems = questions.filter((item) =>
      item.competency === row.competency &&
      ['summative', 'credential'].includes(item.purpose) &&
      item.status === 'active'
    );
    if (activeItems.length < minimumActive) {
      errors.push(`${row.competency}: final assessment has ${activeItems.length}/${minimumActive} required active summative/credential items`);
    }
    for (const item of activeItems) {
      if (!hasApprovedReview(item.id, item.version, 'assessment')) {
        errors.push(`${item.id}@${item.version}: active credential item is missing approved assessment review evidence`);
      }
    }
  }
}

if (errors.length) {
  console.error('Production release readiness failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Production release readiness passed for ${registry.course} ${registry.version}; ${checkedLessons.size} lessons and ${checkedModuleAssessments.size} module assessments verified.`);
