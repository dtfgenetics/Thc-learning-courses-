import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const globalRegistry = JSON.parse(fs.readFileSync(path.join(root, 'registry/curriculum.json'), 'utf8'));
const foundationsRegistry = JSON.parse(fs.readFileSync(path.join(root, 'registry/cultivation-foundations.json'), 'utf8'));

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

const courses = new Map(readDirJson('content/courses').map((data) => [data.id, data]));
const modules = new Map(readDirJson('content/modules').map((data) => [data.id, data]));
const lessons = new Map(readDirJson('content/lessons').map((data) => [data.id, data]));
const references = new Map(readDirJson('content/references').map((data) => [data.id, data]));
const reviews = readDirJson('content/reviews');

function hasApprovedReview(objectId, objectVersion, reviewType) {
  return reviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
}

function lessonRow(lesson) {
  const substantive = Boolean(
    lesson.content?.overview &&
    (lesson.content?.vocabulary?.length ?? 0) > 0 &&
    (lesson.content?.sections?.length ?? 0) >= 2 &&
    (lesson.content?.commonMistakes?.length ?? 0) > 0 &&
    lesson.content?.practicalApplication &&
    lesson.content?.summary
  );

  const referenceStatuses = (lesson.references ?? []).map((id) => {
    const ref = references.get(id);
    if (!ref) throw new Error(`Review readiness cannot resolve reference ${id} for ${lesson.id}`);
    return { id, status: ref.status, evidenceLevel: ref.evidenceLevel };
  });
  const referencesReady = referenceStatuses.length > 0 && referenceStatuses.every((ref) => ref.status !== 'needs-authoritative-source' && ref.evidenceLevel !== 'unverified');

  return {
    lesson: lesson.id,
    lessonVersion: lesson.version,
    lessonStatus: lesson.status,
    substantiveContent: substantive,
    referencesReady,
    scientificApproved: hasApprovedReview(lesson.id, lesson.version, 'scientific'),
    editorialApproved: hasApprovedReview(lesson.id, lesson.version, 'editorial'),
    references: referenceStatuses
  };
}

const registeredLessonIds = new Set(globalRegistry.lessons ?? []);
const rows = [...registeredLessonIds].sort().map((lessonId) => {
  const lesson = lessons.get(lessonId);
  if (!lesson) throw new Error(`Review readiness cannot resolve registered lesson ${lessonId}`);
  return lessonRow(lesson);
});

function lessonsForCourse(courseId) {
  const course = courses.get(courseId);
  if (!course) throw new Error(`Review readiness cannot resolve course ${courseId}`);
  const ids = new Set();
  for (const moduleId of course.modules ?? []) {
    const module = modules.get(moduleId);
    if (!module) throw new Error(`Review readiness cannot resolve module ${moduleId} for ${courseId}`);
    for (const lessonId of module.lessons ?? []) ids.add(lessonId);
  }
  return ids;
}

const courseSummary = (globalRegistry.courses ?? []).map((courseId) => {
  const ids = lessonsForCourse(courseId);
  const courseRows = rows.filter((row) => ids.has(row.lesson));
  return {
    course: courseId,
    lessons: courseRows.length,
    substantiveLessons: courseRows.filter((row) => row.substantiveContent).length,
    referenceReadyLessons: courseRows.filter((row) => row.referencesReady).length,
    scientificallyReviewedLessons: courseRows.filter((row) => row.scientificApproved).length,
    editoriallyReviewedLessons: courseRows.filter((row) => row.editorialApproved).length
  };
});

const foundationsLessonIds = new Set();
for (const domain of foundationsRegistry.domains ?? []) {
  const module = modules.get(domain.module);
  if (!module) throw new Error(`Review readiness cannot resolve Foundations module ${domain.module}`);
  for (const lessonId of module.lessons ?? []) foundationsLessonIds.add(lessonId);
}
const foundationsRows = rows.filter((row) => foundationsLessonIds.has(row.lesson));
const foundationsScientificApproved = foundationsRows.filter((row) => row.scientificApproved).length;
const foundationsEditorialApproved = foundationsRows.filter((row) => row.editorialApproved).length;
const foundationsScientificGate = foundationsRows.length > 0 && foundationsScientificApproved === foundationsRows.length;
const foundationsEditorialGate = foundationsRows.length > 0 && foundationsEditorialApproved === foundationsRows.length;

const scientificApprovedCount = rows.filter((row) => row.scientificApproved).length;
const editorialApprovedCount = rows.filter((row) => row.editorialApproved).length;
const summary = {
  scope: 'global',
  release: globalRegistry.release,
  courses: courseSummary.length,
  lessons: rows.length,
  substantiveLessons: rows.filter((row) => row.substantiveContent).length,
  referencesReadyLessons: rows.filter((row) => row.referencesReady).length,
  scientificallyReviewedLessons: scientificApprovedCount,
  editoriallyReviewedLessons: editorialApprovedCount,
  scientificReviewGate: rows.length > 0 && scientificApprovedCount === rows.length,
  editorialReviewGate: rows.length > 0 && editorialApprovedCount === rows.length,
  foundations: {
    lessons: foundationsRows.length,
    scientificallyReviewedLessons: foundationsScientificApproved,
    editoriallyReviewedLessons: foundationsEditorialApproved,
    scientificReviewGate: foundationsScientificGate,
    editorialReviewGate: foundationsEditorialGate,
    registryScientificReviewGate: foundationsRegistry.gates?.allLessonsScientificallyReviewed ?? false,
    registryEditorialReviewGate: foundationsRegistry.gates?.allLessonsEditoriallyReviewed ?? false,
    publicationReady: foundationsRegistry.publicationReady === true
  }
};

console.log(JSON.stringify({ summary, courseSummary, lessons: rows }, null, 2));

if (foundationsRegistry.gates?.allLessonsHaveSubstantiveContent === true && foundationsRows.filter((row) => row.substantiveContent).length !== foundationsRows.length) {
  throw new Error(`Foundations registry claims all lessons have substantive content, but the report found ${foundationsRows.filter((row) => row.substantiveContent).length}/${foundationsRows.length}.`);
}
if (foundationsRegistry.gates?.allLessonsScientificallyReviewed === true && !foundationsScientificGate) {
  throw new Error(`Foundations registry claims scientific review is complete, but approved records exist for ${foundationsScientificApproved}/${foundationsRows.length} lessons.`);
}
if (foundationsRegistry.gates?.allLessonsEditoriallyReviewed === true && !foundationsEditorialGate) {
  throw new Error(`Foundations registry claims editorial review is complete, but approved records exist for ${foundationsEditorialApproved}/${foundationsRows.length} lessons.`);
}
