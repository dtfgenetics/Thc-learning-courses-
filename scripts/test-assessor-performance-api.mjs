import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const ASSESSOR_TOKEN = 'assessor-write-token';
const READER_TOKEN = 'reader-only-token';
const assessmentId = 'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP';
const writes = [];

const learnerStore = {
  kind: 'test-assessor-store',
  async recordPerformanceAssessmentResult(learnerSubject, record) {
    writes.push({ learnerSubject, record });
    return {
      assessmentId: record.assessmentId,
      assessmentVersion: record.assessmentVersion,
      status: record.status,
      scorePercent: record.scorePercent,
      criticalErrorCount: record.criticalErrorCount,
      evidenceVerified: true,
      rubricId: record.rubricId,
      rubricVersion: record.rubricVersion,
      deliveryMode: record.deliveryMode,
      evaluatedAt: '2026-09-06T21:45:00.000Z',
      updatedAt: '2026-09-06T21:45:01.000Z'
    };
  }
};

function authorize(req, requiredScope) {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'authentication-required' };
  const scopes = token === ASSESSOR_TOKEN ? ['assessor:write'] : token === READER_TOKEN ? ['learner:read'] : [];
  if (!scopes.includes(requiredScope)) return { ok: false, status: 403, error: 'insufficient-scope' };
  return { ok: true, subject: 'ASSESSOR-USER-001', scopes };
}

const server = createApiServer({ learnerStore, authorize, logger: () => {} });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

async function post(body, token = ASSESSOR_TOKEN) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${base}/api/v1/admin/performance-assessments/results`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return { response, body: await response.json() };
}

const validBody = {
  learnerSubject: 'LEARNER-001',
  assessmentId,
  assessmentVersion: '1.0.0',
  deliveryMode: 'supervised-lab',
  scorePercent: 91,
  criticalErrorCount: 0,
  evidence: { observation: 'verified practical evidence' }
};

try {
  const unauthenticated = await post(validBody, null);
  assert.equal(unauthenticated.response.status, 401);
  assert.equal(unauthenticated.body.error, 'authentication-required');

  const insufficient = await post(validBody, READER_TOKEN);
  assert.equal(insufficient.response.status, 403);
  assert.equal(insufficient.body.error, 'insufficient-scope');

  const success = await post(validBody);
  assert.equal(success.response.status, 201);
  assert.equal(success.body.result.status, 'passed');
  assert.equal(success.body.result.scorePercent, 91);
  assert.equal(success.body.result.evidenceVerified, true);
  assert.equal(Object.prototype.hasOwnProperty.call(success.body.result, 'evaluatorId'), false, 'API response must not expose evaluator identity');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].learnerSubject, 'LEARNER-001');
  assert.equal(writes[0].record.evaluatorId, 'ASSESSOR-USER-001');
  assert.equal(writes[0].record.rubricId, assessmentId);
  assert.equal(writes[0].record.rubricVersion, '1.0.0');
  assert.equal(writes[0].record.status, 'passed');

  const criticalFail = await post({ ...validBody, scorePercent: 95, criticalErrorCount: 1 });
  assert.equal(criticalFail.response.status, 201);
  assert.equal(criticalFail.body.result.status, 'failed');
  assert.equal(writes.at(-1).record.status, 'failed', 'critical error must override numeric passing score');

  const scoreFail = await post({ ...validBody, scorePercent: 79 });
  assert.equal(scoreFail.response.status, 201);
  assert.equal(scoreFail.body.result.status, 'failed');

  const versionMismatch = await post({ ...validBody, assessmentVersion: '0.9.0' });
  assert.equal(versionMismatch.response.status, 409);
  assert.equal(versionMismatch.body.error, 'performance-assessment-version-mismatch');
  assert.equal(versionMismatch.body.currentVersion, '1.0.0');

  const unsupportedMode = await post({ ...validBody, deliveryMode: 'self-attested' });
  assert.equal(unsupportedMode.response.status, 400);
  assert.equal(unsupportedMode.body.error, 'unsupported-performance-delivery-mode');

  const invalidScore = await post({ ...validBody, scorePercent: 101 });
  assert.equal(invalidScore.response.status, 400);
  assert.equal(invalidScore.body.error, 'invalid-performance-score');

  const invalidCriticalCount = await post({ ...validBody, criticalErrorCount: -1 });
  assert.equal(invalidCriticalCount.response.status, 400);
  assert.equal(invalidCriticalCount.body.error, 'invalid-critical-error-count');

  const invalidEvidence = await post({ ...validBody, evidence: ['not-an-object'] });
  assert.equal(invalidEvidence.response.status, 400);
  assert.equal(invalidEvidence.body.error, 'invalid-performance-evidence');

  const missingLearner = await post({ ...validBody, learnerSubject: '' });
  assert.equal(missingLearner.response.status, 400);
  assert.equal(missingLearner.body.error, 'learner-subject-required');

  const missingAssessment = await post({ ...validBody, assessmentId: 'PRACTICAL-NOT-REAL-001' });
  assert.equal(missingAssessment.response.status, 404);
  assert.equal(missingAssessment.body.error, 'performance-assessment-not-found');
} finally {
  server.close();
  await once(server, 'close');
}

const noWriterServer = createApiServer({
  learnerStore: { kind: 'read-only-test' },
  authorize,
  logger: () => {}
});
noWriterServer.listen(0, '127.0.0.1');
await once(noWriterServer, 'listening');
try {
  const response = await fetch(`http://127.0.0.1:${noWriterServer.address().port}/api/v1/admin/performance-assessments/results`, {
    method: 'POST',
    headers: { authorization: `Bearer ${ASSESSOR_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(validBody)
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, 'performance-evidence-persistence-unavailable');
} finally {
  noWriterServer.close();
  await once(noWriterServer, 'close');
}

console.log('Assessor performance result API authorization, validation, scoring, and persistence tests passed.');
