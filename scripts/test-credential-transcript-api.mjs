import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer, credentialTranscriptView } from '../apps/api/src/server.mjs';

const credentialStore = {
  kind: 'test-persistent',
  async ping() { return true; },
  async schemaVersion() { return '2'; },
  async getByVerificationId() { return null; }
};

const learnerStore = {
  kind: 'test-transcript-evidence',
  async listCredentialEvidence(subject, { credentialDefinitionId }) {
    assert.equal(subject, 'learner-001');
    assert.equal(credentialDefinitionId, 'CRED-CULT-TECH-II-001');
    return {
      learnerId: subject,
      assessmentAttempts: [
        {
          assessmentId: 'ASSESS-CULT-TECH-II-CREDENTIAL-001',
          assessmentVersion: '1.0.0',
          formId: 'PRIVATE-FORM-ID',
          status: 'scored',
          scorePercent: 86,
          passed: true,
          startedAt: '2026-09-01T12:00:00.000Z',
          scoredAt: '2026-09-01T13:00:00.000Z',
          responses: { private: true }
        }
      ],
      assessments: [
        { assessmentId: 'ASSESS-CULT-TECH-II-CREDENTIAL-001', status: 'passed', scorePercent: 86 }
      ],
      competencies: [
        { competencyId: 'COMP-ENV-ADV-001', curriculumVersion: '1.0.0', masteryLevel: 'demonstrated', updatedAt: '2026-09-01T13:00:00.000Z' },
        { competencyId: 'COMP-WATER-QUALITY-ADV-001', curriculumVersion: '1.0.0', masteryLevel: 'developing', updatedAt: '2026-09-01T13:05:00.000Z' },
        { competencyId: 'COMP-PLANT-BIO-001', curriculumVersion: '1.0.0', masteryLevel: 'demonstrated', updatedAt: '2026-09-01T13:10:00.000Z' },
        { competencyId: 'COMP-TC-ASEPTIC-001', curriculumVersion: '1.0.0', masteryLevel: 'demonstrated', updatedAt: '2026-09-01T13:15:00.000Z' }
      ],
      performanceAssessments: [
        {
          assessmentId: 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP',
          status: 'passed',
          scorePercent: 88,
          criticalErrorCount: 0,
          evaluatedAt: '2026-09-02T13:00:00.000Z',
          evaluatorNotes: 'PRIVATE'
        }
      ],
      portfolioArtifacts: [
        { artifactId: 'crop-diagnostic-report', status: 'verified', verifiedAt: '2026-09-03T13:00:00.000Z', privateNotes: 'PRIVATE' }
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
  const unauthorized = await fetch(`${base}/api/v1/me/credentials/CRED-CULT-TECH-II-001/transcript`);
  assert.equal(unauthorized.status, 401);

  const response = await fetch(`${base}/api/v1/me/credentials/CRED-CULT-TECH-II-001/transcript`, {
    headers: { authorization: 'Bearer learner-token', accept: 'application/json' }
  });
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.transcriptType, 'credential-competency-transcript');
  assert.equal(body.credential.id, 'CRED-CULT-TECH-II-001');
  assert.equal(body.credential.role, 'ROLE-CULT-TECH-II-001');
  assert.equal(body.summary.eligibleForCredential, false);
  assert.equal(body.competencies.some((row) => row.competencyId === 'COMP-ENV-ADV-001'), true);
  assert.equal(body.competencies.some((row) => row.competencyId === 'COMP-PLANT-BIO-001'), true, 'Technician II credential explicitly demonstrates plant-biology competency');
  assert.equal(body.competencies.some((row) => row.competencyId === 'COMP-TC-ASEPTIC-001'), false, 'credential projection must exclude evidence outside competenciesDemonstrated');
  assert.equal(body.summary.demonstratedCompetencies, 1);
  assert.equal(body.assessments.length, 1);
  assert.equal(body.assessments[0].status, 'passed');
  assert.equal(body.performanceAssessments.length, 8);
  assert.equal(body.performanceAssessments.find((row) => row.assessmentId === 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP').status, 'passed');
  assert.equal(body.portfolioArtifacts.length, 9);
  assert.equal(body.portfolioArtifacts.find((row) => row.artifactId === 'crop-diagnostic-report').status, 'verified');
  assert.equal(body.privacy.excludesLearnerIdentifier, true);
  assert.equal(body.privacy.excludesPrivateEvaluatorNotes, true);
  assert.equal(body.privacy.excludesRawResponses, true);

  const serialized = JSON.stringify(body);
  for (const forbidden of ['learner-001', 'PRIVATE-FORM-ID', 'PRIVATE', 'responses', 'evaluatorNotes', 'privateNotes']) {
    assert.equal(serialized.includes(forbidden), false, `transcript must not expose ${forbidden}`);
  }

  const missing = await fetch(`${base}/api/v1/me/credentials/CRED-NOT-REAL/transcript`, {
    headers: { authorization: 'Bearer learner-token' }
  });
  assert.equal(missing.status, 404);
} finally {
  server.close();
  await once(server, 'close');
}

console.log('Privacy-bounded learner credential competency transcript API tests passed.');
