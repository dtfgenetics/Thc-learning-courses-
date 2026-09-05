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
const courses = new Map(readDirJson('content/courses').map(({ data }) => [data.id, data]));
const assessments = new Map(readDirJson('content/assessments').map(({ data }) => [data.id, data]));
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

for (const domain of registry.domains ?? []) {
  const lesson = lessons.get(domain.lesson);
  if (!lesson) {
    errors.push(`${domain.id}: mapped lesson ${domain.lesson} does not exist`);
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

if (errors.length) {
  console.error('Production release readiness failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Production release readiness passed for ${registry.course} ${registry.version}.`);
