import assert from 'node:assert/strict';
import fs from 'node:fs';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const practical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
const evaluationRecords = new Map();
const knownLearners = new Set(['learner-001', 'learner-002']);

const practicalEvaluatorStore = {
  kind: 'test-practical-evaluator',
  async listCourseLearners({ assessmentId, assessmentVersion } = {}) {
    return [...knownLearners].map((subject) => {
      const record = evaluationRecords.get(`${subject}:${assessmentId}:${assessmentVersion}`) ?? null;
      return {
        learnerSubject: subject,
        enrollmentStatus: 'active',
        enrolledAt: '2026-09-10T09:00:00.000Z',
        practicalStatus: record?.status ?? 'not-recorded',
        scorePercent: record?.scorePercent ?? null,
        criticalErrorCount: record?.criticalErrorCount ?? 0,
        followUpStatus: record?.evidence?.followUpStatus ?? 'none',
        reassessmentTargetDate: record?.evidence?.reassessmentTargetDate ?? '',
        evaluatedAt: record?.evaluatedAt ?? null,
        updatedAt: record?.updatedAt ?? null
      };
    });
  },
  async getEvaluation(subject, { assessmentId, assessmentVersion }) {
    if (!knownLearners.has(subject)) return { learnerExists: false, evaluation: null };
    return { learnerExists: true, evaluation: structuredClone(evaluationRecords.get(`${subject}:${assessmentId}:${assessmentVersion}`) ?? null) };
  },
  async saveEvaluation(subject, record) {
    if (!knownLearners.has(subject)) return { learnerExists: false, evaluation: null };
    const stored = structuredClone({ ...record, updatedAt: '2026-09-12T12:30:00.000Z' });
    evaluationRecords.set(`${subject}:${record.assessmentId}:${record.assessmentVersion}`, stored);
    return { learnerExists: true, evaluation: structuredClone(stored) };
  }
};

const learnerStore = {
  async listCourseEvidence(subject, { assessmentId, performanceAssessmentId }) {
    const practicalRow = evaluationRecords.get(`${subject}:${performanceAssessmentId}:${practical.version}`) ?? null;
    return {
      learnerId: subject,
      assessmentAttempts: [],
      performanceAssessment: practicalRow ? {
        assessmentId: practicalRow.assessmentId,
        assessmentVersion: practicalRow.assessmentVersion,
        status: practicalRow.status,
        scorePercent: practicalRow.scorePercent,
        criticalErrorCount: practicalRow.criticalErrorCount,
        evaluatedAt: practicalRow.evaluatedAt,
        updatedAt: practicalRow.updatedAt
      } : null
    };
  }
};

function authorize(req, requiredScope) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/, '');
  const grants = {
    learner: { subject: 'learner-001', scopes: ['learner:read', 'learner:write'] },
    evaluator: { subject: 'assessor-authoritative-001', scopes: ['evaluator:read', 'evaluator:write'] },
    evaluatorRead: { subject: 'assessor-readonly-001', scopes: ['evaluator:read'] }
  };
  const grant = grants[token];
  if (!grant) return { ok: false, status: 401, error: 'authentication-required' };
  if (requiredScope && !grant.scopes.includes(requiredScope)) return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: grant.subject, scopes: grant.scopes };
}

const credentialStore = {
  kind: 'test', async ping() { return true; }, async schemaVersion() { return '2'; }, async getByVerificationId() { return null; }, async count() { return 0; }
};
const server = createApiServer({ credentialStore, learnerStore, practicalEvaluatorStore, authorize, logger() {} });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

