import http from 'node:http';
import crypto from 'node:crypto';
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
function buildPublicReleaseIds({ modules, assessments }) {
  const ids = new Set();
  const releases = readDirJson('content/public-releases').filter((release) => release.publicationState === 'published');
  for (const release of releases) {
    if (release.courseId) ids.add(release.courseId);
    for (const moduleId of release.publicScope?.modules ?? []) {
      ids.add(moduleId);
      const module = modules.get(moduleId);
      for (const lessonId of module?.lessons ?? []) ids.add(lessonId);
    }
    for (const assessmentId of release.publicScope?.assessments ?? []) {
      ids.add(assessmentId);
      const assessment = assessments.get(assessmentId);
      for (const itemId of assessment?.items ?? []) ids.add(itemId);
    }
  }
  return ids;
}
function isVisible(object, previewDrafts, publicReleaseIds = new Set()) {
  return object?.status === 'published' || publicReleaseIds.has(object?.id) || previewDrafts;
}
function publicStatus(object, publicReleaseIds = new Set()) {
  return publicReleaseIds.has(object?.id) ? 'published' : object?.status;
}
function safeLesson(lesson, publicReleaseIds = new Set()) {
  const sourceContent = lesson.content ?? {};
  const blocks = Array.isArray(sourceContent.blocks) && sourceContent.blocks.length
    ? sourceContent.blocks
    : (sourceContent.sections ?? [])
        .filter((section) => section && typeof section.title === 'string' && typeof section.body === 'string')
        .map((section) => ({
          type: 'text',
          title: section.title,
          body: section.body,
          ...(Array.isArray(section.references) && section.references.length ? { references: section.references } : {})
        }));
  return {
    id: lesson.id,
    title: lesson.title,
    version: lesson.version,
    status: publicStatus(lesson, publicReleaseIds),
    competencies: lesson.competencies ?? [],
    learningObjectives: lesson.learningObjectives ?? lesson.objectives ?? [],
    estimatedMinutes: lesson.estimatedMinutes ?? null,
    references: lesson.references ?? [],
    content: { ...sourceContent, blocks }
  };
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function stringValue(value) { return typeof value === 'string' ? value : undefined; }
function referenceList(value) { return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : undefined; }
function safeStepItems(value) {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item) => item && typeof item === 'object' && typeof item.body === 'string').map((item) => ({
    ...(typeof item.title === 'string' ? { title: item.title } : {}),
    body: item.body
  }));
}
function safeComparisonSide(value) {
  if (!value || typeof value !== 'object' || typeof value.label !== 'string' || typeof value.body !== 'string') return undefined;
  const side = { label: value.label, body: value.body };
  if (typeof value.image === 'string' && value.image.startsWith('/assets/')) side.image = value.image;
  if (typeof value.alt === 'string') side.alt = value.alt;
  return side;
}
function safeDocumentFields(value) {
  if (!Array.isArray(value)) return undefined;
  return value.filter((field) => field && typeof field === 'object' && typeof field.label === 'string' && typeof field.value === 'string').map((field) => ({ label: field.label, value: field.value }));
}

