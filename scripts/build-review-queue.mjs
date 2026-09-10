import fs from 'node:fs';
import path from 'node:path';
import { catalogAttestationApproval } from './catalog-review-attestation.mjs';

const root = process.cwd();
const summaryOnly = process.argv.includes('--summary-only');
const scopeArg = process.argv.find((arg) => arg.startsWith('--scope='))?.split('=')[1] ?? 'global';
const validScopes = new Set(['global', 'foundations']);
if (!validScopes.has(scopeArg)) {
  throw new Error(`--scope must be one of: ${[...validScopes].join(', ')}`);
}

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

const globalRegistry = readJson('registry/curriculum.json');
const foundationsRegistry = readJson('registry/cultivation-foundations.json');
const modules = new Map(readDirJson('content/modules').map((data) => [data.id, data]));
const lessons = new Map(readDirJson('content/lessons').map((data) => [data.id, data]));
const assessments = new Map(readDirJson('content/assessments').map((data) => [data.id, data]));
const questions = new Map(readDirJson('content/questions').map((data) => [data.id, data]));
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

function requireObjects(ids, map, label) {
  for (const id of ids) {
    if (!map.has(id)) throw new Error(`Review queue cannot resolve ${label} ${id}`);
  }
}

function foundationsScope() {
  const lessonIds = new Set();
  const competencyIds = new Set();
  const assessmentIds = new Set([foundationsRegistry.summativeAssessment].filter(Boolean));
  for (const domain of foundationsRegistry.domains ?? []) {
    const module = modules.get(domain.module);
    if (!module) throw new Error(`Review queue cannot resolve module ${domain.module}`);
    for (const lessonId of module.lessons ?? []) lessonIds.add(lessonId);
    for (const competencyId of domain.competencies ?? []) competencyIds.add(competencyId);
    if (module.assessment) assessmentIds.add(module.assessment);
  }

  const scopedAssessments = [...assessmentIds].map((id) => assessments.get(id)).filter(Boolean);
  const explicitlyReferencedQuestionIds = new Set(scopedAssessments.flatMap((assessment) => assessment.items ?? []));
  const questionIds = new Set(
    [...questions.values()]
      .filter((item) =>
        explicitlyReferencedQuestionIds.has(item.id) ||
        (competencyIds.has(item.competency) && ['summative', 'credential'].includes(item.purpose))
      )
      .map((item) => item.id)
  );

  return {
    name: 'foundations',
    curriculum: foundationsRegistry.course,
    curriculumVersion: foundationsRegistry.version,
    courseIds: new Set([foundationsRegistry.course]),
    lessonIds,
    assessmentIds,
    questionIds,
    competencyIds
  };
}

function globalScope() {
  const courseIds = new Set(globalRegistry.courses ?? []);
  const lessonIds = new Set(globalRegistry.lessons ?? []);
  const assessmentIds = new Set(globalRegistry.assessments ?? []);
  const questionIds = new Set(globalRegistry.questions ?? []);
  requireObjects(lessonIds, lessons, 'lesson');
  requireObjects(assessmentIds, assessments, 'assessment');
  requireObjects(questionIds, questions, 'question');
  return {
    name: 'global',
    curriculum: globalRegistry.release,
    curriculumVersion: globalRegistry.release,
    courseIds,
    lessonIds,
    assessmentIds,
    questionIds,
    competencyIds: new Set(globalRegistry.competencies ?? [])
  };
}

const scope = scopeArg === 'foundations' ? foundationsScope() : globalScope();
const scopedAssessments = [...scope.assessmentIds].map((id) => assessments.get(id)).filter(Boolean);
const scopedQuestions = [...scope.questionIds].map((id) => questions.get(id)).filter(Boolean);

const tasks = [];
for (const lessonId of [...scope.lessonIds].sort()) {
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

function questionLane(item) {
  if (item.purpose === 'practice') return 'practice-item';
  if (item.purpose === 'formative') return 'formative-item';
  return 'credential-item';
}

for (const item of [...scopedQuestions].sort((a, b) => a.id.localeCompare(b.id))) {
  const review = latestReview(item.id, item.version, 'assessment', 'question');
  tasks.push({
    lane: questionLane(item),
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
  scope: scope.name,
  curriculum: scope.curriculum,
  curriculumVersion: scope.curriculumVersion,
  releaseScope: {
    courses: scope.courseIds.size,
    competencies: scope.competencyIds.size,
    lessons: scope.lessonIds.size,
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