async function request(path, { method = 'GET', token = null, body = null } = {}) {
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== null) headers['content-type'] = 'application/json';
  const response = await fetch(`${base}${path}`, { method, headers, ...(body !== null ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}

try {
  const unauth = await request('/api/v1/evaluator/capabilities');
  assert.equal(unauth.status, 401);
  const learnerDenied = await request('/api/v1/evaluator/capabilities', { token: 'learner' });
  assert.equal(learnerDenied.status, 403);
  const capability = await request('/api/v1/evaluator/capabilities', { token: 'evaluatorRead' });
  assert.equal(capability.status, 200);
  assert.equal(capability.body.coursePracticalEvaluation, true);

  const queue = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { token: 'evaluatorRead' });
  assert.equal(queue.status, 200);
  assert.equal(queue.body.learners.length, 2);
  assert.equal(queue.body.learners.every((row) => row.practicalStatus === 'not-recorded'), true);
  assert.equal(queue.body.practical.id, practical.id);
  const learnerQueueDenied = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { token: 'learner' });
  assert.equal(learnerQueueDenied.status, 403, 'learner role must not read evaluator roster');

  const missing = await request(`/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation?learnerSubject=${encodeURIComponent('missing')}`, { token: 'evaluatorRead' });
  assert.equal(missing.status, 404);

  const initial = await request(`/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation?learnerSubject=${encodeURIComponent('learner-001')}`, { token: 'evaluatorRead' });
  assert.equal(initial.status, 200);
  assert.equal(initial.body.evaluation, null);
  assert.equal(initial.body.practical.scoring.domains.length, 8);
  assert.deepEqual(initial.body.practical.evidenceOutputs, practical.evidenceOutputs);
  assert.ok(initial.body.practical.followUpStatuses.includes('ready-for-reassessment'));

  const partialEvidence = practical.evidenceOutputs.slice(0, 2).map((name, index) => ({ name, status: index === 0 ? 'verified' : 'received', reference: `packet-${index + 1}`, note: 'Observed during simulation.' }));
  const partial = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', {
    method: 'PUT', token: 'evaluator', body: {
      learnerSubject: 'learner-001', mode: 'save',
      domainScores: practical.scoring.domains.slice(0, 2).map((domain) => ({ name: domain.name, score: domain.points })),
      evidenceOutputs: partialEvidence,
      followUpStatus: 'remediation-in-progress',
      evaluatorNotes: 'PRIVATE-EVALUATOR-NOTE', learnerFeedback: 'Review the traceability event chain.',
      evaluatorId: 'forged-client-evaluator', status: 'passed', scorePercent: 100
    }
  });
  assert.equal(partial.status, 200);
  assert.equal(partial.body.evaluation.status, 'in-progress');
  assert.equal(partial.body.evaluation.scorePercent, null);
  assert.equal(partial.body.evaluation.evaluatorId, 'assessor-authoritative-001', 'evaluator identity must come from authentication, not client input');
  assert.equal(partial.body.evaluation.evidenceOutputs.length, practical.evidenceOutputs.length);
  assert.equal(partial.body.evaluation.followUpStatus, 'remediation-in-progress');

  const readOnlyWrite = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', {
    method: 'PUT', token: 'evaluatorRead', body: { learnerSubject: 'learner-001', mode: 'save', domainScores: [] }
  });
  assert.equal(readOnlyWrite.status, 403);

  const fullScores = practical.scoring.domains.map((domain) => ({ name: domain.name, score: domain.points }));
  const allEvidence = practical.evidenceOutputs.map((name, index) => ({ name, status: 'verified', reference: `artifact-${index + 1}`, note: 'Verified against evaluated practical evidence.' }));
  const criticalFail = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', {
    method: 'PUT', token: 'evaluator', body: {
      learnerSubject: 'learner-001', mode: 'finalize', domainScores: fullScores, evidenceOutputs: allEvidence,
      criticalErrorIndexes: [0], followUpStatus: 'reassessment-scheduled', reassessmentTargetDate: '2026-09-20',
      evaluatorNotes: 'PRIVATE-FINAL-NOTE', learnerFeedback: 'Equivalent reassessment: preserve record history and stop at the identity conflict.'
    }
  });
  assert.equal(criticalFail.status, 200);
  assert.equal(criticalFail.body.evaluation.scorePercent, 100);
  assert.equal(criticalFail.body.evaluation.status, 'failed');
  assert.equal(criticalFail.body.evaluation.criticalErrorCount, 1);
  assert.equal(criticalFail.body.evaluation.followUpStatus, 'reassessment-scheduled');
  assert.equal(criticalFail.body.evaluation.reassessmentTargetDate, '2026-09-20');

  const queueAfter = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', { token: 'evaluatorRead' });
  const queuedLearner = queueAfter.body.learners.find((row) => row.learnerSubject === 'learner-001');
  assert.equal(queuedLearner.practicalStatus, 'failed');
  assert.equal(queuedLearner.followUpStatus, 'reassessment-scheduled');

  const incomplete = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', {
    method: 'PUT', token: 'evaluator', body: {
      learnerSubject: 'learner-001', mode: 'finalize', domainScores: fullScores.slice(0, 7), criticalErrorIndexes: []
    }
  });
  assert.equal(incomplete.status, 400);
  assert.match(incomplete.body.error, /all practical scoring domains are required/);

  const reassessmentDraft = await request('/api/v1/evaluator/courses/COURSE-LH-TECH1-001/practical-evaluation', {
    method: 'PUT', token: 'evaluator', body: {
      learnerSubject: 'learner-001', mode: 'save', startReassessment: true,
      domainScores: [{ name: practical.scoring.domains[0].name, score: practical.scoring.domains[0].points }],
      evidenceOutputs: practical.evidenceOutputs.map((name) => ({ name, status: 'not-reviewed', reference: '', note: '' })),
      followUpStatus: 'remediation-in-progress', learnerFeedback: 'Reassessment evidence collection started.'
    }
  });
  assert.equal(reassessmentDraft.status, 200);
  assert.equal(reassessmentDraft.body.evaluation.status, 'in-progress');
  assert.equal(reassessmentDraft.body.evaluation.historyCount, 1);

  const learnerEvidence = await request('/api/v1/me/courses/COURSE-LH-TECH1-001/evidence', { token: 'learner' });
  assert.equal(learnerEvidence.status, 200);
  assert.equal(learnerEvidence.body.performanceAssessment.status, 'in-progress');
  assert.match(learnerEvidence.body.performanceAssessment.remediationSummary, /Reassessment evidence collection/);
  const serialized = JSON.stringify(learnerEvidence.body);
  assert.equal(serialized.includes('PRIVATE-FINAL-NOTE'), false, 'private evaluator notes must not appear in learner evidence');
  assert.equal(serialized.includes('evaluatorId'), false, 'evaluator identity must not appear in learner evidence');
  assert.equal(serialized.includes('domainScores'), false, 'full evaluator evidence must not appear in learner evidence');
  assert.equal(serialized.includes('evidenceOutputs'), false, 'evaluator evidence references must not appear in learner evidence');
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 1 evaluator roster, evidence tracking, reassessment, trusted scoring, authorization, anti-forgery, and learner privacy contracts passed.');
