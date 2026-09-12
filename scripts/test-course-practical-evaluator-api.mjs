import assert from 'node:assert/strict';
import fs from 'node:fs';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const practical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
const evaluationRecords = new Map();
const assignments = new Map();
const knownLearners = new Set(['learner-001', 'learner-002', 'learner-003']);
const assignmentKey = (subject) => `${subject}:COURSE-LH-TECH1-001:${practical.id}:${practical.version}`;

function rowFor(subject) {
  const record = evaluationRecords.get(`${subject}:${practical.id}:${practical.version}`) ?? null;
  const assignment = assignments.get(assignmentKey(subject)) ?? null;
  return {
    learnerSubject: subject,
    enrollmentStatus: 'active',
    enrolledAt: '2026-09-10T09:00:00.000Z',
    practicalStatus: record?.status ?? 'not-recorded',
    scorePercent: record?.scorePercent ?? null,
    criticalErrorCount: record?.criticalErrorCount ?? 0,
    followUpStatus: record?.evidence?.followUpStatus ?? 'none',
    reassessmentTargetDate: record?.evidence?.reassessmentTargetDate ?? '',
    assignedEvaluatorId: assignment?.evaluatorId ?? null,
    assignedBy: assignment?.assignedBy ?? null,
    assignedAt: assignment?.assignedAt ?? null,
    evaluatedAt: record?.evaluatedAt ?? null,
    updatedAt: record?.updatedAt ?? null
  };
}

const practicalEvaluatorStore = {
  kind: 'test-practical-evaluator',
  async listCourseLearners({ search = '', practicalStatus = '', assignmentFilter = '', evaluatorId = '', page = 1, pageSize = 25 } = {}) {
    let rows = [...knownLearners].map(rowFor);
    if (search) rows = rows.filter((row) => row.learnerSubject.includes(search));
    if (practicalStatus) rows = rows.filter((row) => row.practicalStatus === practicalStatus);
    if (assignmentFilter === 'mine') rows = rows.filter((row) => row.assignedEvaluatorId === evaluatorId);
    if (assignmentFilter === 'assigned') rows = rows.filter((row) => row.assignedEvaluatorId);
    if (assignmentFilter === 'unassigned') rows = rows.filter((row) => !row.assignedEvaluatorId);
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { items: rows.slice(start, start + pageSize), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },
  async listCourseReportRows() { return [...knownLearners].map(rowFor); },
  async getEvaluation(subject) {
    if (!knownLearners.has(subject)) return { learnerExists: false, evaluation: null, assignment: null };
    return { learnerExists: true, evaluation: structuredClone(evaluationRecords.get(`${subject}:${practical.id}:${practical.version}`) ?? null), assignment: structuredClone(assignments.get(assignmentKey(subject)) ?? null) };
  },
  async claimEvaluator(subject, { evaluatorId, assignedBy = evaluatorId } = {}) {
    if (!knownLearners.has(subject)) return { learnerExists: false, assignment: null };
    const key = assignmentKey(subject);
    const current = assignments.get(key);
    if (current && current.evaluatorId !== evaluatorId) return { learnerExists: true, conflict: true, assignment: null };
    const stored = { evaluatorId, assignedBy, assignedAt: '2026-09-12T12:10:00.000Z', updatedAt: '2026-09-12T12:10:00.000Z' };
    assignments.set(key, stored);
    return { learnerExists: true, conflict: false, assignment: structuredClone(stored) };
  },
  async releaseEvaluator(subject, { evaluatorId } = {}) {
    const key = assignmentKey(subject); const current = assignments.get(key);
    if (!knownLearners.has(subject)) return { learnerExists: false, released: false };
    if (!current || current.evaluatorId !== evaluatorId) return { learnerExists: true, released: false };
    assignments.delete(key); return { learnerExists: true, released: true };
  },
  async setEvaluatorAssignment(subject, { evaluatorId, assignedBy } = {}) {
    if (!knownLearners.has(subject)) return { learnerExists: false, assignment: null };
    const key = assignmentKey(subject);
    if (!evaluatorId) { assignments.delete(key); return { learnerExists: true, assignment: null }; }
    const stored = { evaluatorId, assignedBy, assignedAt: '2026-09-12T12:11:00.000Z', updatedAt: '2026-09-12T12:11:00.000Z' };
    assignments.set(key, stored); return { learnerExists: true, assignment: structuredClone(stored) };
  },
  async saveEvaluation(subject, record) {
    if (!knownLearners.has(subject)) return { learnerExists: false, evaluation: null };
    const stored = structuredClone({ ...record, updatedAt: '2026-09-12T12:30:00.000Z' });
    evaluationRecords.set(`${subject}:${record.assessmentId}:${record.assessmentVersion}`, stored);
    return { learnerExists: true, evaluation: structuredClone(stored) };
  }
};

const learnerStore = {
  async listCourseEvidence(subject, { performanceAssessmentId }) {
    const practicalRow = evaluationRecords.get(`${subject}:${performanceAssessmentId}:${practical.version}`) ?? null;
    return { learnerId: subject, assessmentAttempts: [], performanceAssessment: practicalRow ? {
      assessmentId: practicalRow.assessmentId, assessmentVersion: practicalRow.assessmentVersion, status: practicalRow.status,
      scorePercent: practicalRow.scorePercent, criticalErrorCount: practicalRow.criticalErrorCount, evaluatedAt: practicalRow.evaluatedAt, updatedAt: practicalRow.updatedAt
    } : null };
  }
};

function authorize(req, requiredScope) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/, '');
  const grants = {
    learner: { subject: 'learner-001', scopes: ['learner:read', 'learner:write'] },
    evaluator: { subject: 'assessor-authoritative-001', scopes: ['evaluator:read', 'evaluator:write'] },
    evaluatorTwo: { subject: 'assessor-002', scopes: ['evaluator:read', 'evaluator:write'] },
    evaluatorRead: { subject: 'assessor-readonly-001', scopes: ['evaluator:read'] },
    admin: { subject: 'admin-001', scopes: ['admin:read', 'admin:write'] }
  };
  const grant = grants[token];
  if (!grant) return { ok: false, status: 401, error: 'authentication-required' };
  if (requiredScope && !grant.scopes.includes(requiredScope)) return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: grant.subject, scopes: grant.scopes };
}

