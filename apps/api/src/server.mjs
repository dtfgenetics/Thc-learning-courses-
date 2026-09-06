import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { publicCredentialView } from '../../../packages/domain/credential-runtime.mjs';
import { evaluateCredentialEligibility } from '../../../packages/domain/credential-eligibility.mjs';
import { isValidCurriculumVersion, projectLearningCompletion } from '../../../packages/domain/learning-completion.mjs';
import { loadPerformanceDefinition, loadRequiredPerformanceDefinitions } from '../../../packages/domain/performance-definitions.mjs';
import { createFixedWindowRateLimiter } from './rate-limit.mjs';
import { createServiceTokenAuthorizer, serviceTokensFromEnvironment } from './security.mjs';
import { isPersistenceUnavailableError } from './persistence-errors.mjs';
import { loadProductionApiOptions } from './bootstrap.mjs';

const root = process.cwd();
const port = Number(process.env.PORT ?? 8787);
const credentialDefinitions = new Map();
const courseDefinitions = new Map();
const moduleDefinitions = new Map();
const lessonDefinitions = new Map();

function loadCredentialDefinition(id) {
  if (!/^CRED-[A-Z0-9-]+$/.test(String(id ?? ''))) return null;
  if (credentialDefinitions.has(id)) return credentialDefinitions.get(id);
  const target = path.join(root, 'content/credentials', `${id}.json`);
  if (!fs.existsSync(target)) return null;
  const definition = JSON.parse(fs.readFileSync(target, 'utf8'));
  credentialDefinitions.set(id, definition);
  return definition;
}

function loadCourseDefinition(id) {
  if (!/^COURSE-[A-Z0-9-]+$/.test(String(id ?? ''))) return null;
  if (courseDefinitions.has(id)) return courseDefinitions.get(id);
  const target = path.join(root, 'content/courses', `${id}.json`);
  if (!fs.existsSync(target)) return null;
  const definition = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (definition?.id !== id) return null;
  courseDefinitions.set(id, definition);
  return definition;
}

function loadModuleDefinition(id) {
  if (!/^MOD-[A-Z0-9-]+$/.test(String(id ?? ''))) return null;
  if (moduleDefinitions.has(id)) return moduleDefinitions.get(id);
  const target = path.join(root, 'content/modules', `${id}.json`);
  if (!fs.existsSync(target)) return null;
  const definition = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (definition?.id !== id) return null;
  moduleDefinitions.set(id, definition);
  return definition;
}

function loadLessonDefinition(id) {
  if (!/^LESSON-[A-Z0-9-]+$/.test(String(id ?? ''))) return null;
  if (lessonDefinitions.has(id)) return lessonDefinitions.get(id);
  const target = path.join(root, 'content/lessons', `${id}.json`);
  if (!fs.existsSync(target)) return null;
  const definition = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (definition?.id !== id) return null;
  lessonDefinitions.set(id, definition);
  return definition;
}

export function createDevelopmentCredentialStore() {
  const records = new Map();
  return {
    kind: 'development-memory',
    async ping() { return true; },
    async schemaVersion() { return 'development'; },
    getByVerificationId(verificationId) { return records.get(verificationId) ?? null; },
    listStatusHistoryByVerificationId(verificationId) { return records.get(verificationId)?.statusHistory ?? []; },
    register(record) { records.set(record.verificationId, record); return record; },
    count() { return records.size; }
  };
}

const developmentCredentialStore = createDevelopmentCredentialStore();

function resolveCredentialStore(explicitStore, env = process.env) {
  if (explicitStore) return explicitStore;
  if (env.NODE_ENV === 'production') throw new Error('Production API requires an explicit persistent credentialStore');
  return developmentCredentialStore;
}

export function registerCredentialForDevelopment(record) {
  if (process.env.NODE_ENV === 'production') throw new Error('Development credential adapter is disabled in production');
  return developmentCredentialStore.register(record);
}

