import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).filter((x) => x.startsWith('--') && x.includes('=')).map((x) => {
  const [key, ...rest] = x.slice(2).split('=');
  return [key, rest.join('=')];
}));
const summaryOnly = process.argv.includes('--summary-only');
const check = process.argv.includes('--check');
const courseId = args.course;
if (!courseId) throw new Error('Usage: node scripts/build-learning-hub-review-queue.mjs --course=COURSE-LH-... [--summary-only] [--check]');

function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function readText(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => readJson(path.join(rel, n)));
}
function contentVersion(rel) {
  const digest = crypto.createHash('sha256').update(readText(rel)).digest('hex');
  return `sha256:${digest}`;
}
function normalizeMappedPracticals(course) {
  const value = course.extensions?.mappedPerformanceAssessments ?? course.extensions?.mappedPracticals ?? course.extensions?.mappedPractical ?? [];
  return Array.isArray(value) ? value : (value ? [value] : []);
}

const courses = new Map(readDirJson('content/courses').map((x) => [x.id, x]));
const modules = new Map(readDirJson('content/modules').map((x) => [x.id, x]));
const lessons = new Map(readDirJson('content/lessons').map((x) => [x.id, x]));
const assessments = readDirJson('content/assessments');
const questions = readDirJson('content/questions');
const performance = readDirJson('content/performance-assessments');
const performanceById = new Map(performance.map((x) => [x.id, x]));
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

const integratedLabPlanPaths = [
  'registry/technician-i-integrated-lab-plan.json',
  'registry/technician-ii-integrated-lab-plan.json'
];
const integratedLabPlans = integratedLabPlanPaths.filter(exists).map(readJson);
const sharedPracticalById = new Map();
for (const plan of integratedLabPlans) {
  for (const entry of plan.practicals ?? []) sharedPracticalById.set(entry.id, entry);
  if (plan.capstone?.id) sharedPracticalById.set(plan.capstone.id, plan.capstone);
}

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

// Follow the course's actual assessment graph. Shared/reused modules keep their own
// assessment and question namespaces; course-specific assessment objects still use
// the course namespace. This lets one approved shared object/version be reused across
// courses without fabricating duplicate Course-N IDs or silently omitting review work.
const referencedAssessmentIds = new Set();
for (const module of moduleObjects) if (module.assessment) referencedAssessmentIds.add(module.assessment);
if (course.finalAssessment) referencedAssessmentIds.add(course.finalAssessment);
for (const assessment of assessments) {
  if (assessment.id.startsWith(assessmentPrefix)) referencedAssessmentIds.add(assessment.id);
}

const reviewAssessments = [...referencedAssessmentIds]
  .map((id) => assessmentById.get(id))
  .filter(Boolean)
  .sort((a,b) => a.id.localeCompare(b.id));
const referencedItemIds = new Set(reviewAssessments.flatMap((assessment) => assessment.items ?? []));
const reviewQuestions = [...referencedItemIds]
  .map((id) => questionById.get(id))
  .filter(Boolean)
  .sort((a,b) => a.id.localeCompare(b.id));
const courseSpecificAssessments = reviewAssessments.filter((assessment) => assessment.id.startsWith(assessmentPrefix));

const coursePerformance = performance.filter((x) => x.id.startsWith(practicalPrefix) || x.id.startsWith(capstonePrefix)).sort((a,b) => a.id.localeCompare(b.id));
const mappedPracticalIds = normalizeMappedPracticals(course);
const directMappedPerformance = [];
const sharedMappedPracticals = [];
for (const practicalId of mappedPracticalIds) {
  if (coursePerformance.some((entry) => entry.id === practicalId)) continue;
  const direct = performanceById.get(practicalId);
  if (direct) {
    directMappedPerformance.push(direct);
    continue;
  }
  const practical = sharedPracticalById.get(practicalId);
  if (practical) sharedMappedPracticals.push(practical);
}

for (const assessment of reviewAssessments) {
  addTask(tasks, {
    lane:'assessment-definition',
    objectType:'assessment',
    objectId:assessment.id,
    objectVersion:assessment.version,
    reviewType:'assessment',
    sourceScope: assessment.id.startsWith(assessmentPrefix) ? 'course-specific' : 'shared-module'
  });
}
for (const item of reviewQuestions) {
  const lane = item.purpose === 'formative' ? 'formative-item' : item.purpose === 'summative' ? 'summative-item' : 'credential-item';
  addTask(tasks, {
    lane,
    objectType:'question',
    objectId:item.id,
    objectVersion:item.version,
    reviewType:'assessment',
    sourceScope: item.id.startsWith(itemPrefix) ? 'course-specific' : 'shared-module'
  });
}
for (const practical of [...coursePerformance, ...directMappedPerformance]) {
  addTask(tasks, {lane:'performance-assessment',objectType:'performance-assessment',objectId:practical.id,objectVersion:practical.version,reviewType:'assessment'});
}
for (const practical of sharedMappedPracticals) {
  if (!exists(practical.document)) continue;
  addTask(tasks, {
    lane:'performance-assessment',
    objectType:'shared-practical',
    objectId:practical.id,
    objectVersion:contentVersion(practical.document),
    reviewType:'assessment',
    sourcePath:practical.document,
    sourceState:practical.status ?? null
  });
}

