import fs from 'node:fs';
import path from 'node:path';
import { buildPracticalEvaluation, practicalEvaluatorView } from '../../../packages/domain/course-practical-evaluation.mjs';

const root = process.cwd();
const COURSE_ID = 'COURSE-LH-TECH1-001';
const PRACTICAL_ID = 'PRACTICAL-LH-TECH1-001-WORKFLOW';
const PRACTICAL_QUEUE_STATUSES = new Set(['', 'not-recorded', 'in-progress', 'passed', 'failed', 'voided']);
const ASSIGNMENT_FILTERS = new Set(['', 'mine', 'assigned', 'unassigned']);

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
function assignmentFilter(value) {
  const filter = String(value ?? '').trim();
  if (!ASSIGNMENT_FILTERS.has(filter)) throw new Error('invalid-assignment-filter');
  return filter;
}
function positiveInt(value, fallback) {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function cleanEvaluatorId(value) {
  const id = String(value ?? '').trim();
  if (!id || id.length > 256 || /[\u0000-\u001f]/.test(id)) throw new Error('invalid-evaluator-id');
  return id;
}

export async function listCoursePracticalQueue({ store, courseId, evaluatorId = '', search = '', practicalStatus = '', assignment = '', page = 1, pageSize = 25 } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.listCourseLearners !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let normalizedSearch;
  let normalizedStatus;
  let normalizedAssignment;
  try {
    normalizedSearch = queueSearch(search);
    normalizedStatus = queueStatus(practicalStatus);
    normalizedAssignment = assignmentFilter(assignment);
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }
  const normalizedPage = positiveInt(page, 1);
  const normalizedPageSize = Math.min(100, Math.max(10, positiveInt(pageSize, 25)));
  const learners = await store.listCourseLearners({
    courseId,
    assessmentId: practical.id,
    assessmentVersion: practical.version,
    search: normalizedSearch,
    practicalStatus: normalizedStatus,
    assignmentFilter: normalizedAssignment,
    evaluatorId,
    page: normalizedPage,
    pageSize: normalizedPageSize
  });
  return {
    status: 200,
    body: {
      course: { id: COURSE_ID },
      practical: { id: practical.id, title: practical.title, version: practical.version },
      filters: { search: normalizedSearch, practicalStatus: normalizedStatus, assignment: normalizedAssignment },
      queue: learners
    }
  };
}

export async function getCoursePracticalEvaluation({ store, courseId, externalSubject, evaluatorId = '', queue = {} } = {}) {
  if (externalSubject == null || String(externalSubject).trim() === '') {
    return listCoursePracticalQueue({ store, courseId, evaluatorId, ...queue });
  }
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.getEvaluation !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let subject;
  try { subject = learnerSubject(externalSubject); }
  catch (error) { return { status: 400, body: { error: error.message } }; }
  const current = await store.getEvaluation(subject, { courseId, assessmentId: practical.id, assessmentVersion: practical.version });
  if (!current?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };
  return { status: 200, body: { learner: { subject }, assignment: current.assignment ?? null, ...practicalEvaluatorView(practical, current.evaluation) } };
}

export async function claimCoursePracticalEvaluation({ store, courseId, externalSubject, evaluatorId, action = 'claim' } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.claimEvaluator !== 'function' || typeof store.releaseEvaluator !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let subject;
  try { subject = learnerSubject(externalSubject); }
  catch (error) { return { status: 400, body: { error: error.message } }; }
  if (action === 'release') {
    const released = await store.releaseEvaluator(subject, { courseId, assessmentId: practical.id, assessmentVersion: practical.version, evaluatorId });
    if (!released?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };
    if (!released.released) return { status: 409, body: { error: 'practical-assignment-not-owned' } };
    return { status: 200, body: { learner: { subject }, assignment: null } };
  }
  if (action !== 'claim') return { status: 400, body: { error: 'invalid-assignment-action' } };
  const claimed = await store.claimEvaluator(subject, { courseId, assessmentId: practical.id, assessmentVersion: practical.version, evaluatorId });
  if (!claimed?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };
  if (claimed.conflict) return { status: 409, body: { error: 'practical-assignment-owned-by-another-evaluator' } };
  return { status: 200, body: { learner: { subject }, assignment: claimed.assignment } };
}

export async function setCoursePracticalAssignment({ store, courseId, externalSubject, evaluatorId, adminId } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.setEvaluatorAssignment !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let subject;
  let normalizedEvaluator = null;
  try {
    subject = learnerSubject(externalSubject);
    if (evaluatorId != null && String(evaluatorId).trim() !== '') normalizedEvaluator = cleanEvaluatorId(evaluatorId);
  } catch (error) { return { status: 400, body: { error: error.message } }; }
  const saved = await store.setEvaluatorAssignment(subject, {
    courseId,
    assessmentId: practical.id,
    assessmentVersion: practical.version,
    evaluatorId: normalizedEvaluator,
    assignedBy: adminId
  });
  if (!saved?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };
  return { status: 200, body: { learner: { subject }, assignment: saved.assignment ?? null } };
}

export async function saveCoursePracticalEvaluation({ store, courseId, externalSubject, evaluatorId, input } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.getEvaluation !== 'function' || typeof store.saveEvaluation !== 'function') return { status: 503, body: { error: 'practical-evaluator-persistence-unavailable' } };
  let subject;
  try { subject = learnerSubject(externalSubject); }
  catch (error) { return { status: 400, body: { error: error.message } }; }

  let current = await store.getEvaluation(subject, { courseId, assessmentId: practical.id, assessmentVersion: practical.version });
  if (!current?.learnerExists) return { status: 404, body: { error: 'learner-not-found' } };
  if (current.assignment?.evaluatorId && current.assignment.evaluatorId !== evaluatorId) {
    return { status: 409, body: { error: 'practical-evaluation-assigned-to-other-evaluator' } };
  }
  if (!current.assignment && typeof store.claimEvaluator === 'function') {
    const claimed = await store.claimEvaluator(subject, { courseId, assessmentId: practical.id, assessmentVersion: practical.version, evaluatorId });
    if (claimed?.conflict) return { status: 409, body: { error: 'practical-assignment-owned-by-another-evaluator' } };
    current = { ...current, assignment: claimed?.assignment ?? null };
  }

  let record;
  try { record = buildPracticalEvaluation({ practical, existing: current.evaluation, input, evaluatorId }); }
  catch (error) { return { status: 400, body: { error: error.message } }; }

  const saved = await store.saveEvaluation(subject, record);
  if (!saved?.learnerExists || !saved.evaluation) return { status: 409, body: { error: 'practical-evaluation-write-conflict' } };
  return { status: 200, body: { learner: { subject }, assignment: current.assignment ?? null, ...practicalEvaluatorView(practical, saved.evaluation) } };
}