export function sanitizeAssessmentStimulus(blocks) {
  if (!Array.isArray(blocks)) return [];
  const sanitized = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object' || typeof block.type !== 'string') continue;
    const references = referenceList(block.references);
    if (block.type === 'text' && typeof block.body === 'string') {
      sanitized.push({ type: 'text', ...(stringValue(block.title) ? { title: block.title } : {}), body: block.body, ...(references?.length ? { references } : {}) });
    } else if (block.type === 'callout' && typeof block.body === 'string') {
      sanitized.push({ type: 'callout', ...(stringValue(block.title) ? { title: block.title } : {}), body: block.body, ...(typeof block.tone === 'string' ? { tone: block.tone } : {}), ...(references?.length ? { references } : {}) });
    } else if (block.type === 'image' && typeof block.src === 'string' && block.src.startsWith('/assets/') && typeof block.alt === 'string') {
      sanitized.push({ type: 'image', src: block.src, alt: block.alt, ...(stringValue(block.assetId) ? { assetId: block.assetId } : {}), ...(stringValue(block.caption) ? { caption: block.caption } : {}), ...(stringValue(block.credit) ? { credit: block.credit } : {}), ...(references?.length ? { references } : {}) });
    } else if (block.type === 'steps' && typeof block.title === 'string') {
      const items = safeStepItems(block.items ?? block.steps);
      if (items?.length) sanitized.push({ type: 'steps', title: block.title, items, ...(references?.length ? { references } : {}) });
    } else if (block.type === 'comparison') {
      const left = safeComparisonSide(block.left);
      const right = safeComparisonSide(block.right);
      if (left && right) sanitized.push({ type: 'comparison', ...(stringValue(block.title) ? { title: block.title } : {}), left, right, ...(references?.length ? { references } : {}) });
    } else if (block.type === 'table' && Array.isArray(block.columns) && Array.isArray(block.rows)) {
      const columns = block.columns.filter((column) => typeof column === 'string');
      const rows = block.rows.filter(Array.isArray).map((row) => row.map((cell) => String(cell ?? '')));
      if (columns.length) sanitized.push({ type: 'table', ...(stringValue(block.title) ? { title: block.title } : {}), ...(stringValue(block.caption) ? { caption: block.caption } : {}), columns, rows, ...(references?.length ? { references } : {}) });
    } else if (block.type === 'document' && typeof block.title === 'string') {
      const fields = safeDocumentFields(block.fields);
      if (fields?.length) sanitized.push({ type: 'document', title: block.title, fields, ...(stringValue(block.description) ? { description: block.description } : {}), ...(stringValue(block.note) ? { note: block.note } : {}), ...(references?.length ? { references } : {}) });
    } else if (block.type === 'resource' && typeof block.title === 'string') {
      const resource = { type: 'resource', title: block.title };
      if (typeof block.body === 'string') resource.body = block.body;
      if (typeof block.href === 'string') resource.href = block.href;
      if (typeof block.label === 'string') resource.label = block.label;
      if (references?.length) resource.references = references;
      sanitized.push(resource);
    } else if (block.type === 'divider') {
      sanitized.push({ type: 'divider' });
    }
  }
  return sanitized;
}

function preparePracticeItem(item, seed) {
  const pairs = item.choices.map((choice, index) => ({ choice, sourceIndex: index }));
  const random = seededRandom(`${seed}:${item.id}`);
  for (let index = pairs.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pairs[index], pairs[swapIndex]] = [pairs[swapIndex], pairs[index]];
  }
  const correctIndex = pairs.findIndex((pair) => pair.sourceIndex === item.correct);
  const stimulus = sanitizeAssessmentStimulus(item.stimulus);
  const presentation = {
    id: item.id,
    competency: item.competency,
    objective: item.objective ?? null,
    stem: item.stem,
    ...(stimulus.length ? { stimulus } : {}),
    choices: pairs.map((pair) => pair.choice),
    difficulty: item.difficulty
  };
  return { presentation, correctIndex, rationale: item.rationale ?? '' };
}

export function presentPracticeItem(item, seed) {
  return preparePracticeItem(item, seed).presentation;
}

function gradePracticeItem(item, seed, selectedIndex) {
  if (!Number.isInteger(selectedIndex)) return null;
  const prepared = preparePracticeItem(item, seed);
  if (selectedIndex < 0 || selectedIndex >= prepared.presentation.choices.length) return null;
  return {
    itemId: item.id,
    isCorrect: selectedIndex === prepared.correctIndex,
    correctChoice: prepared.presentation.choices[prepared.correctIndex],
    rationale: prepared.rationale
  };
}

function validPracticeSeed(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(value);
}
function normalizePracticeSeed(value) {
  if (validPracticeSeed(value)) return value;
  return crypto.randomUUID();
}

