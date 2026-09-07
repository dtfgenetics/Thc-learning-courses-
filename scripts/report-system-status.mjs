import fs from 'node:fs';
import path from 'node:path';
import { catalogAttestationApproval, catalogAttestationStatus } from './catalog-review-attestation.mjs';

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
const assessmentIds = new Set(assessments.map((assessment) => assessment.id));
const attestation = catalogAttestationStatus();

function hasApprovedReview(objectId, objectVersion, reviewType, objectType) {
  const explicit = reviews.some((review) =>
    review.objectId === objectId &&
    String(review.objectVersion) === String(objectVersion) &&
    review.reviewType === reviewType &&
    review.status === 'approved'
  );
  return explicit || Boolean(catalogAttestationApproval(objectType, reviewType));
}

let pendingScientific = 0;
let pendingEditorial = 0;
let pendingAssessment = 0;
for (const lesson of lessons) {
  if (!hasApprovedReview(lesson.id, lesson.version, 'scientific', 'lesson')) pendingScientific += 1;
  if (!hasApprovedReview(lesson.id, lesson.version, 'editorial', 'lesson')) pendingEditorial += 1;
}
for (const assessment of assessments) {
  if (!hasApprovedReview(assessment.id, assessment.version, 'assessment', 'assessment')) pendingAssessment += 1;
}
for (const question of questions) {
  if (!hasApprovedReview(question.id, question.version, 'assessment', 'question')) pendingAssessment += 1;
}

const actualHumanAssessmentReviewComplete = pendingAssessment === 0;
const declaredHumanAssessmentReviewComplete = readiness.areas?.assessment?.gates?.humanAssessmentReviewComplete === true;
const assessmentReviewReadinessDrift = declaredHumanAssessmentReviewComplete !== actualHumanAssessmentReviewComplete;

const summativeQuestions = questions.filter((item) => ['summative', 'credential'].includes(item.purpose));
const activeQuestions = summativeQuestions.filter((item) => item.status === 'active');
const completedPilots = pilots.filter((record) => record.status === 'complete' || record.complete === true);

const coursesMissingFinalAssessment = courses
  .filter((course) => !course.finalAssessment || !assessmentIds.has(course.finalAssessment))
  .map((course) => ({
    id: course.id,
    credentialBearing: course.credentialBearing === true,
    finalAssessment: course.finalAssessment ?? null,
    reason: !course.finalAssessment ? 'missing-final-assessment' : 'unresolved-final-assessment'
  }));
const coursesWithFinalAssessment = courses.length - coursesMissingFinalAssessment.length;

const modulesMissingAssessment = modules
  .filter((module) => !module.assessment || !assessmentIds.has(module.assessment))
  .map((module) => ({
    id: module.id,
    assessment: module.assessment ?? null,
    reason: !module.assessment ? 'missing-module-assessment' : 'unresolved-module-assessment'
  }));
const modulesWithAssessment = modules.length - modulesMissingAssessment.length;

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
  structure: {
    coursesWithFinalAssessment,
    coursesMissingFinalAssessment,
    courseFinalCoveragePercent: courses.length ? Number(((coursesWithFinalAssessment / courses.length) * 100).toFixed(1)) : 100,
    modulesWithAssessment,
    modulesMissingAssessment,
    moduleAssessmentCoveragePercent: modules.length ? Number(((modulesWithAssessment / modules.length) * 100).toFixed(1)) : 100
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
    catalogAttestation: attestation,
    pendingScientific,
    pendingEditorial,
    pendingAssessment,
    pendingTotal: pendingScientific + pendingEditorial + pendingAssessment,
    humanAssessmentReviewComplete: actualHumanAssessmentReviewComplete
  },
  readinessConsistency: {
    assessmentHumanReview: {
      declared: declaredHumanAssessmentReviewComplete,
      actual: actualHumanAssessmentReviewComplete,
      drift: assessmentReviewReadinessDrift,
      evidence: `${pendingAssessment} pending assessment/question review(s) after exact-version records and valid snapshot attestations`
    }
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
  console.log(`Course finals: ${report.structure.coursesWithFinalAssessment}/${report.inventory.courses} (${report.structure.courseFinalCoveragePercent}%) | Module assessments: ${report.structure.modulesWithAssessment}/${report.inventory.modules} (${report.structure.moduleAssessmentCoveragePercent}%)`);
  for (const course of report.structure.coursesMissingFinalAssessment) console.log(`- Course structure gap: ${course.id} (${course.reason})`);
  for (const module of report.structure.modulesMissingAssessment) console.log(`- Module structure gap: ${module.id} (${module.reason})`);
  console.log(`Assessments: ${report.inventory.assessments} | Questions: ${report.inventory.questions} | Summative/credential: ${report.inventory.summativeCredentialQuestions} | Active: ${report.inventory.activeSummativeCredentialQuestions}`);
  console.log(`Credentials: ${report.inventory.credentials} | Encyclopedia: ${report.inventory.encyclopediaEntries} | Glossary: ${report.inventory.glossaryTerms}`);
  console.log(`Catalog approval attestation: ${attestation.latestValidId ?? 'NONE'} | Valid records: ${attestation.validRecords}`);
  console.log(`Pending reviews: ${report.review.pendingTotal} (scientific ${pendingScientific}, editorial ${pendingEditorial}, assessment ${pendingAssessment})`);
  console.log(`Assessment review readiness: declared ${declaredHumanAssessmentReviewComplete ? 'COMPLETE' : 'INCOMPLETE'} | actual ${actualHumanAssessmentReviewComplete ? 'COMPLETE' : 'INCOMPLETE'} | drift ${assessmentReviewReadinessDrift ? 'YES' : 'NO'}`);
  console.log(`Pilot records: ${report.pilot.records} | Completed: ${report.pilot.completed}`);
  console.log(`Production blockers: ${report.productionBlockerCount}`);
  for (const blocker of report.productionBlockers) console.log(`- ${blocker}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (check) {
  if (!report.stagingUsable) process.exit(1);
  if (report.inventory.courses < 1 || report.inventory.lessons < 1 || report.inventory.assessments < 1) process.exit(1);
  if (assessmentReviewReadinessDrift) {
    console.error(`Assessment review readiness drift: registry declares ${declaredHumanAssessmentReviewComplete}, live evidence resolves ${actualHumanAssessmentReviewComplete} with ${pendingAssessment} pending review(s).`);
    process.exit(1);
  }
}
