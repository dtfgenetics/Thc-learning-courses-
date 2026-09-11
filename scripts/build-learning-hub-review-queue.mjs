import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).filter((x) => x.startsWith('--') && x.includes('=')).map((x) => {
  const [key, ...rest] = x.slice(2).split('=');
  return [key, rest.join('=')];
}));
const summaryOnly = process.argv.includes('--summary-only');
const check = process.argv.includes('--check');
const courseId = args.course;
if (!courseId) throw new Error('Usage: node scripts/build-learning-hub-review-queue.mjs --course=COURSE-LH-... [--summary-only] [--check]');

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => readJson(path.join(rel, n)));
}

const courses = new Map(readDirJson('content/courses').map((x) => [x.id, x]));
const modules = new Map(readDirJson('content/modules').map((x) => [x.id, x]));
const lessons = new Map(readDirJson('content/lessons').map((x) => [x.id, x]));
const assessments = readDirJson('content/assessments');
const questions = readDirJson('content/questions');
const performance = readDirJson('content/performance-assessments');
const reviews = readDirJson('content/reviews');
const assessmentById = new Map(assessments.map((x) => [x.id, x]));
const questionById = new Map(questions.map((x) => [x.id, x]));
const course = courses.get(courseId);
if (!course) throw new Error(`Unknown course ${courseId}`);
if (!courseId.startsWith('COURSE-LH-')) throw new Error(`${courseId} is not a Learning Hub course`);

const key = courseId.replace(/^COURSE-/, '');
const assessmentPrefix = `ASSESS-${key}-`;
const itemPrefix = `ITEM-${key}-`;
const practicalPrefix = `PRACTICAL-${key}-`;
const capstonePrefix = `CAPSTONE-${key}-`;