function setSecurityHeaders(res, requestId) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('x-request-id', requestId);
}
function json(res, status, body, extraHeaders = {}) {
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  res.statusCode = status;
  res.end(JSON.stringify(body));
}
function rateLimitKey(req) { return req.socket?.remoteAddress || 'unknown'; }
function applyRateLimitHeaders(res, result) {
  res.setHeader('ratelimit-limit', String(result.limit));
  res.setHeader('ratelimit-remaining', String(result.remaining));
  res.setHeader('ratelimit-reset', String(Math.ceil(result.resetAt / 1000)));
}
function defaultLogger(entry) { process.stdout.write(`${JSON.stringify(entry)}\n`); }

async function readJsonBody(req, { maxBytes = 16 * 1024 } = {}) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('request-body-too-large');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('invalid-json-body'); }
}

function authorizeRequest(authorize, req, scope, res, requestId) {
  const auth = authorize(req, scope);
  if (auth.ok) return auth;
  if (auth.status === 401) res.setHeader('www-authenticate', 'Bearer realm="thc-academy-api"');
  json(res, auth.status, { error: auth.error, requestId });
  return null;
}

function learnerPerformanceView(row) {
  return {
    assessmentId: row.assessmentId,
    assessmentVersion: row.assessmentVersion ?? null,
    status: row.status,
    scorePercent: row.scorePercent ?? null,
    criticalErrorCount: Number(row.criticalErrorCount ?? 0),
    evidenceVerified: row.evidenceVerified === true,
    rubricId: row.rubricId ?? null,
    rubricVersion: row.rubricVersion ?? null,
    deliveryMode: row.deliveryMode ?? null,
    evaluatedAt: row.evaluatedAt ?? null,
    updatedAt: row.updatedAt ?? null
  };
}

function credentialProgressView(credential, course, rawEvidence, performanceDefinitions) {
  const requiredAssessments = new Set(credential.eligibility.requiredAssessments ?? []);
  const requiredPerformance = credential.eligibility.requiredPerformanceAssessments ?? [];
  const requiredArtifacts = credential.eligibility.requiredPortfolioArtifacts ?? [];
  const requiredCompetencies = new Set(course?.competencies ?? []);
  const evidence = {
    learnerId: rawEvidence.learnerId ?? null,
    assessments: (rawEvidence.assessments ?? []).filter((row) => requiredAssessments.has(row.assessmentId)),
    performanceAssessments: (rawEvidence.performanceAssessments ?? []).filter((row) => requiredPerformance.includes(row.assessmentId)),
    portfolioArtifacts: (rawEvidence.portfolioArtifacts ?? []).filter((row) => requiredArtifacts.includes(row.artifactId))
  };
  const eligibility = evaluateCredentialEligibility({ credential, evidence, performanceDefinitions });
  const performanceById = new Map(evidence.performanceAssessments.map((row) => [row.assessmentId, row]));
  const portfolioById = new Map(evidence.portfolioArtifacts.map((row) => [row.artifactId, row]));
  return {
    credential: {
      id: credential.id,
      title: credential.title,
      version: credential.version,
      role: credential.role ?? null,
      course: credential.course,
      lifecycle: credential.lifecycle ?? null,
      minimumPassingScorePercent: credential.eligibility.minimumPassingScorePercent
    },
    eligibility,
    assessmentAttempts: (rawEvidence.assessmentAttempts ?? []).filter((row) => requiredAssessments.has(row.assessmentId)),
    competencies: (rawEvidence.competencies ?? []).filter((row) => requiredCompetencies.size === 0 || requiredCompetencies.has(row.competencyId)),
    performanceAssessments: requiredPerformance.map((id) => learnerPerformanceView(performanceById.get(id) ?? { assessmentId: id, status: 'not-recorded' })),
    portfolioArtifacts: requiredArtifacts.map((id) => portfolioById.get(id) ?? { artifactId: id, status: 'not-recorded' })
  };
}

