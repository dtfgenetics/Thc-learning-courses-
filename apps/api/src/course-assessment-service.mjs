import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  createCourseAssessmentAttempt,
  presentCourseAssessmentAttempt,
  normalizePresentedResponse,
  scorePersistedCourseAssessment
} from '../../../packages/domain/course-assessment-runtime.mjs';
import { deriveCourseAssessmentResults } from '../../../packages/domain/course-grader-v2.mjs';

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fileFor(dir, id) {
  if (!/^[A-Z0-9-]+$/.test(String(id ?? ''))) return null;
  const file = path.join(root, 'content', dir, `${id}.json`);
  return fs.existsSync(file) ? file : null;
}

function loadById(dir, id) {
  const file = fileFor(dir, id);
  if (!file) return null;
  const object = readJson(file);
  return object?.id === id ? object : null;
}

function releaseForCourse(courseId) {
  const dir = path.join(root, 'content', 'public-releases');
  if (!fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith('.json'))) {
    const release = readJson(path.join(dir, name));
    if (release.courseId === courseId && release.publicationState === 'published') return release;
  }
  return null;
}

function courseFinalAssessment(courseId) {
  const dir = path.join(root, 'content', 'assessments');
  if (!fs.existsSync(dir)) return null;
  const candidates = [];
  for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith('.json'))) {
    const assessment = readJson(path.join(dir, name));
    if (assessment.purpose === 'summative' && assessment.extensions?.courseId === courseId) candidates.push(assessment);
  }
  if (candidates.length !== 1) return null;
  return candidates[0];
}

export function loadPublishedCourseAssessment(courseId) {
  const course = loadById('courses', courseId);
  if (!course) return { error: 'course-not-found' };
  const release = releaseForCourse(courseId);
  if (!release) return { error: 'course-assessment-not-released' };
  if (release.publicationBoundary?.courseTests !== 'released-for-learning') return { error: 'course-assessment-not-released' };
  const assessment = courseFinalAssessment(courseId);
  if (!assessment) return { error: 'course-final-assessment-not-found' };
  if (!(release.publicScope?.assessments ?? []).includes(assessment.id)) return { error: 'course-assessment-not-released' };
  if (!Array.isArray(assessment.items) || assessment.items.length === 0) return { error: 'course-assessment-items-missing' };

  const itemBank = [];
  for (const itemId of assessment.items) {
    const item = loadById('questions', itemId);
    if (!item || item.purpose !== 'summative') return { error: 'course-assessment-item-unavailable', itemId };
    itemBank.push(item);
  }
  const competencyTitles = new Map();
  for (const competencyId of assessment.competencies ?? []) {
    const competency = loadById('competencies', competencyId);
    competencyTitles.set(competencyId, competency?.title ?? competencyId);
  }
  const objectiveTitles = new Map();
  for (const objectiveId of assessment.objectives ?? []) {
    const objective = loadById('learning-objectives', objectiveId);
    objectiveTitles.set(objectiveId, objective?.title ?? objective?.statement ?? objectiveId);
  }
  return { course, assessment, itemBank, competencyTitles, objectiveTitles, release };
}

function ensureAttemptMatchesPackage(attempt, bundle) {
  if (!attempt || attempt.assessmentId !== bundle.assessment.id) throw new Error('assessment-attempt-course-mismatch');
  if (String(attempt.assessmentVersion) !== String(bundle.assessment.version)) throw new Error('assessment-version-unavailable');
  const bank = new Map(bundle.itemBank.map((item) => [`${item.id}@${item.version}`, item]));
  for (const row of attempt.items ?? []) {
    if (!bank.has(`${row.itemId}@${row.itemVersion}`)) throw new Error(`immutable-item-version-unavailable:${row.itemId}@${row.itemVersion}`);
  }
}

function safeAttemptView(bundle, attempt, { resumed = false } = {}) {
  ensureAttemptMatchesPackage(attempt, bundle);
  const view = presentCourseAssessmentAttempt({ assessment: bundle.assessment, attempt, itemBank: bundle.itemBank });
  return {
    course: { id: bundle.course.id, title: bundle.course.title, version: bundle.course.version },
    resumed,
    ...view
  };
}

export async function startOrResumeCourseAssessment({ learnerStore, subject, courseId, now = new Date().toISOString() }) {
  const bundle = loadPublishedCourseAssessment(courseId);
  if (bundle.error) return { status: bundle.error === 'course-not-found' ? 404 : 409, body: { error: bundle.error } };
  let attempt = await learnerStore.findOpenAssessmentAttempt(subject, { assessmentId: bundle.assessment.id });
  const resumed = Boolean(attempt);
  if (!attempt) {
    attempt = createCourseAssessmentAttempt({ learnerId: subject, assessment: bundle.assessment, itemBank: bundle.itemBank, now, seed: crypto.randomUUID() });
    await learnerStore.createAssessmentAttempt(subject, { attempt });
  }
  return { status: 200, body: safeAttemptView(bundle, attempt, { resumed }) };
}

