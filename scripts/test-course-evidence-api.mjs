import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer, courseEvidenceView } from '../apps/api/src/server.mjs';

const credentialStore = {
  kind: 'test-persistent',
  async ping() { return true; },
  async schemaVersion() { return '2'; },
  async getByVerificationId() { return null; }
};

const finalAssessment = {
  id: 'ASSESS-LH-TECH1-001-FINAL',
  title: 'Safety, Responsible Practice & Cultivation Workflows — Course Assessment',
  passingScorePercent: 80,
  extensions: {
    linkedPerformanceAssessment: 'PRACTICAL-LH-TECH1-001-WORKFLOW',
    completionModel: 'Course-level evidence combines the knowledge assessment with the linked performance practical.'
  }
};
const course = { id: 'COURSE-LH-TECH1-001', title: 'Safety, Responsible Practice & Cultivation Workflows', version: '1.0.0' };

const empty = courseEvidenceView(course, finalAssessment, { assessmentAttempts: [], performanceAssessment: null });
assert.equal(empty.writtenAssessment.outcome, 'not-attempted');
assert.equal(empty.writtenAssessment.recordStatus, 'not-recorded');
assert.equal(empty.writtenAssessment.attemptCount, 0);
assert.equal(empty.performanceAssessment.status, 'not-recorded');
assert.equal(Object.prototype.hasOwnProperty.call(empty, 'complete'), false);
assert.equal(Object.prototype.hasOwnProperty.call(empty, 'eligible'), false);

const active = courseEvidenceView(course, finalAssessment, {
  assessmentAttempts: [
    { assessmentId: finalAssessment.id, status: 'submitted', formId: 'FORM-B', startedAt: '2026-09-10T13:00:00.000Z', passed: null, scorePercent: null },
    { assessmentId: finalAssessment.id, status: 'scored', formId: 'FORM-A', startedAt: '2026-09-09T13:00:00.000Z', scoredAt: '2026-09-09T14:00:00.000Z', passed: false, scorePercent: 74 }
  ],
  performanceAssessment: { assessmentId: 'PRACTICAL-LH-TECH1-001-WORKFLOW', status: 'in-progress', scorePercent: null, criticalErrorCount: 0 }
});
assert.equal(active.writtenAssessment.outcome, 'in-progress', 'a newer active attempt must be shown as in progress even when an earlier scored attempt was not passed');
assert.equal(active.writtenAssessment.recordStatus, 'submitted');
assert.equal(active.writtenAssessment.bestScorePercent, 74);
assert.equal(active.performanceAssessment.status, 'in-progress');

const failed = courseEvidenceView(course, finalAssessment, {
  assessmentAttempts: [
    { assessmentId: finalAssessment.id, status: 'scored', formId: 'FORM-A', startedAt: '2026-09-09T13:00:00.000Z', scoredAt: '2026-09-09T14:00:00.000Z', passed: false, scorePercent: 74 }
  ],
  performanceAssessment: { assessmentId: 'PRACTICAL-LH-TECH1-001-WORKFLOW', status: 'failed', scorePercent: 76, criticalErrorCount: 1 }
});
assert.equal(failed.writtenAssessment.outcome, 'not-passed');
assert.equal(failed.performanceAssessment.status, 'failed');
assert.equal(failed.performanceAssessment.criticalErrorCount, 1);

const passed = courseEvidenceView(course, finalAssessment, {
  assessmentAttempts: [
    { assessmentId: finalAssessment.id, status: 'scored', formId: 'FORM-B', startedAt: '2026-09-10T13:00:00.000Z', scoredAt: '2026-09-10T14:00:00.000Z', passed: true, scorePercent: 86 },
    { assessmentId: finalAssessment.id, status: 'scored', formId: 'FORM-A', startedAt: '2026-09-09T13:00:00.000Z', scoredAt: '2026-09-09T14:00:00.000Z', passed: false, scorePercent: 74 }
  ],
  performanceAssessment: { assessmentId: 'PRACTICAL-LH-TECH1-001-WORKFLOW', status: 'passed', scorePercent: 91, criticalErrorCount: 0, evaluatedAt: '2026-09-11T12:00:00.000Z' }
});
assert.equal(passed.writtenAssessment.outcome, 'passed');
assert.equal(passed.writtenAssessment.bestScorePercent, 86);
assert.equal(passed.writtenAssessment.attemptCount, 2);
assert.equal(passed.performanceAssessment.status, 'passed');
assert.equal(passed.performanceAssessment.scorePercent, 91);
assert.equal(Object.prototype.hasOwnProperty.call(passed, 'credential'), false);
assert.equal(Object.prototype.hasOwnProperty.call(passed, 'eligibility'), false);

