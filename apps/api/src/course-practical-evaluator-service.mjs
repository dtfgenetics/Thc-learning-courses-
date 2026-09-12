import fs from 'node:fs';
import path from 'node:path';
import { buildPracticalEvaluation, practicalEvaluatorView } from '../../../packages/domain/course-practical-evaluation.mjs';

const root = process.cwd();
const COURSE_ID = 'COURSE-LH-TECH1-001';
const PRACTICAL_ID = 'PRACTICAL-LH-TECH1-001-WORKFLOW';
const PRACTICAL_QUEUE_STATUSES = new Set(['', 'not-recorded', 'in-progress', 'passed', 'failed', 'voided']);

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }

export function loadCourse1PracticalForEvaluation(courseId) {
  if (courseId !== COURSE_ID) return null;
  const practical = readJson(`content/performance-assessments/${PRACTICAL_ID}.json`);
  if (practical.id !== PRACTICAL_ID || practical.status !== 'published') return null;
  return practical;
}

function learnerSubject(value) {
  const subject = String(value ?? '').trim();
  if (!subject || subject.length > 256 || /[\u0000-\u001f]/.test(subject)) throw new Error('invalid-learner-subject');
  return subject;
}

function queueSearch(value) {
  const query = String(value ?? '').trim();
  if (query.length > 100 || /[\u0000-\u001f]/.test(query)) throw new Error('invalid-queue-search');
  return query;
}

function queueStatus(value) {
  const status = String(value ?? '').trim();
  if (!PRACTICAL_QUEUE_STATUSES.has(status)) throw new Error('invalid-practical-status-filter');
  return status;
}

export async function listCoursePracticalQueue({ store, courseId, search = '', practicalStatus = '', limit = 100 } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.listCourseLearners !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let normalizedSearch;
  let normalizedStatus;
  try {
    normalizedSearch = queueSearch(search);
    normalizedStatus = queueStatus(practicalStatus);
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }
  const normalizedLimit = Math.min(200, Math.max(1, Number.isFinite(Number(limit)) ? Math.trunc(Number(limit)) : 100));
  const learners = await store.listCourseLearners({
    courseId,
    assessmentId: practical.id,
    assessmentVersion: practical.version,
    search: normalizedSearch,
    practicalStatus: normalizedStatus,
    limit: normalizedLimit
  });
  return {
    status: 200,
    body: {
      course: { id: COURSE_ID },
      practical: { id: practical.id, title: practical.title, version: practical.version },
      filters: { search: normalizedSearch, practicalStatus: normalizedStatus },
      learners
    }
  };
}

export async function getCoursePracticalEvaluation({ store, courseId, externalSubject } = {}) {
  if (externalSubject == null || String(externalSubject).trim() === '') {
    return listCoursePracticalQueue({ store, courseId });
  }
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.getEvaluation !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let subject;
  try { subject = learnerSubject(externalSubject); }
  catch (error) { return { status: 400, body: { error: error.message } }; }
  const current = await store.getEvaluation(subject, { assessmentId: practical.id, assessmentVersion: practical.version });
  if (!current?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };
  return { status: 200, body: { learner: { subject }, ...practicalEvaluatorView(practical, current.evaluation) } };
}

export async function saveCoursePracticalEvaluation({ store, courseId, externalSubject, evaluatorId, input } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.getEvaluation !== 'function' || typeof store.saveEvaluation !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let subject;
  try { subject = learnerSubject(externalSubject); }
  catch (error) { return { status: 400, body: { error: error.message } }; }

  const current = await store.getEvaluation(subject, { assessmentId: practical.id, assessmentVersion: practical.version });
  if (!current?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };

  let record;
  try {
    record = buildPracticalEvaluation({ practical, existing: current.evaluation, input, evaluatorId });
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }

  const saved = await store.saveEvaluation(subject, record);
  if (!saved?.learnerExists || !saved.evaluation) return { status: 409, body: { error: 'practical-evaluation-write-conflict' } };
  return { status: 200, body: { learner: { subject }, ...practicalEvaluatorView(practical, saved.evaluation) } };
}