export function buildAcademyCatalog({ previewDrafts = true } = {}) {
  const courses = new Map(readDirJson('content/courses').map((item) => [item.id, item]));
  const modules = new Map(readDirJson('content/modules').map((item) => [item.id, item]));
  const lessons = new Map(readDirJson('content/lessons').map((item) => [item.id, item]));
  const assessments = new Map(readDirJson('content/assessments').map((item) => [item.id, item]));
  const credentialPrograms = new Map(readDirJson('content/credential-programs').map((item) => [item.id, item]));
  const publicReleaseIds = buildPublicReleaseIds({ modules, assessments });
  const safeStringList = (value) => Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim()) : [];
  const safeFinalAssessment = (course) => {
    if (typeof course.finalAssessment !== 'string') return null;
    const assessment = assessments.get(course.finalAssessment);
    if (!assessment || !isVisible(assessment, previewDrafts, publicReleaseIds)) return null;
    return {
      id: assessment.id,
      title: assessment.title,
      status: publicStatus(assessment, publicReleaseIds),
      purpose: assessment.purpose,
      passingScorePercent: Number(assessment.passingScorePercent ?? 0),
      feedbackMode: assessment.feedbackMode ?? 'after-submit',
      itemCount: Array.isArray(assessment.items) ? assessment.items.length : 0,
      academicPracticalRequired: typeof assessment.extensions?.linkedPerformanceAssessment === 'string',
      linkedAcademicPracticalId: assessment.extensions?.linkedPerformanceAssessment ?? null,
      certificationUseStatus: assessment.extensions?.certificationUseStatus ?? null
    };
  };
  const safePathway = (course) => {
    const programId = course.extensions?.credentialPath;
    const program = typeof programId === 'string' ? credentialPrograms.get(programId) : null;
    if (!program) return null;
    return {
      id: program.id,
      title: program.title,
      status: program.status ?? 'draft',
      targetRoles: safeStringList(program.targetRoles),
      proficiencyTarget: safeStringList(program.proficiencyTarget),
      prerequisiteCredentials: safeStringList(program.prerequisiteCredentials).map((id) => {
        const prerequisite = credentialPrograms.get(id);
        return { id, title: prerequisite?.title ?? id, status: prerequisite?.status ?? 'draft' };
      })
    };
  };
  const visibleCourses = [...courses.values()].filter((course) => isVisible(course, previewDrafts, publicReleaseIds)).sort((a, b) => String(a.title).localeCompare(String(b.title))).map((course) => ({
    id: course.id,
    title: course.title,
    version: course.version,
    status: publicStatus(course, publicReleaseIds),
    credentialBearing: Boolean(course.credentialBearing),
    description: course.description ?? course.summary ?? '',
    level: typeof course.level === 'string' ? course.level : null,
    estimatedMinutes: Number.isFinite(Number(course.estimatedMinutes)) ? Number(course.estimatedMinutes) : null,
    learningOutcomes: safeStringList(course.learningOutcomes),
    intendedAudience: safeStringList(course.intendedAudience),
    prerequisites: safeStringList(course.prerequisites),
    pathway: safePathway(course),
    finalAssessment: safeFinalAssessment(course),
    modules: (course.modules ?? []).map((moduleId) => modules.get(moduleId)).filter((module) => module && isVisible(module, previewDrafts, publicReleaseIds)).map((module) => ({
      id: module.id, title: module.title, status: publicStatus(module, publicReleaseIds), assessment: module.assessment ?? null,
      lessons: (module.lessons ?? []).map((lessonId) => lessons.get(lessonId)).filter((lesson) => lesson && isVisible(lesson, previewDrafts, publicReleaseIds)).map((lesson) => ({ id: lesson.id, title: lesson.title, status: publicStatus(lesson, publicReleaseIds), estimatedMinutes: lesson.estimatedMinutes ?? null }))
    }))
  }));
  return { mode: previewDrafts ? 'staging-preview' : 'published-only', generatedAt: new Date().toISOString(), courses: visibleCourses };
}

function isDownloadVisible(download, previewDrafts) {
  return previewDrafts || (download?.status === 'published' && download?.releaseStatus === 'public');
}

