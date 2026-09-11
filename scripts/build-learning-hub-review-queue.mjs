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
for (const moduleId of course.modules ?? []) {
  const module = modules.get(moduleId);
  if (!module) throw new Error(`${courseId} cannot resolve module ${moduleId}`);
  for (const lessonId of module.lessons ?? []) lessonIds.push(lessonId);
}

for (const lessonId of [...new Set(lessonIds)].sort()) {
  const lesson = lessons.get(lessonId);
  if (!lesson) throw new Error(`${courseId} cannot resolve lesson ${lessonId}`);
  const scientific = latestReview(lesson.id, lesson.version, 'scientific');
  const scientificState = stateFromReview(scientific);
  tasks.push({lane:'lesson-scientific',objectType:'lesson',objectId:lesson.id,objectVersion:lesson.version,reviewType:'scientific',state:scientificState,latestReviewId:scientific?.id ?? null});
  const editorial = latestReview(lesson.id, lesson.version, 'editorial');
  tasks.push({lane:'lesson-editorial',objectType:'lesson',objectId:lesson.id,objectVersion:lesson.version,reviewType:'editorial',state:scientificState === 'approved' ? stateFromReview(editorial) : 'blocked',blockedBy:scientificState === 'approved' ? null : 'scientific-approval',latestReviewId:editorial?.id ?? null});
}

for (const assessment of assessments.filter((x) => x.id.startsWith(assessmentPrefix)).sort((a,b) => a.id.localeCompare(b.id))) {
  addTask(tasks, {lane:'assessment-definition',objectType:'assessment',objectId:assessment.id,objectVersion:assessment.version,reviewType:'assessment'});
}
for (const item of questions.filter((x) => x.id.startsWith(itemPrefix)).sort((a,b) => a.id.localeCompare(b.id))) {
  const lane = item.purpose === 'formative' ? 'formative-item' : item.purpose === 'summative' ? 'summative-item' : 'credential-item';
  addTask(tasks, {lane,objectType:'question',objectId:item.id,objectVersion:item.version,reviewType:'assessment'});
}
for (const practical of performance.filter((x) => x.id.startsWith(practicalPrefix) || x.id.startsWith(capstonePrefix)).sort((a,b) => a.id.localeCompare(b.id))) {
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
  summary: {totalTasks:tasks.length,approved:counts.approved ?? 0,pending:counts.pending ?? 0,blocked:counts.blocked ?? 0,revisionRequired:counts['revision-required'] ?? 0},
  lanes: laneSummary,
  ...(summaryOnly ? {} : {tasks})
};

if (check && courseId === 'COURSE-LH-TECH1-001') {
  const expected = {totalTasks:154,'lesson-scientific':18,'lesson-editorial':18,'assessment-definition':7,'formative-item':72,'summative-item':36,'performance-assessment':1,'course-accessibility':1,'course-legal-compliance':1};
  const failures = [];
  if (output.summary.totalTasks !== expected.totalTasks) failures.push(`expected ${expected.totalTasks} total tasks, found ${output.summary.totalTasks}`);
  for (const [lane, total] of Object.entries(expected).filter(([name]) => name !== 'totalTasks')) if ((laneSummary[lane]?.total ?? 0) !== total) failures.push(`expected ${total} ${lane} tasks, found ${laneSummary[lane]?.total ?? 0}`);
  if (failures.length) throw new Error(`Course 1 Learning Hub review queue mismatch: ${failures.join('; ')}`);
}

console.log(JSON.stringify(output, null, 2));