export async function saveCourseAssessmentResponses({ learnerStore, subject, attemptId, responses }) {
  const attempt = await learnerStore.getAssessmentAttempt(subject, { attemptId });
  if (!attempt) return { status: 404, body: { error: 'assessment-attempt-not-found' } };
  if (attempt.status !== 'started') return { status: 409, body: { error: 'assessment-attempt-not-editable', status: attempt.status } };
  const assessment = loadById('assessments', attempt.assessmentId);
  if (!assessment?.extensions?.courseId) return { status: 409, body: { error: 'course-assessment-not-released' } };
  const bundle = loadPublishedCourseAssessment(assessment.extensions.courseId);
  if (bundle.error) return { status: 409, body: { error: bundle.error } };
  ensureAttemptMatchesPackage(attempt, bundle);
  if (!Array.isArray(responses) || responses.length < 1 || responses.length > attempt.items.length) return { status: 400, body: { error: 'invalid-assessment-responses' } };

  const attemptItems = new Map(attempt.items.map((row) => [`${row.itemId}@${row.itemVersion}`, row]));
  const bank = new Map(bundle.itemBank.map((item) => [`${item.id}@${item.version}`, item]));
  const seen = new Set();
  const normalized = [];
  try {
    for (const row of responses) {
      const key = `${row?.itemId}@${row?.itemVersion}`;
      if (seen.has(key)) throw new Error('duplicate response');
      seen.add(key);
      if (!attemptItems.has(key) || !bank.has(key)) throw new Error('response item mismatch');
      const item = bank.get(key);
      const response = row.response == null
        ? null
        : normalizePresentedResponse(item, { formId: attempt.formId, response: row.response, randomizeChoices: bundle.assessment.randomizeChoices !== false });
      normalized.push({ itemId: item.id, itemVersion: item.version, response });
    }
  } catch (error) {
    return { status: 400, body: { error: 'invalid-assessment-response', detail: error.message } };
  }
  await learnerStore.saveAssessmentResponses(subject, { attemptId, responses: normalized });
  return { status: 200, body: { attemptId, saved: normalized.length } };
}

function resultView(bundle, attempt) {
  const results = deriveCourseAssessmentResults({ assessment: bundle.assessment, attempt, itemBank: bundle.itemBank });
  const competencyResults = results.competencyResults.map((row) => ({
    competencyId: row.competency,
    title: bundle.competencyTitles.get(row.competency) ?? row.competency,
    scorePercent: row.scorePercent,
    masteryLevel: row.masteryLevel,
    itemCount: row.itemCount,
    minimumPercent: Object.hasOwn(results.policy.competencyMinimums, row.competency) ? results.policy.competencyMinimums[row.competency] : null,
    minimumMet: !Object.hasOwn(results.policy.competencyMinimums, row.competency) || row.scorePercent >= results.policy.competencyMinimums[row.competency]
  }));
  const objectiveResults = results.objectiveResults.map((row) => ({
    objectiveId: row.objective,
    title: bundle.objectiveTitles.get(row.objective) ?? row.objective,
    scorePercent: row.scorePercent,
    masteryLevel: row.masteryLevel,
    itemCount: row.itemCount
  }));
  const weakestCompetencies = [...competencyResults].sort((a, b) => a.scorePercent - b.scorePercent).slice(0, 3).map((row) => ({ competencyId: row.competencyId, title: row.title, scorePercent: row.scorePercent }));
  const weakestObjectives = [...objectiveResults].sort((a, b) => a.scorePercent - b.scorePercent).slice(0, 4).map((row) => ({ objectiveId: row.objectiveId, title: row.title, scorePercent: row.scorePercent }));
  return {
    course: { id: bundle.course.id, title: bundle.course.title },
    assessment: {
      id: bundle.assessment.id,
      title: bundle.assessment.title,
      passingScorePercent: Number(bundle.assessment.passingScorePercent ?? 0),
      feedbackMode: bundle.assessment.feedbackMode ?? null,
      gradingAlgorithmVersion: results.algorithmVersion,
      gradingPolicyVersion: bundle.assessment.extensions?.gradingPolicy?.policyVersion ?? null
    },
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      scoredAt: attempt.scoredAt,
      scorePercent: Number(attempt.scorePercent),
      passed: Boolean(attempt.passed)
    },
    gradingDecision: {
      overallScorePassed: results.overallScorePassed,
      competencyMinimumsPassed: results.competencyMinimumsPassed,
      failedCompetencyMinimums: results.failedCompetencyMinimums
    },
    competencyResults,
    objectiveResults,
    remediation: attempt.passed ? null : {
      message: 'Review the weakest competency and objective areas, return to the aligned lessons and Field References, complete targeted practice, then begin a new equivalent course-final attempt when ready.',
      weakestCompetencies,
      weakestObjectives,
      answerReviewAvailable: false
    }
  };
}

export async function submitCourseAssessment({ learnerStore, subject, attemptId, now = new Date().toISOString() }) {
  const attempt = await learnerStore.getAssessmentAttempt(subject, { attemptId });
  if (!attempt) return { status: 404, body: { error: 'assessment-attempt-not-found' } };
  const assessment = loadById('assessments', attempt.assessmentId);
  if (!assessment?.extensions?.courseId) return { status: 409, body: { error: 'course-assessment-not-released' } };
  const bundle = loadPublishedCourseAssessment(assessment.extensions.courseId);
  if (bundle.error) return { status: 409, body: { error: bundle.error } };
  ensureAttemptMatchesPackage(attempt, bundle);
  if (attempt.status === 'scored') return { status: 200, body: resultView(bundle, attempt) };
  if (attempt.status !== 'started') return { status: 409, body: { error: 'assessment-attempt-not-submittable', status: attempt.status } };
  try {
    const scored = scorePersistedCourseAssessment({ assessment: bundle.assessment, attempt, itemBank: bundle.itemBank, now });
    const saved = await learnerStore.saveAssessmentScore(subject, { attempt: scored.attempt });
    return { status: 200, body: resultView(bundle, saved) };
  } catch (error) {
    if (/unanswered item/.test(error.message)) return { status: 409, body: { error: 'assessment-incomplete', detail: error.message } };
    throw error;
  }
}
