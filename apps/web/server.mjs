import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.ACADEMY_PORT ?? 4173);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

function isVisible(object, previewDrafts) {
  return object?.status === 'published' || previewDrafts;
}

function safeLesson(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    version: lesson.version,
    status: lesson.status,
    competencies: lesson.competencies ?? [],
    learningObjectives: lesson.learningObjectives ?? lesson.objectives ?? [],
    estimatedMinutes: lesson.estimatedMinutes ?? null,
    references: lesson.references ?? [],
    content: lesson.content ?? {}
  };
}

export function buildAcademyCatalog({ previewDrafts = true } = {}) {
  const courses = new Map(readDirJson('content/courses').map((item) => [item.id, item]));
  const modules = new Map(readDirJson('content/modules').map((item) => [item.id, item]));
  const lessons = new Map(readDirJson('content/lessons').map((item) => [item.id, item]));

  const visibleCourses = [...courses.values()]
    .filter((course) => isVisible(course, previewDrafts))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)))
    .map((course) => ({
      id: course.id,
      title: course.title,
      version: course.version,
      status: course.status,
      credentialBearing: Boolean(course.credentialBearing),
      description: course.description ?? course.summary ?? '',
      modules: (course.modules ?? [])
        .map((moduleId) => modules.get(moduleId))
        .filter((module) => module && isVisible(module, previewDrafts))
        .map((module) => ({
          id: module.id,
          title: module.title,
          status: module.status,
          lessons: (module.lessons ?? [])
            .map((lessonId) => lessons.get(lessonId))
            .filter((lesson) => lesson && isVisible(lesson, previewDrafts))
            .map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              status: lesson.status,
              estimatedMinutes: lesson.estimatedMinutes ?? null
            }))
        }))
    }));

  return {
    mode: previewDrafts ? 'staging-preview' : 'published-only',
    generatedAt: new Date().toISOString(),
    courses: visibleCourses
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

function securityHeaders(res, contentType) {
  res.setHeader('content-type', contentType);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
}

function json(res, status, body) {
  securityHeaders(res, 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

function sendStatic(res, fileName, contentType) {
  const target = path.join(webRoot, fileName);
  if (!target.startsWith(webRoot) || !fs.existsSync(target)) return false;
  securityHeaders(res, contentType);
  res.setHeader('cache-control', fileName === 'index.html' ? 'no-cache' : 'public, max-age=300');
  res.statusCode = 200;
  res.end(fs.readFileSync(target));
  return true;
}

export function createAcademyHandler({ env = process.env } = {}) {
  const previewDrafts = env.NODE_ENV !== 'production' && env.ACADEMY_PREVIEW_DRAFTS !== '0';

  return function handler(req, res) {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      return json(res, 400, { error: 'invalid-url' });
    }

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return json(res, 200, { ok: true, service: 'thc-academy-web', mode: previewDrafts ? 'staging-preview' : 'published-only' });
    }

    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      return json(res, 200, buildAcademyCatalog({ previewDrafts }));
    }

    const lessonMatch = url.pathname.match(/^\/api\/lessons\/(LESSON-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && lessonMatch) {
      const lesson = loadPublicLesson(lessonMatch[1], { previewDrafts });
      return lesson ? json(res, 200, lesson) : json(res, 404, { error: 'lesson-not-found' });
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/academy')) {
      if (sendStatic(res, 'index.html', 'text/html; charset=utf-8')) return;
    }
    if (req.method === 'GET' && url.pathname === '/app.js') {
      if (sendStatic(res, 'app.js', 'text/javascript; charset=utf-8')) return;
    }
    if (req.method === 'GET' && url.pathname === '/styles.css') {
      if (sendStatic(res, 'styles.css', 'text/css; charset=utf-8')) return;
    }

    return json(res, 404, { error: 'not-found' });
  };
}

export function createAcademyWebServer(options = {}) {
  return http.createServer(createAcademyHandler(options));
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  createAcademyWebServer().listen(port, () => {
    process.stdout.write(`${JSON.stringify({ level: 'info', event: 'academy.web.started', port, url: `http://localhost:${port}/academy` })}\n`);
  });
}