function latestReview(objectId, objectVersion, reviewType) {
  return reviews.filter((r) => r.objectId === objectId && String(r.objectVersion) === String(objectVersion) && r.reviewType === reviewType)
    .sort((a,b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0] ?? null;
}
function stateFromReview(review) {
  if (!review) return 'pending';
  return review.status === 'approved' ? 'approved' : 'revision-required';
}
function addTask(tasks, task) {
  const review = latestReview(task.objectId, task.objectVersion, task.reviewType);
  tasks.push({...task, state: task.state ?? stateFromReview(review), latestReviewId: review?.id ?? null});
}

const tasks = [];
const lessonIds = [];
const moduleObjects = [];
for (const moduleId of course.modules ?? []) {
  const module = modules.get(moduleId);
  if (!module) throw new Error(`${courseId} cannot resolve module ${moduleId}`);
  moduleObjects.push(module);
  for (const lessonId of module.lessons ?? []) lessonIds.push(lessonId);
}

const uniqueLessonIds = [...new Set(lessonIds)].sort();
for (const lessonId of uniqueLessonIds) {
  const lesson = lessons.get(lessonId);
  if (!lesson) throw new Error(`${courseId} cannot resolve lesson ${lessonId}`);
  const scientific = latestReview(lesson.id, lesson.version, 'scientific');
  const scientificState = stateFromReview(scientific);
  tasks.push({lane:'lesson-scientific',objectType:'lesson',objectId:lesson.id,objectVersion:lesson.version,reviewType:'scientific',state:scientificState,latestReviewId:scientific?.id ?? null});
  const editorial = latestReview(lesson.id, lesson.version, 'editorial');
  tasks.push({lane:'lesson-editorial',objectType:'lesson',objectId:lesson.id,objectVersion:lesson.version,reviewType:'editorial',state:scientificState === 'approved' ? stateFromReview(editorial) : 'blocked',blockedBy:scientificState === 'approved' ? null : 'scientific-approval',latestReviewId:editorial?.id ?? null});
}

const courseAssessments = assessments.filter((x) => x.id.startsWith(assessmentPrefix)).sort((a,b) => a.id.localeCompare(b.id));
const courseQuestions = questions.filter((x) => x.id.startsWith(itemPrefix)).sort((a,b) => a.id.localeCompare(b.id));
const coursePerformance = performance.filter((x) => x.id.startsWith(practicalPrefix) || x.id.startsWith(capstonePrefix)).sort((a,b) => a.id.localeCompare(b.id));

for (const assessment of courseAssessments) {
  addTask(tasks, {lane:'assessment-definition',objectType:'assessment',objectId:assessment.id,objectVersion:assessment.version,reviewType:'assessment'});
}
for (const item of courseQuestions) {
  const lane = item.purpose === 'formative' ? 'formative-item' : item.purpose === 'summative' ? 'summative-item' : 'credential-item';
  addTask(tasks, {lane,objectType:'question',objectId:item.id,objectVersion:item.version,reviewType:'assessment'});
}
for (const practical of coursePerformance) {
  addTask(tasks, {lane:'performance-assessment',objectType:'performance-assessment',objectId:practical.id,objectVersion:practical.version,reviewType:'assessment'});
}
addTask(tasks, {lane:'course-accessibility',objectType:'course',objectId:course.id,objectVersion:course.version,reviewType:'accessibility'});
addTask(tasks, {lane:'course-legal-compliance',objectType:'course',objectId:course.id,objectVersion:course.version,reviewType:'legal-compliance'});

const counts = tasks.reduce((acc, task) => { acc[task.state] = (acc[task.state] ?? 0) + 1; return acc; }, {});
const laneSummary = Object.fromEntries([...new Set(tasks.map((task) => task.lane))].sort().map((lane) => [lane, {
  total: tasks.filter((task) => task.lane === lane).length,
  approved: tasks.filter((task) => task.lane === lane && task.state === 'approved').length,
  pending: tasks.filter((task) => task.lane === lane && task.state === 'pending').length,
  blocked: tasks.filter((task) => task.lane === lane && task.state === 'blocked').length,
  revisionRequired: tasks.filter((task) => task.lane === lane && task.state === 'revision-required').length
}]));

const output = {
  course: course.id,
  courseVersion: course.version,
  generatedFromReviewRecords: reviews.length,
  structure: {
    modules: moduleObjects.length,
    lessons: uniqueLessonIds.length,
    assessments: courseAssessments.length,
    knowledgeItems: courseQuestions.length,
    performanceAssessments: coursePerformance.length
  },
  summary: {totalTasks:tasks.length,approved:counts.approved ?? 0,pending:counts.pending ?? 0,blocked:counts.blocked ?? 0,revisionRequired:counts['revision-required'] ?? 0},
  lanes: laneSummary,
  ...(summaryOnly ? {} : {tasks})
};

if (check) {
  const failures = [];
  if (!Array.isArray(course.modules) || course.modules.length === 0) failures.push('course must reference at least one module');
  if (lessonIds.length !== uniqueLessonIds.length) failures.push('course module graph contains duplicate lesson references');
  if (uniqueLessonIds.length === 0) failures.push('course must resolve at least one lesson');

  const expectedAssessmentIds = new Set();
  for (const module of moduleObjects) {
    if (!Array.isArray(module.lessons) || module.lessons.length === 0) failures.push(`${module.id} must contain at least one lesson`);
    if (module.assessment) expectedAssessmentIds.add(module.assessment);
  }
  if (course.finalAssessment) expectedAssessmentIds.add(course.finalAssessment);

  for (const assessmentId of expectedAssessmentIds) {
    const assessment = assessmentById.get(assessmentId);
    if (!assessment) {
      failures.push(`cannot resolve assessment ${assessmentId}`);
      continue;
    }
    if (!assessment.id.startsWith(assessmentPrefix)) failures.push(`${assessmentId} is outside ${courseId}'s assessment namespace`);
  }

  for (const assessment of courseAssessments) {
    if (!Array.isArray(assessment.items) || assessment.items.length === 0) {
      failures.push(`${assessment.id} must contain at least one item`);
      continue;
    }
    if (new Set(assessment.items).size !== assessment.items.length) failures.push(`${assessment.id} contains duplicate item references`);
    for (const itemId of assessment.items) {
      const item = questionById.get(itemId);
      if (!item) failures.push(`${assessment.id} cannot resolve item ${itemId}`);
      else if (!item.id.startsWith(itemPrefix)) failures.push(`${assessment.id} references item outside ${courseId}'s item namespace: ${itemId}`);
    }
  }

  if (courseAssessments.length === 0) failures.push('course must resolve at least one course assessment');
  if (tasks.length === 0) failures.push('review queue must contain at least one task');
  if (failures.length) throw new Error(`${courseId} Learning Hub review queue integrity check failed: ${failures.join('; ')}`);
}

console.log(JSON.stringify(output, null, 2));