const learnerStore = {
  kind: 'test-course-evidence',
  async listProgress() { return []; },
  async setLessonProgress() { return null; },
  async listCourseEvidence(subject, { assessmentId, performanceAssessmentId }) {
    assert.equal(subject, 'learner-001');
    assert.equal(assessmentId, 'ASSESS-LH-TECH1-001-FINAL');
    assert.equal(performanceAssessmentId, 'PRACTICAL-LH-TECH1-001-WORKFLOW');
    return {
      learnerId: subject,
      assessmentAttempts: [
        {
          assessmentId,
          assessmentVersion: '1.0.0',
          formId: 'FORM-COURSE1-002',
          status: 'scored',
          startedAt: '2026-09-10T13:00:00.000Z',
          submittedAt: '2026-09-10T13:45:00.000Z',
          scoredAt: '2026-09-10T14:00:00.000Z',
          scorePercent: 86,
          passed: true,
          response_json: { forbidden: true },
          answerKey: 'forbidden'
        }
      ],
      performanceAssessment: {
        assessmentId: performanceAssessmentId,
        assessmentVersion: '1.0.0',
        status: 'in-progress',
        scorePercent: 62,
        criticalErrorCount: 0,
        evaluatedAt: null,
        updatedAt: '2026-09-11T14:00:00.000Z',
        evidence_json: { forbidden: true }
      }
    };
  }
};

const authorize = (req, scope) => {
  if (req.headers.authorization !== 'Bearer learner-token') return { ok: false, status: 401, error: 'authentication-required' };
  if (scope !== 'learner:read') return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'learner-001', scopes: ['learner:read'] };
};

const server = createApiServer({
  env: { NODE_ENV: 'production' },
  credentialStore,
  learnerStore,
  requiredSchemaVersion: '2',
  authorize,
  logger: () => {}
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');

try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const unauthorized = await fetch(`${base}/api/v1/me/courses/COURSE-LH-TECH1-001/evidence`);
  assert.equal(unauthorized.status, 401);

  const response = await fetch(`${base}/api/v1/me/courses/COURSE-LH-TECH1-001/evidence`, {
    headers: { authorization: 'Bearer learner-token', accept: 'application/json' }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.course.id, 'COURSE-LH-TECH1-001');
  assert.equal(body.writtenAssessment.assessmentId, 'ASSESS-LH-TECH1-001-FINAL');
  assert.equal(body.writtenAssessment.outcome, 'passed');
  assert.equal(body.writtenAssessment.bestScorePercent, 86);
  assert.equal(body.performanceAssessment.assessmentId, 'PRACTICAL-LH-TECH1-001-WORKFLOW');
  assert.equal(body.performanceAssessment.status, 'in-progress');
  assert.equal(body.completionModel.includes('knowledge assessment'), true);

  const serialized = JSON.stringify(body);
  for (const forbidden of ['response_json', 'answerKey', 'evidence_json', 'correctAnswer', 'scoringKey']) {
    assert.equal(serialized.includes(forbidden), false, `course evidence projection leaked ${forbidden}`);
  }
  for (const forbiddenField of ['complete', 'completed', 'eligible', 'credential']) {
    assert.equal(Object.prototype.hasOwnProperty.call(body, forbiddenField), false, `course evidence must not invent top-level ${forbiddenField}`);
  }

  const missing = await fetch(`${base}/api/v1/me/courses/COURSE-NOT-REAL/evidence`, { headers: { authorization: 'Bearer learner-token' } });
  assert.equal(missing.status, 404);
} finally {
  server.close();
  await once(server, 'close');
}

const unavailableServer = createApiServer({
  env: { NODE_ENV: 'production' },
  credentialStore,
  learnerStore: { async listProgress() { return []; } },
  requiredSchemaVersion: '2',
  authorize,
  logger: () => {}
});
unavailableServer.listen(0, '127.0.0.1');
await once(unavailableServer, 'listening');
try {
  const base = `http://127.0.0.1:${unavailableServer.address().port}`;
  const response = await fetch(`${base}/api/v1/me/courses/COURSE-LH-TECH1-001/evidence`, { headers: { authorization: 'Bearer learner-token' } });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'learner-course-evidence-persistence-unavailable');
} finally {
  unavailableServer.close();
  await once(unavailableServer, 'close');
}

console.log('Authenticated Course 1 evidence projection API tests passed.');