const credentialStore = { kind: 'test', async ping() { return true; }, async schemaVersion() { return '3'; }, async getByVerificationId() { return null; }, async count() { return 0; } };
const server = createApiServer({ credentialStore, learnerStore, practicalEvaluatorStore, authorize, logger() {} });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

async function request(path, { method = 'GET', token = null, body = null, text = false } = {}) {
  const headers = { accept: text ? 'text/csv' : 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== null) headers['content-type'] = 'application/json';
  const response = await fetch(`${base}${path}`, { method, headers, ...(body !== null ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, headers: response.headers, body: text ? await response.text() : await response.json() };
}

try {
  assert.equal((await request('/api/v1/evaluator/capabilities')).status, 401);
  assert.equal((await request('/api/v1/evaluator/capabilities', { token: 'learner' })).status, 403);
  const capability = await request('/api/v1/evaluator/capabilities', { token: 'evaluatorRead' });
  assert.equal(capability.status, 200); assert.equal(capability.body.coursePracticalEvaluation, true);

  const queue = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation?page=1&pageSize=10', { token: 'evaluatorRead' });
  assert.equal(queue.status, 200); assert.equal(queue.body.queue.total, 3); assert.equal(queue.body.queue.items.length, 3);
  assert.equal(queue.body.queue.items.every((row) => row.practicalStatus === 'not-recorded'), true);
  assert.equal((await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { token: 'learner' })).status, 403);

  const claim = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-assignment', { method: 'PUT', token: 'evaluator', body: { learnerSubject: 'learner-001', action: 'claim' } });
  assert.equal(claim.status, 200); assert.equal(claim.body.assignment.evaluatorId, 'assessor-authoritative-001');
  const conflictingClaim = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-assignment', { method: 'PUT', token: 'evaluatorTwo', body: { learnerSubject: 'learner-001', action: 'claim' } });
  assert.equal(conflictingClaim.status, 409);
  const mine = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation?assignment=mine&pageSize=10', { token: 'evaluator' });
  assert.deepEqual(mine.body.queue.items.map((row) => row.learnerSubject), ['learner-001']);

  const adminReassign = await request('/api/v1/admin/courses/COURSE-LH-TECH1-001/practical-assignment', { method: 'PUT', token: 'admin', body: { learnerSubject: 'learner-001', evaluatorId: 'assessor-002' } });
  assert.equal(adminReassign.status, 200); assert.equal(adminReassign.body.assignment.evaluatorId, 'assessor-002');
  const blockedWrite = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { method: 'PUT', token: 'evaluator', body: { learnerSubject: 'learner-001', mode: 'save', domainScores: [] } });
  assert.equal(blockedWrite.status, 409); assert.equal(blockedWrite.body.error, 'practical-evaluation-assigned-to-other-evaluator');
  await request('/api/v1/admin/courses/COURSE-LH-TECH1-001/practical-assignment', { method: 'PUT', token: 'admin', body: { learnerSubject: 'learner-001', evaluatorId: 'assessor-authoritative-001' } });

  const initial = await request(`/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation?learnerSubject=learner-001`, { token: 'evaluator' });
  assert.equal(initial.status, 200); assert.equal(initial.body.assignment.evaluatorId, 'assessor-authoritative-001');
  assert.deepEqual(initial.body.practical.evidenceOutputs, practical.evidenceOutputs);

  const partialEvidence = practical.evidenceOutputs.slice(0, 2).map((name, index) => ({ name, status: index === 0 ? 'verified' : 'received', reference: `packet-${index + 1}`, note: 'Observed during simulation.' }));
  const partial = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { method: 'PUT', token: 'evaluator', body: {
    learnerSubject: 'learner-001', mode: 'save', domainScores: practical.scoring.domains.slice(0, 2).map((domain) => ({ name: domain.name, score: domain.points })), evidenceOutputs: partialEvidence,
    followUpStatus: 'remediation-in-progress', evaluatorNotes: 'PRIVATE-EVALUATOR-NOTE', learnerFeedback: 'Review the traceability event chain.', evaluatorId: 'forged', status: 'passed', scorePercent: 100
  } });
  assert.equal(partial.status, 200); assert.equal(partial.body.evaluation.evaluatorId, 'assessor-authoritative-001');

  const fullScores = practical.scoring.domains.map((domain) => ({ name: domain.name, score: domain.points }));
  const allEvidence = practical.evidenceOutputs.map((name, index) => ({ name, status: 'verified', reference: `artifact-${index + 1}`, note: 'Verified.' }));
  const failed = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { method: 'PUT', token: 'evaluator', body: {
    learnerSubject: 'learner-001', mode: 'finalize', domainScores: fullScores, evidenceOutputs: allEvidence, criticalErrorIndexes: [0],
    followUpStatus: 'reassessment-scheduled', reassessmentTargetDate: '2026-09-20', evaluatorNotes: 'PRIVATE-FINAL-NOTE', learnerFeedback: 'Equivalent reassessment required.'
  } });
  assert.equal(failed.status, 200); assert.equal(failed.body.evaluation.status, 'failed');

  const learnerEvidence = await request('/api/v1/me/courses/COURSE-LH-TECH1-001/evidence', { token: 'learner' });
  assert.equal(learnerEvidence.status, 200);
  assert.equal(learnerEvidence.body.performanceAssessment.followUpStatus, 'reassessment-scheduled');
  assert.equal(learnerEvidence.body.performanceAssessment.reassessmentTargetDate, '2026-09-20');
  assert.match(learnerEvidence.body.performanceAssessment.remediationSummary, /Equivalent reassessment/);
  const serialized = JSON.stringify(learnerEvidence.body);
  for (const forbidden of ['PRIVATE-FINAL-NOTE', 'evaluatorId', 'domainScores', 'evidenceOutputs', 'artifact-1']) assert.equal(serialized.includes(forbidden), false, `learner projection leaked ${forbidden}`);

  const report = await request('/api/v1/admin/courses/COURSE-LH-TECH1-001/practical-report', { token: 'admin' });
  assert.equal(report.status, 200); assert.equal(report.body.summary.total, 3); assert.equal(report.body.summary.failed, 1);
  assert.equal(report.body.rows.find((row) => row.learnerSubject === 'learner-001').assignedEvaluatorId, 'assessor-authoritative-001');
  assert.equal(JSON.stringify(report.body).includes('PRIVATE-FINAL-NOTE'), false);
  const csv = await request('/api/v1/admin/courses/COURSE-LH-TECH1-001/practical-report?format=csv', { token: 'admin', text: true });
  assert.equal(csv.status, 200); assert.match(csv.headers.get('content-type'), /text\/csv/); assert.match(csv.body, /learnerSubject,enrollmentStatus,practicalStatus/); assert.match(csv.body, /learner-001/); assert.equal(csv.body.includes('PRIVATE-FINAL-NOTE'), false);
} finally {
  server.close(); await once(server, 'close');
}

console.log('Course 1 practical queue pagination, evaluator ownership, admin reassignment/reporting, learner follow-up, trusted scoring, and privacy contracts passed.');