const practicalCrosswalkPath = course.extensions?.practicalCrosswalk;
let practicalCrosswalk = null;
if (practicalCrosswalkPath && exists(practicalCrosswalkPath)) {
  practicalCrosswalk = readJson(practicalCrosswalkPath);
  addTask(tasks, {
    lane:'performance-crosswalk',
    objectType:'performance-crosswalk',
    objectId:practicalCrosswalk.id ?? `${course.id}-PERFORMANCE-CROSSWALK`,
    objectVersion:practicalCrosswalk.version ?? contentVersion(practicalCrosswalkPath),
    reviewType:'assessment',
    sourcePath:practicalCrosswalkPath,
    sourceState:practicalCrosswalk.status ?? null
  });
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
    assessments: reviewAssessments.length,
    courseSpecificAssessments: courseSpecificAssessments.length,
    knowledgeItems: reviewQuestions.length,
    courseSpecificKnowledgeItems: reviewQuestions.filter((item) => item.id.startsWith(itemPrefix)).length,
    performanceAssessments: coursePerformance.length + directMappedPerformance.length + sharedMappedPracticals.length,
    performanceCrosswalks: practicalCrosswalk ? 1 : 0
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

  for (const module of moduleObjects) {
    if (!Array.isArray(module.lessons) || module.lessons.length === 0) failures.push(`${module.id} must contain at least one lesson`);
  }

  for (const assessmentId of referencedAssessmentIds) {
    const assessment = assessmentById.get(assessmentId);
    if (!assessment) failures.push(`cannot resolve assessment ${assessmentId}`);
  }

  for (const assessment of reviewAssessments) {
    if (!Array.isArray(assessment.items) || assessment.items.length === 0) {
      failures.push(`${assessment.id} must contain at least one item`);
      continue;
    }
    if (new Set(assessment.items).size !== assessment.items.length) failures.push(`${assessment.id} contains duplicate item references`);
    const courseSpecific = assessment.id.startsWith(assessmentPrefix);
    for (const itemId of assessment.items) {
      const item = questionById.get(itemId);
      if (!item) failures.push(`${assessment.id} cannot resolve item ${itemId}`);
      else if (courseSpecific && !item.id.startsWith(itemPrefix)) failures.push(`${assessment.id} references item outside ${courseId}'s item namespace: ${itemId}`);
    }
  }

  for (const practicalId of mappedPracticalIds) {
    const local = coursePerformance.find((entry) => entry.id === practicalId) ?? performanceById.get(practicalId);
    if (local) continue;
    const shared = sharedPracticalById.get(practicalId);
    if (!shared) {
      failures.push(`mapped practical ${practicalId} cannot be resolved from local performance assessments or the Technician I integrated lab plan`);
      continue;
    }
    if (!shared.document || !exists(shared.document)) failures.push(`mapped practical ${practicalId} document is missing: ${shared.document ?? '<none>'}`);
  }

  if (practicalCrosswalkPath) {
    if (!practicalCrosswalk) failures.push(`practical crosswalk cannot be resolved: ${practicalCrosswalkPath}`);
    else {
      if (practicalCrosswalk.courseId !== course.id) failures.push(`practical crosswalk course mismatch: ${practicalCrosswalk.courseId} != ${course.id}`);
      const crosswalkPracticals = new Set([
        practicalCrosswalk.practicalId,
        ...(practicalCrosswalk.practicalIds ?? []),
        ...(practicalCrosswalk.practicals ?? [])
      ].filter(Boolean).map((entry) => typeof entry === 'string' ? entry : entry.id).filter(Boolean));
      for (const practicalId of mappedPracticalIds) {
        if (!crosswalkPracticals.has(practicalId) && mappedPracticalIds.length === 1) failures.push(`practical crosswalk does not identify mapped practical ${practicalId}`);
      }
    }
  }

  if (courseSpecificAssessments.length === 0) failures.push('course must resolve at least one course-specific assessment');
  if (tasks.length === 0) failures.push('review queue must contain at least one task');
  if (mappedPracticalIds.length > 0 && !tasks.some((task) => task.lane === 'performance-assessment')) failures.push('mapped practicals require at least one performance-assessment review task');
  if (practicalCrosswalkPath && !tasks.some((task) => task.lane === 'performance-crosswalk')) failures.push('mapped practical crosswalk requires a performance-crosswalk review task');
  if (failures.length) throw new Error(`${courseId} Learning Hub review queue integrity check failed: ${failures.join('; ')}`);
}

console.log(JSON.stringify(output, null, 2));