function safeDownload(download) {
  const strings = (value) => Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim()) : [];
  return {
    id: download.id,
    title: download.title,
    version: download.version,
    status: download.status,
    releaseStatus: download.releaseStatus,
    kind: download.kind,
    format: download.format,
    description: download.description,
    path: download.path,
    accessibilityStatus: download.accessibilityStatus,
    courseMappings: strings(download.courseMappings),
    resourceMappings: strings(download.resourceMappings),
    instructions: strings(download.instructions),
    limitations: strings(download.limitations)
  };
}

export function buildDownloadCatalog({ previewDrafts = true } = {}) {
  const downloads = readDirJson('content/downloads')
    .filter((download) => isDownloadVisible(download, previewDrafts))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)))
    .map(safeDownload);
  return { mode: previewDrafts ? 'staging-preview' : 'published-only', generatedAt: new Date().toISOString(), downloads };
}

export function loadPublicDownload(id, { previewDrafts = true } = {}) {
  if (!/^DL-[A-Z0-9-]+$/.test(id)) return null;
  const target = path.join(root, 'content/downloads', `${id}.json`);
  if (!fs.existsSync(target)) return null;
  const download = JSON.parse(fs.readFileSync(target, 'utf8'));
  return isDownloadVisible(download, previewDrafts) ? safeDownload(download) : null;
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
  const modules = new Map(readDirJson('content/modules').map((item) => [item.id, item]));
  const assessments = new Map(readDirJson('content/assessments').map((item) => [item.id, item]));
  const publicReleaseIds = buildPublicReleaseIds({ modules, assessments });
  const lesson = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (!isVisible(lesson, previewDrafts, publicReleaseIds)) return null;
  return safeLesson(lesson, publicReleaseIds);
}

function loadLessonPracticeSourceItems(id, { previewDrafts = true } = {}) {
  if (!/^LESSON-[A-Z0-9-]+$/.test(id)) return [];
  const target = path.join(root, 'content/lessons', `${id}.json`);
  if (!fs.existsSync(target)) return [];
  const modules = new Map(readDirJson('content/modules').map((item) => [item.id, item]));
  const assessments = new Map(readDirJson('content/assessments').map((item) => [item.id, item]));
  const publicReleaseIds = buildPublicReleaseIds({ modules, assessments });
  const lesson = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (!isVisible(lesson, previewDrafts, publicReleaseIds)) return [];
  const competencies = new Set(lesson.competencies ?? []);
  const objectives = new Set(lesson.learningObjectives ?? lesson.objectives ?? []);
  return readDirJson('content/questions')
    .filter((item) => item.purpose === 'formative' && competencies.has(item.competency) && isVisible(item, previewDrafts, publicReleaseIds))
    .filter((item) => objectives.size === 0 || !item.objective || objectives.has(item.objective))
    .filter((item) => Array.isArray(item.choices) && item.choices.length >= 2 && Number.isInteger(item.correct) && item.correct >= 0 && item.correct < item.choices.length);
}

export function loadLessonPracticeItems(id, { previewDrafts = true, seed = 'practice' } = {}) {
  return loadLessonPracticeSourceItems(id, { previewDrafts }).map((item) => presentPracticeItem(item, seed));
}

export function gradeLessonPracticeItem(id, { itemId, selectedIndex, seed, previewDrafts = true } = {}) {
  if (!validPracticeSeed(seed) || typeof itemId !== 'string') return null;
  const item = loadLessonPracticeSourceItems(id, { previewDrafts }).find((entry) => entry.id === itemId);
  return item ? gradePracticeItem(item, seed, selectedIndex) : null;
}

