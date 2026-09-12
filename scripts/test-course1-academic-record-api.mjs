import assert from 'node:assert/strict';
import fs from 'node:fs';
import { once } from 'node:events';
import { createApiServer, courseEvidenceView } from '../apps/api/src/server.mjs';

const course = JSON.parse(fs.readFileSync('content/courses/COURSE-LH-TECH1-001.json', 'utf8'));
const assessment = JSON.parse(fs.readFileSync(`content/assessments/${course.finalAssessment}.json`, 'utf8'));
const practicalId = assessment.extensions.linkedPerformanceAssessment;

const direct = courseEvidenceView(course, assessment, {
  assessmentAttempts: [{ assessmentId: assessment.id, assessmentVersion: assessment.version, formId: 'F1', status: 'scored', startedAt: '2026-09-10T10:00:00Z', scoredAt: '2026-09-10T11:00:00Z', scorePercent: 90, passed: true }],
  performanceAssessment: {
    assessmentId: practicalId, assessmentVersion: '1.0.0', status: 'in-progress', scorePercent: null, criticalErrorCount: 0,
    history: [{ status: 'failed', scorePercent: 95, criticalErrorCount: 1, evaluatedAt: '2026-09-11T12:00:00Z', followUpStatus: 'reassessment-scheduled', reassessmentTargetDate: '2026-09-20', learnerFeedback: 'Repeat the identity-conflict escalation.', evaluatorId: 'PRIVATE-EVALUATOR', evaluatorNotes: 'PRIVATE NOTE', domainScores: [{ name: 'x', score: 1 }], evidenceOutputs: [{ reference: 'PRIVATE-REF' }] }]
  }
});
assert.equal(direct.performanceAssessment.history.length, 1);
assert.equal(direct.performanceAssessment.history[0].status, 'failed');
assert.equal(direct.performanceAssessment.history[0].learnerFeedback, 'Repeat the identity-conflict escalation.');
const directSerialized = JSON.stringify(direct.performanceAssessment.history);
for (const forbidden of ['PRIVATE-EVALUATOR', 'PRIVATE NOTE', 'PRIVATE-REF', 'domainScores', 'evidenceOutputs', 'evaluatorId', 'evaluatorNotes']) assert.equal(directSerialized.includes(forbidden), false, `safe history leaked ${forbidden}`);

let savedProgress = null;
const learnerStore = {
  async listProgress() { return []; },
  async setLessonProgress(subject, row) { savedProgress = { subject, ...row }; return { lessonId: row.lessonId, lessonVersion: row.lessonVersion, status: row.status, completedAt: '2026-09-12T13:00:00.000Z' }; },
  async listCourseEvidence() {
    return {
      learnerId: 'learner-001',
      assessmentAttempts: [{ assessmentId: assessment.id, assessmentVersion: assessment.version, formId: 'F1', status: 'scored', startedAt: '2026-09-10T10:00:00Z', scoredAt: '2026-09-10T11:00:00Z', scorePercent: 90, passed: true }],
      performanceAssessment: { assessmentId: practicalId, assessmentVersion: '1.0.0', status: 'in-progress', scorePercent: null, criticalErrorCount: 0, evaluatedAt: null, updatedAt: '2026-09-12T12:00:00Z' }
    };
  }
};
const practicalEvaluatorStore = {
  async getEvaluation() {
    return { learnerExists: true, evaluation: { evidence: {
      learnerFeedback: 'Work through equivalent reassessment.', followUpStatus: 'reassessment-scheduled', reassessmentTargetDate: '2026-09-22',
      history: [{ status: 'failed', scorePercent: 88, criticalErrorCount: 1, evaluatedAt: '2026-09-11T12:00:00Z', followUpStatus: 'remediation-assigned', reassessmentTargetDate: '', learnerFeedback: 'Review traceability escalation.', evaluatorId: 'PRIVATE-EVALUATOR', evaluatorNotes: 'PRIVATE NOTE', domainScores: [{ name: 'x', score: 1 }], evidenceOutputs: [{ reference: 'PRIVATE-REF' }] }]
    } } };
  },
  async saveEvaluation() { throw new Error('not used'); }
};
function authorize(req, scope) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/, '');
  if (token !== 'learner') return { ok: false, status: 401, error: 'authentication-required' };
  const scopes = ['learner:read', 'learner:write'];
  if (!scopes.includes(scope)) return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'learner-001', scopes };
}
const credentialStore = { kind: 'test', async ping() { return true; }, async schemaVersion() { return '3'; }, async getByVerificationId() { return null; }, async count() { return 0; } };
const server = createApiServer({ credentialStore, learnerStore, practicalEvaluatorStore, authorize, logger() {} });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

try {
  let response = await fetch(`${base}/api/v1/me/lessons/LESSON-LH-TECH1-001-01`, {
    method: 'PUT', headers: { authorization: 'Bearer learner', 'content-type': 'application/json' }, body: JSON.stringify({ lessonVersion: '1.2.0', status: 'completed' })
  });
  assert.equal(response.status, 200, 'semantic Course 1 lesson versions must be accepted by authoritative progress API');
  assert.equal(savedProgress.lessonVersion, '1.2.0');
  assert.equal(savedProgress.status, 'completed');

  response = await fetch(`${base}/api/v1/me/lessons/LESSON-LH-TECH1-001-01`, {
    method: 'PUT', headers: { authorization: 'Bearer learner', 'content-type': 'application/json' }, body: JSON.stringify({ lessonVersion: 'v1.2.0', status: 'completed' })
  });
  assert.equal(response.status, 400, 'lesson versions must remain numeric semantic versions');

  response = await fetch(`${base}/api/v1/me/courses/${course.id}/evidence`, { headers: { authorization: 'Bearer learner' } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.performanceAssessment.followUpStatus, 'reassessment-scheduled');
  assert.equal(body.performanceAssessment.reassessmentTargetDate, '2026-09-22');
  assert.equal(body.performanceAssessment.history.length, 1);
  assert.equal(body.performanceAssessment.history[0].status, 'failed');
  const serialized = JSON.stringify(body);
  for (const forbidden of ['PRIVATE-EVALUATOR', 'PRIVATE NOTE', 'PRIVATE-REF', 'domainScores', 'evidenceOutputs', 'evaluatorId', 'evaluatorNotes']) assert.equal(serialized.includes(forbidden), false, `learner evidence leaked ${forbidden}`);
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Course 1 semantic lesson-version writes and learner-safe practical history projection passed.');
