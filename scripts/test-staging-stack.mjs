import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';
import { createApiServer, createDevelopmentCredentialStore } from '../apps/api/src/server.mjs';
import { createServiceTokenAuthorizer } from '../apps/api/src/security.mjs';

const adminToken = 'staging-smoke-admin-token-0123456789abcdef';
const learnerToken = 'staging-smoke-learner-token-0123456789abcdef';
const assessorToken = 'staging-smoke-assessor-token-0123456789abcdef';
const learnerSubject = 'staging-smoke-learner';

const enrollmentsBySubject = new Map();
const progressBySubject = new Map();
const attemptsBySubject = new Map();
const performanceBySubject = new Map();

function recordsFor(store, subject) {
  const value = store.get(subject) ?? [];
  store.set(subject, value);
  return value;
}

function attemptMapFor(subject) {
  const value = attemptsBySubject.get(subject) ?? new Map();
  attemptsBySubject.set(subject, value);
  return value;
}

const learnerStore = {
  kind: 'staging-memory-learner',
  async listEnrollments(subject) {
    return structuredClone(recordsFor(enrollmentsBySubject, subject));
  },
  async enroll(subject, record) {
    const rows = recordsFor(enrollmentsBySubject, subject);
    const existing = rows.find((row) => row.courseId === record.courseId && row.courseVersion === record.courseVersion);
    if (existing) return structuredClone(existing);
    const saved = {
      ...record,
      status: 'active',
      enrolledAt: '2026-09-10T18:00:00.000Z',
      completedAt: null
    };
    rows.push(saved);
    return structuredClone(saved);
  },
  async listProgress(subject) {
    return structuredClone(recordsFor(progressBySubject, subject));
  },
  async setLessonProgress(subject, record) {
    const rows = recordsFor(progressBySubject, subject);
    const existingIndex = rows.findIndex((row) => row.lessonId === record.lessonId && row.lessonVersion === record.lessonVersion);
    const saved = {
      ...record,
      completedAt: record.status === 'completed' ? '2026-09-10T18:05:00.000Z' : null
    };
    if (existingIndex >= 0) rows.splice(existingIndex, 1, saved);
    else rows.push(saved);
    return structuredClone(saved);
  },
  async listAssessmentAttempts(subject, assessmentId) {
    return [...attemptMapFor(subject).values()]
      .filter((attempt) => attempt.assessmentId === assessmentId)
      .map((attempt) => structuredClone(attempt));
  },
  async createAssessmentAttempt(subject, attempt) {
    attemptMapFor(subject).set(attempt.id, structuredClone(attempt));
    return structuredClone(attempt);
  },
  async getAssessmentAttempt(subject, attemptId) {
    const row = attemptMapFor(subject).get(attemptId);
    return row ? structuredClone(row) : null;
  },
  async saveSubmittedAssessmentAttempt(subject, attempt) {
    attemptMapFor(subject).set(attempt.id, structuredClone(attempt));
    return structuredClone(attempt);
  },
  async saveScoredAssessmentAttempt(subject, attempt) {
    attemptMapFor(subject).set(attempt.id, structuredClone(attempt));
    return structuredClone(attempt);
  },
  async recordPerformanceAssessmentResult(subject, record) {
    const rows = recordsFor(performanceBySubject, subject);
    const saved = {
      ...record,
      evidenceVerified: true,
      evaluatedAt: '2026-09-10T18:10:00.000Z',
      updatedAt: '2026-09-10T18:10:01.000Z'
    };
    const existingIndex = rows.findIndex((row) => row.assessmentId === record.assessmentId);
    if (existingIndex >= 0) rows.splice(existingIndex, 1, saved);
    else rows.push(saved);
    return structuredClone(saved);
  },
  async listCredentialEvidence(subject) {
    const attempts = [...attemptMapFor(subject).values()].map((attempt) => structuredClone(attempt));
    return {
      learnerId: subject,
      assessments: [],
      assessmentAttempts: attempts,
      competencies: [],
      performanceAssessments: structuredClone(recordsFor(performanceBySubject, subject)),
      portfolioArtifacts: []
    };
  }
};