export function createHandler({
  credentialStore = null,
  credentialWriter = null,
  learnerStore = null,
  env = process.env,
  requiredSchemaVersion = null,
  limiter = createFixedWindowRateLimiter(),
  authorize = null,
  logger = defaultLogger,
  nowNs = () => process.hrtime.bigint()
} = {}) {
  const resolvedCredentialStore = resolveCredentialStore(credentialStore, env);
  const resolvedAuthorize = authorize ?? createServiceTokenAuthorizer({ tokens: serviceTokensFromEnvironment(env) });

  return async function handler(req, res) {
    const startedAt = nowNs();
    const requestId = crypto.randomUUID();
    let route = 'unmatched';
    setSecurityHeaders(res, requestId);
    res.once('finish', () => {
      const durationMs = Number(nowNs() - startedAt) / 1_000_000;
      logger({ level: 'info', event: 'http.request.completed', requestId, method: req.method, route, statusCode: res.statusCode, durationMs: Number(durationMs.toFixed(3)) });
    });

    try {
      let url;
      try { url = new URL(req.url, 'http://localhost'); } catch {
        route = 'invalid-url';
        return json(res, 400, { error: 'invalid-url', requestId });
      }
      if (req.method === 'GET' && url.pathname === '/healthz') {
        route = 'GET /healthz';
        return json(res, 200, { ok: true, requestId });
      }
      if (req.method === 'GET' && url.pathname === '/readyz') {
        route = 'GET /readyz';
        if (typeof resolvedCredentialStore.ping !== 'function') return json(res, 503, { ok: false, error: 'readiness-check-unavailable', requestId });
        const connected = await resolvedCredentialStore.ping();
        if (!connected) return json(res, 503, { ok: false, error: 'dependency-unavailable', requestId });
        if (requiredSchemaVersion !== null) {
          if (typeof resolvedCredentialStore.schemaVersion !== 'function') return json(res, 503, { ok: false, error: 'schema-readiness-unavailable', requestId });
          const actualSchemaVersion = await resolvedCredentialStore.schemaVersion();
          if (String(actualSchemaVersion ?? '') !== String(requiredSchemaVersion)) {
            return json(res, 503, { ok: false, error: 'database-schema-version-mismatch', requiredSchemaVersion: String(requiredSchemaVersion), actualSchemaVersion: actualSchemaVersion == null ? null : String(actualSchemaVersion), requestId });
          }
        }
        return json(res, 200, { ok: true, schemaVersion: requiredSchemaVersion === null ? null : String(requiredSchemaVersion), requestId });
      }
      if (url.pathname.startsWith('/api/')) {
        const rate = limiter.check(rateLimitKey(req));
        applyRateLimitHeaders(res, rate);
        if (!rate.allowed) {
          route = 'rate-limited-api';
          return json(res, 429, { error: 'rate-limit-exceeded', requestId }, { 'retry-after': String(rate.retryAfterSeconds) });
        }
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/me/enrollments') {
        route = 'GET /api/v1/me/enrollments';
        const auth = authorizeRequest(resolvedAuthorize, req, 'learner:read', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.listEnrollments !== 'function') return json(res, 503, { error: 'learner-persistence-unavailable', requestId });
        const enrollments = await learnerStore.listEnrollments(auth.subject);
        return json(res, 200, { learner: { subject: auth.subject }, enrollments });
      }

      if (req.method === 'POST' && url.pathname === '/api/v1/me/enrollments') {
        route = 'POST /api/v1/me/enrollments';
        const auth = authorizeRequest(resolvedAuthorize, req, 'learner:write', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.enroll !== 'function') return json(res, 503, { error: 'learner-persistence-unavailable', requestId });
        let body;
        try { body = await readJsonBody(req); }
        catch (error) { return json(res, error.message === 'request-body-too-large' ? 413 : 400, { error: error.message, requestId }); }
        const courseId = String(body.courseId ?? '').trim();
        const courseVersion = String(body.courseVersion ?? '').trim();
        const course = loadCourseDefinition(courseId);
        if (!course) return json(res, 404, { error: 'course-not-found', requestId });
        if (String(course.version) !== courseVersion) return json(res, 409, { error: 'course-version-mismatch', currentVersion: String(course.version), requestId });
        const enrollment = await learnerStore.enroll(auth.subject, { courseId, courseVersion });
        return json(res, 200, { enrollment });
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/me/progress') {
        route = 'GET /api/v1/me/progress';
        const auth = authorizeRequest(resolvedAuthorize, req, 'learner:read', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.listProgress !== 'function') return json(res, 503, { error: 'learner-persistence-unavailable', requestId });
        const progress = await learnerStore.listProgress(auth.subject);
        return json(res, 200, { learner: { subject: auth.subject }, progress });
      }

      const courseCompletionMatch = url.pathname.match(/^\/api\/v1\/me\/courses\/(COURSE-[A-Z0-9-]+)\/completion$/);
if (req.method === 'GET' && courseCompletionMatch) {
  route = 'GET /api/v1/me/courses/:courseId/completion';
  const auth = authorizeRequest(resolvedAuthorize, req, 'learner:read', res, requestId);
  if (!auth) return;
  if (!learnerStore || typeof learnerStore.listProgress !== 'function') return json(res, 503, { error: 'learner-persistence-unavailable', requestId });
  const course = loadCourseDefinition(courseCompletionMatch[1]);
  if (!course) return json(res, 404, { error: 'course-not-found', requestId });
  const modules = [];
  const lessons = [];
  const seenLessons = new Set();
  for (const moduleId of course.modules ?? []) {
    const module = loadModuleDefinition(moduleId);
    if (!module) return json(res, 500, { error: 'course-module-not-found', moduleId, requestId });
    modules.push(module);
    for (const lessonId of module.lessons ?? []) {
      if (seenLessons.has(lessonId)) continue;
      const lesson = loadLessonDefinition(lessonId);
      if (!lesson) return json(res, 500, { error: 'course-lesson-not-found', lessonId, requestId });
      seenLessons.add(lessonId);
      lessons.push(lesson);
    }
  }
  const progress = await learnerStore.listProgress(auth.subject);
  const completion = projectLearningCompletion({ course, modules, lessons, progress });
  return json(res, 200, { learner: { subject: auth.subject }, completion });
}

      const credentialProgressMatch = url.pathname.match(/^\/api\/v1\/me\/credentials\/(CRED-[A-Z0-9-]+)\/progress$/);
      if (req.method === 'GET' && credentialProgressMatch) {
        route = 'GET /api/v1/me/credentials/:credentialId/progress';
        const auth = authorizeRequest(resolvedAuthorize, req, 'learner:read', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.listCredentialEvidence !== 'function') return json(res, 503, { error: 'learner-evidence-persistence-unavailable', requestId });
        const credential = loadCredentialDefinition(credentialProgressMatch[1]);
        if (!credential) return json(res, 404, { error: 'credential-definition-not-found', requestId });
        const course = loadCourseDefinition(credential.course);
        if (!course) return json(res, 500, { error: 'credential-course-not-found', requestId });
        const evidence = await learnerStore.listCredentialEvidence(auth.subject, { credentialDefinitionId: credential.id });
        const performanceDefinitions = loadRequiredPerformanceDefinitions({ root, credential });
        return json(res, 200, credentialProgressView(credential, course, evidence, performanceDefinitions));
      }

      const lessonProgressMatch = url.pathname.match(/^\/api\/v1\/me\/lessons\/(LESSON-[A-Z0-9-]+)$/);
      if (req.method === 'PUT' && lessonProgressMatch) {
        route = 'PUT /api/v1/me/lessons/:lessonId';
        const auth = authorizeRequest(resolvedAuthorize, req, 'learner:write', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.setLessonProgress !== 'function') return json(res, 503, { error: 'learner-persistence-unavailable', requestId });
        let body;
        try { body = await readJsonBody(req); }
        catch (error) { return json(res, error.message === 'request-body-too-large' ? 413 : 400, { error: error.message, requestId }); }
        const lessonVersion = String(body.lessonVersion ?? '').trim();
        const status = String(body.status ?? '').trim();
        if (!isValidCurriculumVersion(lessonVersion) || !['not-started', 'in-progress', 'completed'].includes(status)) return json(res, 400, { error: 'invalid-lesson-progress', requestId });
        const lesson = loadLessonDefinition(lessonProgressMatch[1]);
        if (!lesson) return json(res, 404, { error: 'lesson-not-found', requestId });
        if (String(lesson.version) !== lessonVersion) return json(res, 409, { error: 'lesson-version-mismatch', currentVersion: String(lesson.version), requestId });
        const progress = await learnerStore.setLessonProgress(auth.subject, { lessonId: lesson.id, lessonVersion, status });
        return json(res, 200, { progress });
      }

      if (req.method === 'POST' && url.pathname === '/api/v1/admin/performance-assessments/results') {
        route = 'POST /api/v1/admin/performance-assessments/results';
        const auth = authorizeRequest(resolvedAuthorize, req, 'assessor:write', res, requestId);
        if (!auth) return;
        if (!learnerStore || typeof learnerStore.recordPerformanceAssessmentResult !== 'function') {
          return json(res, 503, { error: 'performance-evidence-persistence-unavailable', requestId });
        }
        let body;
        try { body = await readJsonBody(req); }
        catch (error) { return json(res, error.message === 'request-body-too-large' ? 413 : 400, { error: error.message, requestId }); }

        const learnerSubject = String(body.learnerSubject ?? '').trim();
        const assessmentId = String(body.assessmentId ?? '').trim();
        const assessmentVersion = String(body.assessmentVersion ?? '').trim();
        const deliveryMode = String(body.deliveryMode ?? '').trim();
        const scorePercent = Number(body.scorePercent);
        const criticalErrorCount = Number(body.criticalErrorCount ?? 0);
        if (!learnerSubject) return json(res, 400, { error: 'learner-subject-required', requestId });
        const definition = loadPerformanceDefinition({ root, assessmentId });
        if (!definition) return json(res, 404, { error: 'performance-assessment-not-found', requestId });
        if (assessmentVersion !== String(definition.version)) {
          return json(res, 409, { error: 'performance-assessment-version-mismatch', currentVersion: String(definition.version), requestId });
        }
        if (!Number.isFinite(scorePercent) || scorePercent < 0 || scorePercent > 100) return json(res, 400, { error: 'invalid-performance-score', requestId });
        if (!Number.isInteger(criticalErrorCount) || criticalErrorCount < 0) return json(res, 400, { error: 'invalid-critical-error-count', requestId });
        if (!(definition.deliveryModes ?? []).includes(deliveryMode)) return json(res, 400, { error: 'unsupported-performance-delivery-mode', requestId });
        if (body.evidence !== undefined && (!body.evidence || typeof body.evidence !== 'object' || Array.isArray(body.evidence))) {
          return json(res, 400, { error: 'invalid-performance-evidence', requestId });
        }

        const minimum = Number(definition.passingStandard?.minimumPercent ?? 0);
        const requiresNoCriticalErrors = definition.passingStandard?.noCriticalErrors === true;
        const status = scorePercent >= minimum && (!requiresNoCriticalErrors || criticalErrorCount === 0) ? 'passed' : 'failed';
        const result = await learnerStore.recordPerformanceAssessmentResult(learnerSubject, {
          assessmentId: definition.id,
          assessmentVersion: String(definition.version),
          status,
          scorePercent,
          criticalErrorCount,
          evidence: body.evidence ?? {},
          evaluatorId: auth.subject,
          rubricId: definition.id,
          rubricVersion: String(definition.version),
          deliveryMode
        });
        return json(res, 201, { result: learnerPerformanceView(result) });
      }

      const credentialMatch = url.pathname.match(/^\/api\/v1\/credentials\/([A-Za-z0-9_-]+)$/);
      if (req.method === 'GET' && credentialMatch) {
        route = 'GET /api/v1/credentials/:verificationId';
        const record = await resolvedCredentialStore.getByVerificationId(credentialMatch[1]);
        if (!record) return json(res, 404, { error: 'credential-not-found', requestId });
        const definitionId = record.credentialDefinitionId ?? record.credentialDefinition ?? (record.courseId === 'COURSE-CULT-FOUNDATIONS-001' ? 'CRED-CULT-FOUNDATIONS-001' : null);
        const definition = loadCredentialDefinition(definitionId);
        if (!definition) return json(res, 500, { error: 'credential-definition-not-found', requestId });
        const statusHistory = typeof resolvedCredentialStore.listStatusHistoryByVerificationId === 'function'
          ? await resolvedCredentialStore.listStatusHistoryByVerificationId(credentialMatch[1])
          : [];
        return json(res, 200, publicCredentialView(record, definition, { statusHistory }));
      }

      const adminCredentialHistoryMatch = url.pathname.match(/^\/api\/v1\/admin\/credentials\/([A-Za-z0-9_-]+)\/history$/);
      if (req.method === 'GET' && adminCredentialHistoryMatch) {
        route = 'GET /api/v1/admin/credentials/:verificationId/history';
        const auth = authorizeRequest(resolvedAuthorize, req, 'admin:read', res, requestId);
        if (!auth) return;
        if (typeof resolvedCredentialStore.listStatusHistoryByVerificationId !== 'function') return json(res, 503, { error: 'credential-history-unavailable', requestId });
        const record = await resolvedCredentialStore.getByVerificationId(adminCredentialHistoryMatch[1]);
        if (!record) return json(res, 404, { error: 'credential-not-found', requestId });
        const history = await resolvedCredentialStore.listStatusHistoryByVerificationId(adminCredentialHistoryMatch[1]);
        return json(res, 200, { verificationId: record.verificationId, credentialDefinitionId: record.credentialDefinitionId ?? null, status: record.status, history });
      }

      const adminCredentialStatusMatch = url.pathname.match(/^\/api\/v1\/admin\/credentials\/([A-Za-z0-9_-]+)\/status$/);
      if (req.method === 'POST' && adminCredentialStatusMatch) {
        route = 'POST /api/v1/admin/credentials/:verificationId/status';
        const auth = authorizeRequest(resolvedAuthorize, req, 'admin:write', res, requestId);
        if (!auth) return;
        if (!credentialWriter || typeof credentialWriter.transitionById !== 'function') return json(res, 503, { error: 'credential-writer-unavailable', requestId });
        const record = await resolvedCredentialStore.getByVerificationId(adminCredentialStatusMatch[1]);
        if (!record) return json(res, 404, { error: 'credential-not-found', requestId });
        let body;
        try { body = await readJsonBody(req); }
        catch (error) { return json(res, error.message === 'request-body-too-large' ? 413 : 400, { error: error.message, requestId }); }
        const nextStatus = String(body.status ?? '').trim();
        const reason = body.reason == null ? null : String(body.reason).trim();
        if (!['valid','suspended','superseded','expired','revoked'].includes(nextStatus)) return json(res, 400, { error: 'invalid-credential-status', requestId });
        try {
          const transition = await credentialWriter.transitionById(record.id, nextStatus, { actorId: auth.subject, reason });
          return json(res, 200, { verificationId: record.verificationId, credential: transition.credential, event: transition.event });
        } catch (error) {
          if (/Invalid credential transition/.test(String(error?.message ?? ''))) return json(res, 409, { error: 'invalid-credential-transition', requestId });
          throw error;
        }
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/admin/diagnostics') {
        route = 'GET /api/v1/admin/diagnostics';
        const auth = authorizeRequest(resolvedAuthorize, req, 'admin:read', res, requestId);
        if (!auth) return;
        return json(res, 200, {
          ok: true,
          service: 'thc-academy-api',
          storageAdapter: resolvedCredentialStore.kind ?? 'unknown',
          learnerStorageAdapter: learnerStore?.kind ?? null,
          credentialCount: typeof resolvedCredentialStore.count === 'function' ? await resolvedCredentialStore.count() : null,
          authenticatedSubject: auth.subject,
          requestId
        });
      }
      route = `${req.method ?? 'UNKNOWN'} unmatched`;
      return json(res, 404, { error: 'not-found', requestId });
    } catch (error) {
      const dependencyUnavailable = isPersistenceUnavailableError(error);
      logger({ level: 'error', event: 'http.request.failed', requestId, method: req.method, route, statusCode: dependencyUnavailable ? 503 : 500, errorType: error?.name ?? 'Error', errorCode: error?.code ?? 'UNEXPECTED_ERROR' });
      if (!res.headersSent) return json(res, dependencyUnavailable ? 503 : 500, { error: dependencyUnavailable ? 'service-unavailable' : 'internal-error', requestId });
      res.destroy();
    }
  };
}

export function createApiServer(options = {}) { return http.createServer(createHandler(options)); }
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  const apiOptions = await loadProductionApiOptions(process.env);
  createApiServer(apiOptions).listen(port, () => {
    process.stdout.write(`${JSON.stringify({ level: 'info', event: 'api.started', port, mode: process.env.NODE_ENV === 'production' ? 'production' : 'development' })}\n`);
  });
}
