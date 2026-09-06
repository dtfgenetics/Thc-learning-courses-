import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler as createApiHandler } from '../api/src/server.mjs';

const root = process.cwd();
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.ACADEMY_PORT ?? 4173);

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(rel, name)));
}
function isVisible(object, previewDrafts) { return object?.status === 'published' || previewDrafts; }
function safeLesson(lesson) {
  return { id: lesson.id, title: lesson.title, version: lesson.version, status: lesson.status, competencies: lesson.competencies ?? [], learningObjectives: lesson.learningObjectives ?? lesson.objectives ?? [], estimatedMinutes: lesson.estimatedMinutes ?? null, references: lesson.references ?? [], content: lesson.content ?? {} };
}

export function buildAcademyCatalog({ previewDrafts = true } = {}) {
  const courses = new Map(readDirJson('content/courses').map((item) => [item.id, item]));
  const modules = new Map(readDirJson('content/modules').map((item) => [item.id, item]));
  const lessons = new Map(readDirJson('content/lessons').map((item) => [item.id, item]));
  const visibleCourses = [...courses.values()].filter((course) => isVisible(course, previewDrafts)).sort((a, b) => String(a.title).localeCompare(String(b.title))).map((course) => ({
    id: course.id, title: course.title, version: course.version, status: course.status, credentialBearing: Boolean(course.credentialBearing), description: course.description ?? course.summary ?? '',
    modules: (course.modules ?? []).map((moduleId) => modules.get(moduleId)).filter((module) => module && isVisible(module, previewDrafts)).map((module) => ({
      id: module.id, title: module.title, status: module.status,
      lessons: (module.lessons ?? []).map((lessonId) => lessons.get(lessonId)).filter((lesson) => lesson && isVisible(lesson, previewDrafts)).map((lesson) => ({ id: lesson.id, title: lesson.title, status: lesson.status, estimatedMinutes: lesson.estimatedMinutes ?? null }))
    }))
  }));
  return { mode: previewDrafts ? 'staging-preview' : 'published-only', generatedAt: new Date().toISOString(), courses: visibleCourses };
}

export function buildStagingGovernanceSummary() {
  const readiness = readJson('registry/system-readiness.json');
  const reviews = readDirJson('content/reviews');
  const pilots = readDirJson('content/pilot-evidence');
  const lessons = readDirJson('content/lessons');
  const assessments = readDirJson('content/assessments');
  const questions = readDirJson('content/questions');
  const credentialItems = questions.filter((item) => ['summative', 'credential'].includes(item.purpose));
  const approvedReviews = reviews.filter((review) => review.status === 'approved');
  const approvedByType = approvedReviews.reduce((counts, review) => { const type = review.reviewType ?? 'other'; counts[type] = (counts[type] ?? 0) + 1; return counts; }, {});
  const pilotFor = (item, status) => pilots.some((record) => record.itemId === item.id && String(record.itemVersion) === String(item.version) && record.status === status);
  const pilotRegistered = (item) => pilots.some((record) => record.itemId === item.id && String(record.itemVersion) === String(item.version) && record.status !== 'invalidated');
  const assessmentApproved = (item) => reviews.some((review) => review.objectId === item.id && String(review.objectVersion) === String(item.version) && review.reviewType === 'assessment' && review.status === 'approved');
  const productionBlockers = [];
  for (const [areaName, area] of Object.entries(readiness.areas ?? {})) for (const [gateName, value] of Object.entries(area.gates ?? {})) if (value !== true) productionBlockers.push(`${areaName}.${gateName}`);
  return {
    generatedAt: new Date().toISOString(), mode: 'staging-governance',
    inventory: { lessons: lessons.length, assessments: assessments.length, questions: questions.length },
    reviews: { totalRecords: reviews.length, approvedRecords: approvedReviews.length, approvedByType },
    pilot: {
      records: pilots.length,
      completed: pilots.filter((record) => record.status === 'complete').length,
      credentialItems: credentialItems.length,
      itemsWithPilotRecord: credentialItems.filter(pilotRegistered).length,
      itemsWithCompleteEvidence: credentialItems.filter((item) => pilotFor(item, 'complete')).length,
      itemsWithApprovedAssessmentReview: credentialItems.filter(assessmentApproved).length,
      itemsWithActivationEvidenceComplete: credentialItems.filter((item) => pilotFor(item, 'complete') && assessmentApproved(item)).length,
      activeItems: credentialItems.filter((item) => item.status === 'active').length
    },
    readiness: { productionReady: readiness.productionReady === true, productionBlockerCount: productionBlockers.length, productionBlockers }
  };
}