export async function buildCoursePracticalReport({ store, courseId } = {}) {
  const practical = loadCourse1PracticalForEvaluation(courseId);
  if (!practical) return { status: 404, body: { error: 'course-practical-not-found' } };
  if (!store || typeof store.listCourseReportRows !== 'function') return { status: 503, body: { error: 'practical-report-persistence-unavailable' } };
  const rows = await store.listCourseReportRows({ courseId, assessmentId: practical.id, assessmentVersion: practical.version });
  const summary = { total: rows.length, notRecorded: 0, inProgress: 0, passed: 0, failed: 0, voided: 0, unassigned: 0, followUpOpen: 0 };
  for (const row of rows) {
    const key = row.practicalStatus === 'not-recorded' ? 'notRecorded' : row.practicalStatus === 'in-progress' ? 'inProgress' : row.practicalStatus;
    if (Object.hasOwn(summary, key)) summary[key] += 1;
    if (!row.assignedEvaluatorId) summary.unassigned += 1;
    if (!['none', 'closed'].includes(row.followUpStatus ?? 'none')) summary.followUpOpen += 1;
  }
  return { status: 200, body: { course: { id: COURSE_ID }, practical: { id: practical.id, version: practical.version, title: practical.title }, generatedAt: new Date().toISOString(), summary, rows } };
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function coursePracticalReportCsv(report) {
  const headers = ['learnerSubject','enrollmentStatus','practicalStatus','scorePercent','criticalErrorCount','followUpStatus','reassessmentTargetDate','assignedEvaluatorId','assignedAt','evaluatedAt','updatedAt'];
  const lines = [headers.join(',')];
  for (const row of report.rows ?? []) lines.push(headers.map((key) => csvCell(row[key])).join(','));
  return `${lines.join('\n')}\n`;
}