function loadModuleAssessmentSource(id, { previewDrafts = true } = {}) {
  if (!/^MOD-[A-Z0-9-]+$/.test(id)) return null;
  const modules = new Map(readDirJson('content/modules').map((item) => [item.id, item]));
  const assessments = new Map(readDirJson('content/assessments').map((item) => [item.id, item]));
  const publicReleaseIds = buildPublicReleaseIds({ modules, assessments });
  const module = modules.get(id);
  if (!module || !isVisible(module, previewDrafts, publicReleaseIds) || !module.assessment) return null;
  const assessment = assessments.get(module.assessment);
  if (!assessment || assessment.purpose !== 'formative' || !isVisible(assessment, previewDrafts, publicReleaseIds)) return null;
  const questions = new Map(readDirJson('content/questions').map((item) => [item.id, item]));
  const items = [];
  for (const itemId of assessment.items ?? []) {
    const item = questions.get(itemId);
    if (!item || item.purpose !== 'formative' || !isVisible(item, previewDrafts, publicReleaseIds)) return null;
    if (!Array.isArray(item.choices) || item.choices.length < 2 || !Number.isInteger(item.correct) || item.correct < 0 || item.correct >= item.choices.length) return null;
    items.push(item);
  }
  return { module, assessment, items, publicReleaseIds };
}

export function loadModuleAssessment(id, { previewDrafts = true, seed = 'module-checkpoint' } = {}) {
  const source = loadModuleAssessmentSource(id, { previewDrafts });
  if (!source) return null;
  const { module, assessment, items, publicReleaseIds } = source;
  return {
    module: { id: module.id, title: module.title, version: module.version, status: publicStatus(module, publicReleaseIds) },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      version: assessment.version,
      status: publicStatus(assessment, publicReleaseIds),
      purpose: assessment.purpose,
      passingScorePercent: Number(assessment.passingScorePercent ?? 0),
      feedbackMode: assessment.feedbackMode ?? 'immediate',
      totalItems: items.length
    },
    presentationSeed: seed,
    items: items.map((item) => presentPracticeItem(item, seed))
  };
}