export function loadPublicLesson(id, { previewDrafts = true } = {}) {
  if (!/^LESSON-[A-Z0-9-]+$/.test(id)) return null;
  const target = path.join(root, 'content/lessons', `${id}.json`);
  if (!fs.existsSync(target)) return null;
  const lesson = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (!isVisible(lesson, previewDrafts)) return null;
  return safeLesson(lesson);
}

export function loadLessonPracticeItems(id, { previewDrafts = true } = {}) {
  if (!/^LESSON-[A-Z0-9-]+$/.test(id)) return [];
  const target = path.join(root, 'content/lessons', `${id}.json`);
  if (!fs.existsSync(target)) return [];
  const lesson = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (!isVisible(lesson, previewDrafts)) return [];
  const competencies = new Set(lesson.competencies ?? []);
  return readDirJson('content/questions')
    .filter((item) => item.purpose === 'formative' && competencies.has(item.competency) && isVisible(item, previewDrafts))
    .filter((item) => Array.isArray(item.choices) && Number.isInteger(item.correct))
    .map((item) => ({ id: item.id, competency: item.competency, stem: item.stem, choices: item.choices, correct: item.correct, rationale: item.rationale, difficulty: item.difficulty }));
}

function securityHeaders(res, contentType) {
  res.setHeader('content-type', contentType);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
}
function json(res, status, body) { securityHeaders(res, 'application/json; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.statusCode = status; res.end(JSON.stringify(body)); }
function sendStatic(res, fileName, contentType, method = 'GET') {
  const target = path.join(webRoot, fileName);
  if (!target.startsWith(webRoot) || !fs.existsSync(target)) return false;
  securityHeaders(res, contentType);
  res.setHeader('cache-control', fileName === 'index.html' ? 'no-cache' : 'public, max-age=300');
  res.statusCode = 200;
  if (method === 'HEAD') res.end(); else res.end(fs.readFileSync(target));
  return true;
}

export function createAcademyHandler({ env = process.env, apiHandler } = {}) {
  const previewDrafts = env.NODE_ENV !== 'production' && env.ACADEMY_PREVIEW_DRAFTS !== '0';
  let api = apiHandler;
  if (!api && env.NODE_ENV !== 'production') {
    try { api = createApiHandler({ env }); } catch { api = null; }
  }
  return function handler(req, res) {
    let url; try { url = new URL(req.url, 'http://localhost'); } catch { return json(res, 400, { error: 'invalid-url' }); }
    if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { ok: true, service: 'thc-academy-web', mode: previewDrafts ? 'staging-preview' : 'published-only' });
    if (req.method === 'GET' && url.pathname === '/api/catalog') return json(res, 200, buildAcademyCatalog({ previewDrafts }));
    if (req.method === 'GET' && url.pathname === '/api/staging/governance') return previewDrafts ? json(res, 200, buildStagingGovernanceSummary()) : json(res, 404, { error: 'not-found' });
    const lessonMatch = url.pathname.match(/^\/api\/lessons\/(LESSON-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && lessonMatch) { const lesson = loadPublicLesson(lessonMatch[1], { previewDrafts }); return lesson ? json(res, 200, lesson) : json(res, 404, { error: 'lesson-not-found' }); }
    const practiceMatch = url.pathname.match(/^\/api\/lessons\/(LESSON-[A-Z0-9-]+)\/practice$/);
    if (req.method === 'GET' && practiceMatch) return json(res, 200, { lessonId: practiceMatch[1], items: loadLessonPracticeItems(practiceMatch[1], { previewDrafts }) });
    if (api && (url.pathname.startsWith('/api/v1/') || url.pathname === '/readyz')) return api(req, res);

    const staticFiles = new Map([
      ['/', ['index.html', 'text/html; charset=utf-8']], ['/academy', ['index.html', 'text/html; charset=utf-8']],
      ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/progress.js', ['progress.js', 'text/javascript; charset=utf-8']],
      ['/governance.js', ['governance.js', 'text/javascript; charset=utf-8']], ['/portal.js', ['portal.js', 'text/javascript; charset=utf-8']],
      ['/styles.css', ['styles.css', 'text/css; charset=utf-8']], ['/governance.css', ['governance.css', 'text/css; charset=utf-8']], ['/portal.css', ['portal.css', 'text/css; charset=utf-8']]
    ]);
    if ((req.method === 'GET' || req.method === 'HEAD') && staticFiles.has(url.pathname)) {
      const [file, type] = staticFiles.get(url.pathname);
      if (sendStatic(res, file, type, req.method)) return;
    }
    return json(res, 404, { error: 'not-found' });
  };
}

export function createAcademyWebServer(options = {}) { return http.createServer(createAcademyHandler(options)); }
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) createAcademyWebServer().listen(port, '0.0.0.0', () => process.stdout.write(`${JSON.stringify({ level: 'info', event: 'academy.web.started', port, url: `http://0.0.0.0:${port}/academy` })}\n`));