const web = createAcademyWebServer({ env: { ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' } });
const api = createApiServer({
  env: { ...process.env, NODE_ENV: 'development' },
  credentialStore: createDevelopmentCredentialStore(),
  learnerStore,
  authorize: createServiceTokenAuthorizer({
    tokens: [
      { token: adminToken, subject: 'staging-smoke-admin', scopes: ['admin:read'] },
      { token: learnerToken, subject: learnerSubject, scopes: ['learner:read', 'learner:write'] },
      { token: assessorToken, subject: 'staging-smoke-assessor', scopes: ['assessor:write'] }
    ]
  }),
  logger: () => {}
});

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function close(server) {
  server.close();
  await once(server, 'close');
}

async function jsonRequest(url, { token = null, method = 'GET', body = null } = {}) {
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== null) headers['content-type'] = 'application/json';
  const response = await fetch(url, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

const webBase = await listen(web);
const apiBase = await listen(api);

try {
  const webHealth = await fetch(`${webBase}/healthz`);
  assert.equal(webHealth.status, 200);
  assert.equal((await webHealth.json()).ok, true);

  const catalogResponse = await fetch(`${webBase}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.ok(catalog.courses.length > 0, 'staging catalog must contain courses');
  assert.ok(catalog.credentials.some((credential) => credential.id === 'CRED-PROP-ADVANCED-001'), 'staging preview must expose draft specialist credential metadata');

  const lessonId = catalog.courses
    .flatMap((course) => course.modules)
    .flatMap((module) => module.lessons)
    .map((lesson) => lesson.id)
    .find(Boolean);
  assert.ok(lessonId, 'staging catalog must contain at least one lesson');
  const lessonResponse = await fetch(`${webBase}/api/lessons/${lessonId}`);
  assert.equal(lessonResponse.status, 200);

  const apiHealth = await fetch(`${apiBase}/healthz`);
  assert.equal(apiHealth.status, 200);
  assert.equal((await apiHealth.json()).ok, true);

  const apiReady = await fetch(`${apiBase}/readyz`);
  assert.equal(apiReady.status, 200);
  assert.equal((await apiReady.json()).ok, true);

  const unauthenticated = await fetch(`${apiBase}/api/v1/admin/diagnostics`);
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.headers.get('www-authenticate') ?? '', /Bearer/);

  const invalidToken = await fetch(`${apiBase}/api/v1/admin/diagnostics`, {
    headers: { authorization: 'Bearer definitely-not-the-token' }
  });
  assert.equal(invalidToken.status, 401);

  const authenticated = await jsonRequest(`${apiBase}/api/v1/admin/diagnostics`, { token: adminToken });
  assert.equal(authenticated.response.status, 200);
  assert.equal(authenticated.payload.ok, true);
  assert.equal(authenticated.payload.storageAdapter, 'development-memory');
  assert.equal(authenticated.payload.learnerStorageAdapter, 'staging-memory-learner');
  assert.equal(authenticated.payload.authenticatedSubject, 'staging-smoke-admin');

  const enrollment = await jsonRequest(`${apiBase}/api/v1/me/enrollments`, {
    token: learnerToken,
    method: 'POST',
    body: { courseId: 'COURSE-CULT-FOUNDATIONS-001', courseVersion: '1.0.0' }
  });
  assert.equal(enrollment.response.status, 200);
  assert.equal(enrollment.payload.enrollment.courseId, 'COURSE-CULT-FOUNDATIONS-001');

  const progressWrite = await jsonRequest(`${apiBase}/api/v1/me/lessons/LESSON-ENV-VPD-001`, {
    token: learnerToken,
    method: 'PUT',
    body: { lessonVersion: '1.1.0', status: 'completed' }
  });
  assert.equal(progressWrite.response.status, 200);
  assert.equal(progressWrite.payload.progress.status, 'completed');

  const completion = await jsonRequest(`${apiBase}/api/v1/me/courses/COURSE-CULT-FOUNDATIONS-001/completion`, { token: learnerToken });
  assert.equal(completion.response.status, 200);
  assert.equal(completion.payload.learner.subject, learnerSubject);
  assert.ok(completion.payload.completion.completedLessons >= 1, 'course completion projection must include persisted lesson completion');

  const attemptStart = await jsonRequest(`${apiBase}/api/v1/me/assessments/ASSESS-CULT-FOUNDATIONS-FINAL-001/attempts`, {
    token: learnerToken,
    method: 'POST',
    body: {}
  });
  assert.equal(attemptStart.response.status, 201);
  assert.equal(attemptStart.payload.attempt.status, 'started');
  assert.equal(attemptStart.payload.attempt.items.length, 60);
  assert.equal(JSON.stringify(attemptStart.payload).includes('rationale'), false, 'staging learner assessment payload must not leak rationales');
  assert.equal(JSON.stringify(attemptStart.payload).includes('correctAnswer'), false, 'staging learner assessment payload must not leak answers');

  const beforePractical = await jsonRequest(`${apiBase}/api/v1/me/credentials/CRED-PROP-ADVANCED-001/progress`, { token: learnerToken });
  assert.equal(beforePractical.response.status, 200);
  const practicalBefore = beforePractical.payload.performanceAssessments.find((row) => row.assessmentId === 'PRACTICAL-SPEC-PROP-TC-001');
  assert.equal(practicalBefore?.status, 'not-recorded');

  const practicalWrite = await jsonRequest(`${apiBase}/api/v1/admin/performance-assessments/results`, {
    token: assessorToken,
    method: 'POST',
    body: {
      learnerSubject,
      assessmentId: 'PRACTICAL-SPEC-PROP-TC-001',
      assessmentVersion: '1.0.0',
      deliveryMode: 'supervised-lab',
      scorePercent: 92,
      criticalErrorCount: 0,
      evidence: { stagingFixture: true, outputsReviewed: 6 }
    }
  });
  assert.equal(practicalWrite.response.status, 201);
  assert.equal(practicalWrite.payload.result.status, 'passed');
  assert.equal(practicalWrite.payload.result.evidenceVerified, true);
  assert.equal(Object.hasOwn(practicalWrite.payload.result, 'evaluatorId'), false, 'learner-safe performance projection must not expose assessor identity');

  const afterPractical = await jsonRequest(`${apiBase}/api/v1/me/credentials/CRED-PROP-ADVANCED-001/progress`, { token: learnerToken });
  assert.equal(afterPractical.response.status, 200);
  const practicalAfter = afterPractical.payload.performanceAssessments.find((row) => row.assessmentId === 'PRACTICAL-SPEC-PROP-TC-001');
  assert.equal(practicalAfter?.status, 'passed');
  assert.equal(practicalAfter?.evidenceVerified, true);
  assert.equal(afterPractical.payload.eligibility.eligible, false, 'passing one practical must not bypass written assessment and portfolio requirements');

  console.log(`Staging stack smoke passed; courses=${catalog.courses.length}; sampleLesson=${lessonId}; apiReady=true; learnerRuntime=true; assessmentAttempt=true; assessorPractical=true; credentialProgress=true.`);
} finally {
  await Promise.all([close(web), close(api)]);
}
