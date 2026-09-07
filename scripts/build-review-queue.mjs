import fs from 'node:fs';
import path from 'node:path';
import { catalogAttestationApproval } from './catalog-review-attestation.mjs';

const root = process.cwd();
const summaryOnly = process.argv.includes('--summary-only');

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

const registry = readJson('registry/cultivation-foundations.json');
const modules = new Map(readDirJson('content/modules').map((data) => [data.id, data]));
const lessons = new Map(readDirJson('content/lessons').map((data) => [data.id, data]));
const assessments = readDirJson('content/assessments');
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');

function latestReview(objectId, objectVersion, reviewType, objectType) {
  const explicit = reviews
    .filter((review) =>
      review.objectId === objectId &&
      String(review.objectVersion) === String(objectVersion) &&
      review.reviewType === reviewType
    )
    .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0] ?? null;
  if (explicit) return explicit;
  const attestation = catalogAttestationApproval(objectType, reviewType);
  return attestation ? {
    id: attestation.id,
    objectId,
    objectVersion,
    reviewType,
    status: 'approved',
    reviewerId: attestation.reviewerId,
    reviewedAt: attestation.reviewedAt,
    notes: 'Approved by snapshot-bound catalog attestation.'
  } : null;
}

function stateFromReview(review) {
  if (!review) return 'pending';
  if (review.status === 'approved') return 'approved';
  return 'revision-required';
}

const lessonIds = new Set();
const competencyIds = new Set();
const assessmentIds = new Set([registry.summativeAssessment].filter(Boolean));
for (const domain of registry.domains ?? []) {
  const module = modules.get(domain.module);
  if (!module) throw new Error(`Review queue cannot resolve module ${domain.module}`);
  for (const lessonId of module.lessons ?? []) lessonIds.add(lessonId);
  for (const competencyId of domain.competencies ?? []) competencyIds.add(competencyId);
  if (module.assessment) assessmentIds.add(module.assessment);
}

const scopedAssessments = assessments.filter((assessment) => assessmentIds.has(assessment.id));
const explicitlyReferencedQuestionIds = new Set(scopedAssessments.flatMap((assessment) => assessment.items ?? []));
const scopedQuestions = questions.filter((item) =>
  explicitlyReferencedQuestionIds.has(item.id) ||
  (competencyIds.has(item.competency) && ['summative', 'credential'].includes(item.purpose))
);

const tasks = [];
for (const lessonId of [...lessonIds].sort()) {
  const lesson = lessons.get(lessonId);
  if (!lesson) throw new Error(`Review queue cannot resolve lesson ${lessonId}`);

  const scientific = latestReview(lesson.id, lesson.version, 'scientific', 'lesson');
  const scientificState = stateFromReview(scientific);
  tasks.push({
    lane: 'lesson-scientific',
    objectType: 'lesson',
    objectId: lesson.id,
    objectVersion: lesson.version,
    reviewType: 'scientific',
    state: scientificState,
    latestReviewId: scientific?.id ?? null
  });

  const editorial = latestReview(lesson.id, lesson.version, 'editorial', 'lesson');
  const editorialState = scientificState === 'approved' ? stateFromReview(editorial) : 'blocked';
  tasks.push({
    lane: 'lesson-editorial',
    objectType: 'lesson',
    objectId: lesson.id,
    objectVersion: lesson.version,
    reviewType: 'editorial',
    state: editorialState,
    blockedBy: scientificState === 'approved' ? null : 'scientific-approval',
    latestReviewId: editorial?.id ?? null
  });
}

for (const assessment of [...scopedAssessments].sort((a, b) => a.id.localeCompare(b.id))) {
  const review = latestReview(assessment.id, assessment.version, 'assessment', 'assessment');
  tasks.push({
    lane: 'assessment-definition',
    objectType: 'assessment',
    objectId: assessment.id,
    objectVersion: assessment.version,
    reviewType: 'assessment',
    state: stateFromReview(review),
    latestReviewId: review?.id ?? null
  });
}

for (const item of [...scopedQuestions].sort((a, b) => a.id.localeCompare(b.id))) {
  const review = latestReview(item.id, item.version, 'assessment', 'question');
  tasks.push({
    lane: item.purpose === 'formative' ? 'formative-item' : 'credential-item',
    objectType: 'question',
    objectId: item.id,
    objectVersion: item.version,
    reviewType: 'assessment',
    state: stateFromReview(review),
    latestReviewId: review?.id ?? null
  });
}

const counts = tasks.reduce((acc, task) => {
  acc[task.state] = (acc[task.state] ?? 0) + 1;
  return acc;
}, {});

const laneSummary = Object.fromEntries(
  [...new Set(tasks.map((task) => task.lane))].sort().map((lane) => [
    lane,
    {
      total: tasks.filter((task) => task.lane === lane).length,
      approved: tasks.filter((task) => task.lane === lane && task.state === 'approved').length,
      pending: tasks.filter((task) => task.lane === lane && task.state === 'pending').length,
      blocked: tasks.filter((task) => task.lane === lane && task.state === 'blocked').length,
      revisionRequired: tasks.filter((task) => task.lane === lane && task.state === 'revision-required').length
    }
  ])
);

const output = {
  curriculum: registry.course,
  curriculumVersion: registry.version,
  releaseScope: {
    competencies: competencyIds.size,
    assessments: scopedAssessments.length,
    questions: scopedQuestions.length
  },
  generatedFromReviewRecords: reviews.length,
  summary: {
    totalTasks: tasks.length,
    approved: counts.approved ?? 0,
    pending: counts.pending ?? 0,
    blocked: counts.blocked ?? 0,
    revisionRequired: counts['revision-required'] ?? 0
  },
  lanes: laneSummary,
  ...(summaryOnly ? {} : { tasks })
};

console.log(JSON.stringify(output, null, 2));
