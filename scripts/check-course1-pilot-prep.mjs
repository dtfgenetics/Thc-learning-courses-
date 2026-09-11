import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readDirJson = (rel) => {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => readJson(path.join(rel, n)));
};

const failures = [];
const planPath = 'content/pilot-plans/PILOTPLAN-LH-TECH1-001.json';
if (!fs.existsSync(path.join(root, planPath))) throw new Error(`Missing ${planPath}`);
const plan = readJson(planPath);
const courses = new Map(readDirJson('content/courses').map((x) => [x.id, x]));
const questions = readDirJson('content/questions');
const performance = new Map(readDirJson('content/performance-assessments').map((x) => [x.id, x]));
const reviews = readDirJson('content/reviews');
const pilotEvidence = readDirJson('content/pilot-evidence');

const course = courses.get(plan.course);
if (!course) failures.push(`plan references missing course ${plan.course}`);
else if (String(course.version) !== String(plan.courseVersion)) failures.push(`plan courseVersion ${plan.courseVersion} does not match ${course.id}@${course.version}`);

const key = plan.course.replace(/^COURSE-/, '');
const items = questions.filter((x) => x.id.startsWith(`ITEM-${key}-`));
const formative = items.filter((x) => x.purpose === 'formative');
const summative = items.filter((x) => x.purpose === 'summative');
const credential = items.filter((x) => x.purpose === 'credential');
if (formative.length !== plan.knowledgeAssessment.formativeItems) failures.push(`expected ${plan.knowledgeAssessment.formativeItems} formative items, found ${formative.length}`);
if (summative.length !== plan.knowledgeAssessment.summativeItems) failures.push(`expected ${plan.knowledgeAssessment.summativeItems} summative items, found ${summative.length}`);
if (credential.length !== 0) failures.push(`Course 1 public pilot scope must not contain credential items; found ${credential.length}`);
if (plan.knowledgeAssessment.minimumUsableResponsesForPreliminaryReview > plan.knowledgeAssessment.targetUsableResponsesPerItem) failures.push('minimum usable responses cannot exceed target usable responses');
if (plan.knowledgeAssessment.participantDataRepositoryPolicy !== 'participant-level-data-must-not-be-committed') failures.push('participant-level repository policy is not fail-closed');
if (plan.knowledgeAssessment.flagRules?.automaticDisposition !== false) failures.push('pilot statistics must not automatically disposition items');

for (const id of plan.performanceAssessment.assessmentIds) {
  const practical = performance.get(id);
  if (!practical) failures.push(`missing performance assessment ${id}`);
  else if (practical.extensions?.course !== plan.course) failures.push(`${id} is not mapped to ${plan.course}`);
}
if (plan.performanceAssessment.minimumCalibrationAssessors < 2) failures.push('practical calibration must require at least two assessors');
if (plan.performanceAssessment.minimumCalibrationSamples < 3) failures.push('practical calibration must require at least three common samples');
if (plan.performanceAssessment.criticalErrorAgreementRequired !== true) failures.push('critical-error agreement must be required');
for (const form of ['A', 'B']) if (!plan.performanceAssessment.formsRequired.includes(form)) failures.push(`pilot plan is missing practical Form ${form}`);

const missingDocuments = plan.documents.filter((rel) => !fs.existsSync(path.join(root, rel)));
for (const rel of missingDocuments) failures.push(`missing pilot document ${rel}`);

const requiredReviewTypes = new Map([
  ['scientific', false],
  ['editorial', false],
  ['assessment', false],
  ['accessibility', false],
  ['legal-compliance', false]
]);
for (const review of reviews) if (review.status === 'approved' && requiredReviewTypes.has(review.reviewType)) requiredReviewTypes.set(review.reviewType, true);

const evidenceForCourseItems = pilotEvidence.filter((record) => items.some((item) => item.id === record.itemId && String(item.version) === String(record.itemVersion)));
const completeEvidence = evidenceForCourseItems.filter((x) => x.status === 'complete');
const atPreliminaryMinimum = completeEvidence.filter((x) => x.sampleSize >= plan.knowledgeAssessment.minimumUsableResponsesForPreliminaryReview);
const atTarget = completeEvidence.filter((x) => x.sampleSize >= plan.knowledgeAssessment.targetUsableResponsesPerItem);

const output = {
  plan: plan.id,
  course: plan.course,
  courseVersion: plan.courseVersion,
  planStatus: plan.status,
  preparation: {
    documentsRequired: plan.documents.length,
    documentsPresent: plan.documents.length - missingDocuments.length,
    formativeItems: formative.length,
    summativeItems: summative.length,
    credentialItemsInPublicCourseScope: credential.length,
    practicals: plan.performanceAssessment.assessmentIds.length,
    structurallyReady: failures.length === 0
  },
  humanPreconditions: Object.fromEntries(requiredReviewTypes),
  pilotEvidence: {
    courseItemRecords: evidenceForCourseItems.length,
    completeRecords: completeEvidence.length,
    atPreliminaryMinimum: atPreliminaryMinimum.length,
    atInternalTarget: atTarget.length,
    totalKnowledgeItems: items.length
  },
  pilotOpenEligible: failures.length === 0 && [...requiredReviewTypes.values()].every(Boolean),
  note: 'Pilot-open eligibility requires real approved review records. Pilot evidence and standard-setting completion are later gates and are never inferred from preparation assets.'
};

if (failures.length) {
  console.error('Course 1 pilot-preparation gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  if (check) process.exit(1);
}
console.log(JSON.stringify(output, null, 2));
