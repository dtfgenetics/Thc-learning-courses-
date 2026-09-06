import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const credentialStore = {
  kind: 'test-persistent',
  async ping() { return true; },
  async schemaVersion() { return '2'; },
  async getByVerificationId() { return null; }
};

const learnerStore = {
  kind: 'test-learner-evidence',
  async listProgress() { return []; },
  async setLessonProgress() { return null; },
  async listCredentialEvidence(subject, { credentialDefinitionId }) {
    assert.equal(subject, 'learner-001');
    assert.equal(credentialDefinitionId, 'CRED-CULT-TECH-II-001');
    return {
      learnerId: subject,
      assessmentAttempts: [
        { assessmentId: 'ASSESS-CULT-TECH-II-CREDENTIAL-001', assessmentVersion: '1.0.0', formId: 'FORM-TECH2-1', status: 'scored', scorePercent: 86, passed: true, startedAt: '2026-09-01T12:00:00.000Z', scoredAt: '2026-09-01T13:00:00.000Z' }
      ],
      assessments: [
        { assessmentId: 'ASSESS-CULT-TECH-II-CREDENTIAL-001', status: 'passed', scorePercent: 86 }
      ],
      competencies: [
        { competencyId: 'COMP-ENV-ADV-001', curriculumVersion: '1.0.0', masteryLevel: 'demonstrated', updatedAt: '2026-09-01T13:00:00.000Z' },
        { competencyId: 'COMP-WATER-QUALITY-ADV-001', curriculumVersion: '1.0.0', masteryLevel: 'developing', updatedAt: '2026-09-01T13:00:00.000Z' },
        { competencyId: 'COMP-PLANT-BIO-001', curriculumVersion: '1.0.0', masteryLevel: 'demonstrated', updatedAt: '2026-09-01T13:00:00.000Z' }
      ],
      performanceAssessments: [
        { assessmentId: 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP', status: 'passed', scorePercent: 88, criticalErrorCount: 0 }
      ],
      portfolioArtifacts: [
        { artifactId: 'crop-diagnostic-report', status: 'verified' }
      ]
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
  const unauthorized = await fetch(`${base}/api/v1/me/credentials/CRED-CULT-TECH-II-001/progress`);
  assert.equal(unauthorized.status, 401);

  const response = await fetch(`${base}/api/v1/me/credentials/CRED-CULT-TECH-II-001/progress`, {
    headers: { authorization: 'Bearer learner-token', accept: 'application/json' }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.credential.id, 'CRED-CULT-TECH-II-001');
  assert.equal(body.credential.role, 'ROLE-CULT-TECH-II-001');
  assert.equal(body.assessmentAttempts.length, 1);
  assert.equal(body.competencies.some((row) => row.competencyId === 'COMP-ENV-ADV-001'), true);
  assert.equal(body.competencies.some((row) => row.competencyId === 'COMP-PLANT-BIO-001'), false, 'transcript must be scoped to credential course competencies');
  assert.equal(body.performanceAssessments.length, 8);
  assert.equal(body.performanceAssessments.find((row) => row.assessmentId === 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP').status, 'passed');
  assert.equal(body.performanceAssessments.filter((row) => row.status === 'not-recorded').length, 7);
  assert.equal(body.portfolioArtifacts.length, 9);
  assert.equal(body.portfolioArtifacts.find((row) => row.artifactId === 'crop-diagnostic-report').status, 'verified');
  assert.equal(body.portfolioArtifacts.filter((row) => row.status === 'not-recorded').length, 8);
  assert.equal(body.eligibility.eligible, false);
  assert.equal(body.eligibility.missingRequirements.some((row) => row.type === 'performance-assessment'), true);
  assert.equal(body.eligibility.missingRequirements.some((row) => row.type === 'portfolio-artifact'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'subjectId'), false);

  const missing = await fetch(`${base}/api/v1/me/credentials/CRED-NOT-REAL/progress`, { headers: { authorization: 'Bearer learner-token' } });
  assert.equal(missing.status, 404);
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Authenticated learner credential progress API tests passed.');