export function gradeModuleAssessmentItem(id, { itemId, selectedIndex, seed, previewDrafts = true } = {}) {
  if (!validPracticeSeed(seed) || typeof itemId !== 'string') return null;
  const source = loadModuleAssessmentSource(id, { previewDrafts });
  if (!source) return null;
  const item = source.items.find((entry) => entry.id === itemId);
  return item ? gradePracticeItem(item, seed, selectedIndex) : null;
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
function readRequestJson(req, maxBytes = 16384) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      bytes += chunk.length;
      if (bytes > maxBytes) {
        settled = true;
        reject(new Error('request-body-too-large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('invalid-json'));
      }
    });
    req.on('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

export function buildPublicBuildIdentity(env = process.env) {
  const sourceCandidates = [
    env.ACADEMY_SOURCE_SHA,
    env.GITHUB_SHA,
    env.CF_PAGES_COMMIT_SHA,
    env.VERCEL_GIT_COMMIT_SHA,
    env.RENDER_GIT_COMMIT,
    env.SOURCE_VERSION
  ];
  const buildCandidates = [
    env.ACADEMY_BUILD_ID,
    env.BUILD_ID,
    env.CF_PAGES_BRANCH && env.CF_PAGES_COMMIT_SHA ? `cloudflare:${env.CF_PAGES_BRANCH}` : null,
    env.VERCEL_DEPLOYMENT_ID,
    env.RENDER_SERVICE_ID
  ];
  const sourceSha = sourceCandidates
    .map((value) => typeof value === 'string' ? value.trim() : '')
    .find((value) => /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value)) ?? null;
  const buildId = buildCandidates
    .map((value) => typeof value === 'string' ? value.trim() : '')
    .find((value) => value.length > 0 && value.length <= 160 && /^[A-Za-z0-9._:@/-]+$/.test(value)) ?? null;
  return {
    service: 'thc-academy-web',
    buildId,
    sourceSha,
    exactIdentityAvailable: Boolean(buildId && sourceSha)
  };
}

export function createAcademyHandler({ env = process.env, apiHandler } = {}) {
  const previewDrafts = env.NODE_ENV !== 'production' && env.ACADEMY_PREVIEW_DRAFTS !== '0';
  let api = apiHandler;
  if (!api && env.NODE_ENV !== 'production') {
    try { api = createApiHandler({ env }); } catch { api = null; }
  }
  return async function handler(req, res) {
    let url; try { url = new URL(req.url, 'http://localhost'); } catch { return json(res, 400, { error: 'invalid-url' }); }
    if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { ok: true, service: 'thc-academy-web', mode: previewDrafts ? 'staging-preview' : 'published-only' });
    if (req.method === 'GET' && url.pathname === '/api/build-info') return json(res, 200, buildPublicBuildIdentity(env));
    if (req.method === 'GET' && url.pathname === '/api/catalog') return json(res, 200, buildAcademyCatalog({ previewDrafts }));
    if (req.method === 'GET' && url.pathname === '/api/downloads') return json(res, 200, buildDownloadCatalog({ previewDrafts }));
    const downloadMetadataMatch = url.pathname.match(/^\/api\/downloads\/(DL-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && downloadMetadataMatch) {
      const download = loadPublicDownload(downloadMetadataMatch[1], { previewDrafts });
      return download ? json(res, 200, download) : json(res, 404, { error: 'download-not-found' });
    }
    if (req.method === 'GET' && url.pathname === '/api/staging/governance') return previewDrafts ? json(res, 200, buildStagingGovernanceSummary()) : json(res, 404, { error: 'not-found' });
    const lessonMatch = url.pathname.match(/^\/api\/lessons\/(LESSON-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && lessonMatch) { const lesson = loadPublicLesson(lessonMatch[1], { previewDrafts }); return lesson ? json(res, 200, lesson) : json(res, 404, { error: 'lesson-not-found' }); }
    const practiceMatch = url.pathname.match(/^\/api\/lessons\/(LESSON-[A-Z0-9-]+)\/practice$/);
    if (req.method === 'GET' && practiceMatch) {
      const presentationSeed = normalizePracticeSeed(url.searchParams.get('seed'));
      return json(res, 200, { lessonId: practiceMatch[1], presentationSeed, items: loadLessonPracticeItems(practiceMatch[1], { previewDrafts, seed: presentationSeed }) });
    }
    const practiceGradeMatch = url.pathname.match(/^\/api\/lessons\/(LESSON-[A-Z0-9-]+)\/practice\/grade$/);
    if (req.method === 'POST' && practiceGradeMatch) {
      let body;
      try { body = await readRequestJson(req); } catch (error) { return json(res, 400, { error: error.message === 'request-body-too-large' ? 'request-body-too-large' : 'invalid-json' }); }
      if (typeof body.itemId !== 'string' || !Number.isInteger(body.selectedIndex) || !validPracticeSeed(body.presentationSeed)) return json(res, 400, { error: 'invalid-practice-response' });
      const result = gradeLessonPracticeItem(practiceGradeMatch[1], { itemId: body.itemId, selectedIndex: body.selectedIndex, seed: body.presentationSeed, previewDrafts });
      return result ? json(res, 200, result) : json(res, 404, { error: 'practice-item-not-found' });
    }
    const moduleAssessmentMatch = url.pathname.match(/^\/api\/modules\/(MOD-[A-Z0-9-]+)\/assessment$/);
    if (req.method === 'GET' && moduleAssessmentMatch) {
      const presentationSeed = normalizePracticeSeed(url.searchParams.get('seed'));
      const payload = loadModuleAssessment(moduleAssessmentMatch[1], { previewDrafts, seed: presentationSeed });
      return payload ? json(res, 200, payload) : json(res, 404, { error: 'module-assessment-not-found' });
    }
    const moduleGradeMatch = url.pathname.match(/^\/api\/modules\/(MOD-[A-Z0-9-]+)\/assessment\/grade$/);
    if (req.method === 'POST' && moduleGradeMatch) {
      let body;
      try { body = await readRequestJson(req); } catch (error) { return json(res, 400, { error: error.message === 'request-body-too-large' ? 'request-body-too-large' : 'invalid-json' }); }
      if (typeof body.itemId !== 'string' || !Number.isInteger(body.selectedIndex) || !validPracticeSeed(body.presentationSeed)) return json(res, 400, { error: 'invalid-assessment-response' });
      const result = gradeModuleAssessmentItem(moduleGradeMatch[1], { itemId: body.itemId, selectedIndex: body.selectedIndex, seed: body.presentationSeed, previewDrafts });
      return result ? json(res, 200, result) : json(res, 404, { error: 'assessment-item-not-found' });
    }
    if (api && (url.pathname.startsWith('/api/v1/') || url.pathname === '/readyz')) return api(req, res);

    const staticFiles = new Map([
      ['/', ['index.html', 'text/html; charset=utf-8']], ['/academy', ['index.html', 'text/html; charset=utf-8']],
      ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/progress.js', ['progress.js', 'text/javascript; charset=utf-8']],
      ['/completion-documents.js', ['completion-documents.js', 'text/javascript; charset=utf-8']],
      ['/rich-content.js', ['rich-content.js', 'text/javascript; charset=utf-8']],
      ['/governance.js', ['governance.js', 'text/javascript; charset=utf-8']], ['/portal.js', ['portal.js', 'text/javascript; charset=utf-8']],
      ['/course-assessment.js', ['course-assessment.js', 'text/javascript; charset=utf-8']], ['/assessor.js', ['assessor.js', 'text/javascript; charset=utf-8']],
      ['/styles.css', ['styles.css', 'text/css; charset=utf-8']], ['/rich-content.css', ['rich-content.css', 'text/css; charset=utf-8']],
      ['/governance.css', ['governance.css', 'text/css; charset=utf-8']], ['/portal.css', ['portal.css', 'text/css; charset=utf-8']],
      ['/course-assessment.css', ['course-assessment.css', 'text/css; charset=utf-8']], ['/assessor.css', ['assessor.css', 'text/css; charset=utf-8']]
    ]);
    if ((req.method === 'GET' || req.method === 'HEAD') && staticFiles.has(url.pathname)) {
      const [file, type] = staticFiles.get(url.pathname);
      if (sendStatic(res, file, type, req.method)) return;
    }

    const courseAssetMatch = url.pathname.match(/^\/assets\/(course\d+)\/([A-Za-z0-9._-]+\.(?:svg|png|webp|jpe?g))$/i);
    if ((req.method === 'GET' || req.method === 'HEAD') && courseAssetMatch) {
      const assetFile = path.join('assets', courseAssetMatch[1], courseAssetMatch[2]);
      const ext = path.extname(courseAssetMatch[2]).toLowerCase();
      const assetTypes = {
        '.svg': 'image/svg+xml; charset=utf-8',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
      };
      if (sendStatic(res, assetFile, assetTypes[ext], req.method)) return;
    }
    const tech2AssetMatch = url.pathname.match(/^\/assets\/tech2\/(course[1-8])\/([A-Za-z0-9._-]+\.(?:svg|png|webp|jpe?g))$/i);
    if ((req.method === 'GET' || req.method === 'HEAD') && tech2AssetMatch) {
      const assetFile = path.join('assets', 'tech2', tech2AssetMatch[1], tech2AssetMatch[2]);
      const ext = path.extname(tech2AssetMatch[2]).toLowerCase();
      const assetTypes = {
        '.svg': 'image/svg+xml; charset=utf-8',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
      };
      if (sendStatic(res, assetFile, assetTypes[ext], req.method)) return;
    }
    const downloadFileMatch = url.pathname.match(/^\/downloads\/([A-Za-z0-9._-]+\.csv)$/);
    if ((req.method === 'GET' || req.method === 'HEAD') && downloadFileMatch) {
      const source = readDirJson('content/downloads').find((download) => download.path === url.pathname && isDownloadVisible(download, previewDrafts));
      if (source && sendStatic(res, path.join('downloads', downloadFileMatch[1]), 'text/csv; charset=utf-8', req.method)) return;
    }
    return json(res, 404, { error: 'not-found' });
  };
}

export function createAcademyWebServer(options = {}) { return http.createServer(createAcademyHandler(options)); }
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) createAcademyWebServer().listen(port, '0.0.0.0', () => process.stdout.write(`${JSON.stringify({ level: 'info', event: 'academy.web.started', port, url: `http://0.0.0.0:${port}/academy` })}\n`));
