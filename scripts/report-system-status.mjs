import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const human = process.argv.includes('--human');
const check = process.argv.includes('--check');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDir(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

function statusCounts(items) {
  return items.reduce((acc, item) => {
    const key = item.status ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

const courses = readDir('content/courses');
const modules = readDir('content/modules');
const lessons = readDir('content/lessons');
const assessments = readDir('content/assessments');
const questions = readDir('content/questions');
const credentials = readDir('content/credentials');
const reviews = readDir('content/reviews');
const pilots = readDir('content/pilot-evidence');
const encyclopedia = readDir('content/encyclopedia');
const glossary = readDir('content/glossary');
const readiness = readJson('registry/system-readiness.json');

function hasApprovedReview(objectId, objectVersion, reviewType) {
  return reviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
}

let pendingScientific = 0;
let pendingEditorial = 0;
let pendingAssessment = 0;
for (const lesson of lessons) {
  if (!hasApprovedReview(lesson.id, lesson.version, 'scientific')) pendingScientific += 1;
  if (!hasApprovedReview(lesson.id, lesson.version, 'editorial')) pendingEditorial += 1;
}
for (const assessment of assessments) {
  if (!hasApprovedReview(assessment.id, assessment.version, 'assessment')) pendingAssessment += 1;
}
for (const question of questions) {
  if (!hasApprovedReview(question.id, question.version, 'assessment')) pendingAssessment += 1;
}

const summativeQuestions = questions.filter((item) => ['summative', 'credential'].includes(item.purpose));
const activeQuestions = summativeQuestions.filter((item) => item.status === 'active');
const completedPilots = pilots.filter((record) => record.status === 'complete' || record.complete === true);

const productionBlockers = [];
for (const [areaName, area] of Object.entries(readiness.areas ?? {})) {
  for (const [gateName, value] of Object.entries(area.gates ?? {})) {
    if (value !== true) productionBlockers.push(`${areaName}.${gateName}`);
  }
}

const stagingRequired = [
  ['curriculum', 'substantiveContentComplete'],
  ['assessment', 'blueprintComplete'],
  ['assessment', 'developmentFormGeneration'],
  ['runtime', 'serverSideAttemptStateMachine'],
  ['runtime', 'serverSideScoringCore'],
  ['runtime', 'competencyResultCore'],
  ['runtime', 'postgresSchemaDefined'],
  ['credentials', 'deterministicEligibility'],
  ['credentials', 'testIssuance'],
  ['credentials', 'privacySafeVerificationProjection'],
  ['api', 'verificationContract'],
  ['api', 'developmentHttpService'],
  ['api', 'rateLimiting'],
  ['api', 'authentication'],
  ['api', 'observability'],
  ['security', 'piiExcludedFromGit'],
  ['security', 'privateKeysExcludedFromGit'],
  ['security', 'serverSideScoringBoundary'],
  ['operations', 'releasePolicyDefined'],
  ['operations', 'incidentResponseRunbook']
];
const stagingBlockers = stagingRequired
  .filter(([area, gate]) => readiness.areas?.[area]?.gates?.[gate] !== true)
  .map(([area, gate]) => `${area}.${gate}`);

const report = {
  system: readiness.system,
  version: readiness.version,
  stagingUsable: stagingBlockers.length === 0,
  productionReady: readiness.productionReady === true && productionBlockers.length === 0,
  inventory: {
    courses: courses.length,
    modules: modules.length,
    lessons: lessons.length,
    assessments: assessments.length,
    questions: questions.length,
    summativeCredentialQuestions: summativeQuestions.length,
    activeSummativeCredentialQuestions: activeQuestions.length,
    credentials: credentials.length,
    encyclopediaEntries: encyclopedia.length,
    glossaryTerms: glossary.length
  },
  statuses: {
    courses: statusCounts(courses),
    lessons: statusCounts(lessons),
    assessments: statusCounts(assessments),
    questions: statusCounts(questions),
    credentials: statusCounts(credentials)
  },
  review: {
    approvedRecords: reviews.filter((review) => review.status === 'approved').length,
    totalRecords: reviews.length,
    pendingScientific,
    pendingEditorial,
    pendingAssessment,
    pendingTotal: pendingScientific + pendingEditorial + pendingAssessment
  },
  pilot: {
    records: pilots.length,
    completed: completedPilots.length
  },
  stagingBlockers,
  productionBlockerCount: productionBlockers.length,
  productionBlockers
};

if (human) {
  console.log(`# ${report.system} status`);
  console.log(`Staging usable: ${report.stagingUsable ? 'YES' : 'NO'}`);
  console.log(`Production ready: ${report.productionReady ? 'YES' : 'NO'}`);
  console.log(`Courses: ${report.inventory.courses} | Modules: ${report.inventory.modules} | Lessons: ${report.inventory.lessons}`);
  console.log(`Assessments: ${report.inventory.assessments} | Questions: ${report.inventory.questions} | Summative/credential: ${report.inventory.summativeCredentialQuestions} | Active: ${report.inventory.activeSummativeCredentialQuestions}`);
  console.log(`Credentials: ${report.inventory.credentials} | Encyclopedia: ${report.inventory.encyclopediaEntries} | Glossary: ${report.inventory.glossaryTerms}`);
  console.log(`Pending reviews: ${report.review.pendingTotal} (scientific ${pendingScientific}, editorial ${pendingEditorial}, assessment ${pendingAssessment})`);
  console.log(`Pilot records: ${report.pilot.records} | Completed: ${report.pilot.completed}`);
  console.log(`Production blockers: ${report.productionBlockerCount}`);
  for (const blocker of report.productionBlockers) console.log(`- ${blocker}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (check) {
  if (!report.stagingUsable) process.exit(1);
  if (report.inventory.courses < 1 || report.inventory.lessons < 1 || report.inventory.assessments < 1) process.exit(1);
}
