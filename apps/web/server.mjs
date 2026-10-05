import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler as createApiHandler } from '../api/src/server.mjs';
import { dliFromPpfd } from '../../packages/domain/applied-learning-calculations.mjs';
import { buildCanonicalAppliedLearningGraph } from '../../packages/domain/applied-learning-canonical-graph.mjs';

const root = process.cwd();
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.ACADEMY_PORT ?? 4173);

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(rel, name)));
}

function findAppliedLearningRecord(directory, id) {
  return readDirJson(`content/applied-learning/${directory}`).find((record) => record?.id === id) ?? null;
}
function safeAppliedLearningGraph(graph) {
  return {
    id: graph.id,
    version: graph.version,
    status: graph.status,
    title: graph.title,
    summary: graph.summary ?? '',
    generatedFrom: graph.generatedFrom ?? null,
    nodes: (graph.nodes ?? []).map(({ id, canonicalType, canonicalId, label, domain, kind, status }) => ({
      id, canonicalType, canonicalId,
      ...(label ? { label } : {}),
      ...(domain ? { domain } : {}),
      ...(kind ? { kind } : {}),
      ...(status ? { status } : {})
    })),
    edges: (graph.edges ?? []).map(({ id, source, target, relationship, evidenceIds }) => ({
      id, source, target, relationship,
      ...(Array.isArray(evidenceIds) ? { evidenceIds } : {})
    }))
  };
}
function safeAppliedLearningMeasurement(activity) {
  return {
    id: activity.id,
    version: activity.version,
    status: activity.status,
    title: activity.title,
    summary: activity.summary,
    competencyIds: activity.competencyIds ?? [],
    objectiveIds: activity.objectiveIds ?? [],
    referenceIds: activity.referenceIds ?? [],
    canonicalSources: activity.canonicalSources ?? [],
    steps: (activity.steps ?? []).map(({ id, instruction, evidence }) => ({
      id, instruction, ...(evidence ? { evidence } : {})
    })),
    evidenceFields: (activity.evidenceFields ?? []).map(({ id, label, type, unit, required }) => ({
      id, label, type, unit: unit ?? null, required: required === true
    })),
    safetyBoundary: activity.safetyBoundary
  };
}

function safeAppliedLearningCalculator(calculator) {
  return {
    id: calculator.id,
    version: calculator.version,
    status: calculator.status,
    title: calculator.title,
    summary: calculator.summary,
    calculation: calculator.calculation,
    competencyIds: calculator.competencyIds ?? [],
    objectiveIds: calculator.objectiveIds ?? [],
    referenceIds: calculator.referenceIds ?? [],
    canonicalSources: calculator.canonicalSources ?? [],
    inputFields: calculator.inputFields ?? [],
    output: calculator.output,
    limitations: calculator.limitations ?? []
  };
}
function safeAppliedLearningDifferential(differential) {
  return {
    id: differential.id,
    version: differential.version,
    status: differential.status,
    title: differential.title,
    summary: differential.summary,
    observedPattern: differential.observedPattern,
    competencyIds: differential.competencyIds ?? [],
    referenceIds: differential.referenceIds ?? [],
    canonicalSources: differential.canonicalSources ?? [],
    hypotheses: (differential.hypotheses ?? []).map(({ id, label, whyPlausible, evidenceThatRaisesConfidence, evidenceThatLowersConfidence }) => ({
      id, label, whyPlausible,
      evidenceThatRaisesConfidence: evidenceThatRaisesConfidence ?? [],
      evidenceThatLowersConfidence: evidenceThatLowersConfidence ?? []
    })),
    discriminatingEvidence: differential.discriminatingEvidence ?? [],
    boundary: differential.boundary
  };
}

function safeAppliedLearningTool(tool) {
  return {
    id: tool.id,
    version: tool.version,
    status: tool.status,
    kind: tool.kind,
    title: tool.title,
    summary: tool.summary,
    competencyIds: tool.competencyIds ?? [],
    objectiveIds: tool.objectiveIds ?? [],
    referenceIds: tool.referenceIds ?? [],
    canonicalSources: tool.canonicalSources ?? [],
    steps: (tool.steps ?? []).map(({ id, instruction, evidence }) => ({
      id, instruction, ...(evidence ? { evidence } : {})
    })),
    fields: (tool.fields ?? []).map(({ id, label, type, required, unit, options }) => ({
      id, label, type, required: required === true, unit: unit ?? null,
      ...(Array.isArray(options) ? { options } : {})
    })),
    boundary: tool.boundary
  };
}

function evaluateAppliedLearningTool(tool, body = {}) {
  const values = {};
  for (const field of tool.fields ?? []) {
    const raw = body[field.id];
    if (field.required && (raw === undefined || raw === null || String(raw).trim() === '')) {
      throw new Error(`missing required field ${field.id}`);
    }
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    if (field.type === 'number') {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`${field.id} must be numeric`);
      values[field.id] = value;
    } else if (field.type === 'choice') {
      if (!field.options?.includes(String(raw))) throw new Error(`${field.id} is not an allowed choice`);
      values[field.id] = String(raw);
    } else if (field.type === 'timestamp') {
      const value = String(raw).trim();
      if (!Number.isFinite(Date.parse(value))) throw new Error(`${field.id} must be a valid timestamp`);
      values[field.id] = value;
    } else {
      values[field.id] = String(raw).trim().slice(0, 4000);
    }
  }

  const common = {
    toolId: tool.id,
    kind: tool.kind,
    status: 'learner-draft-record',
    values,
    note: 'Local training record preview only; this endpoint does not create credential evidence or regulated records.'
  };

  if (tool.kind === 'blueprint') {
    const length = values.roomLengthFt;
    const width = values.roomWidthFt;
    if (!(length > 0 && width > 0 && length <= 1000 && width <= 1000)) throw new Error('room dimensions must be positive and within the training range');
    return { ...common, result: { floorAreaSqFt: length * width, verificationRequired: true }, note: tool.boundary };
  }
  if (tool.kind === 'calibration') {
    const decision = values.verificationResult === 'pass'
      ? 'measurement-eligible-for-contextual-interpretation'
      : 'stop-recalibrate-or-service-and-repeat-verification';
    return { ...common, result: { decision, acceptedForDecisionSupport: values.verificationResult === 'pass' }, note: tool.boundary };
  }
  if (tool.kind === 'timeline-atlas') {
    return {
      ...common,
      result: {
        observationRecord: {
          subjectId: values.subjectId,
          timestamp: values.timestamp,
          stage: values.stage,
          observation: values.observation,
          uncertainty: values.uncertainty
        },
        separatesObservationFromCause: true,
        diagnosticConclusionAuthorized: false
      },
      note: tool.boundary
    };
  }
  if (tool.kind === 'flight-recorder') {
    return {
      ...common,
      result: {
        eventRecord: {
          subjectId: values.subjectId,
          timestamp: values.timestamp,
          eventType: values.eventType,
          eventDetail: values.eventDetail,
          nextAction: values.nextAction
        },
        handoffReady: Boolean(values.nextAction),
        chronologyPreserved: true,
        regulatedRecordCreated: false
      },
      note: tool.boundary
    };
  }
  if (tool.kind === 'incident-report') {
    return {
      ...common,
      result: {
        incidentRecord: {
          timestamp: values.timestamp,
          location: values.location,
          facts: values.facts,
          containment: values.containment,
          escalation: values.escalation,
          ...(values.followUp ? { followUp: values.followUp } : {})
        },
        requiredSectionsComplete: Boolean(values.timestamp && values.location && values.facts && values.containment && values.escalation),
        rootCauseAssigned: false
      },
      note: tool.boundary
    };
  }
  if (tool.kind === 'cause-chain') {
    const chain = [
      ['observation', values.observation],
      ['mechanism', values.mechanism],
      ['hypothesis', values.hypothesis],
      ['alternative', values.alternative],
      ['next-evidence', values.nextEvidence],
      ...(values.outcome ? [['outcome', values.outcome]] : [])
    ].map(([stage, value]) => ({ stage, value }));
    return {
      ...common,
      result: {
        chain,
        hasAlternativeExplanation: Boolean(values.alternative),
        hasDiscriminatingEvidencePlan: Boolean(values.nextEvidence),
        causationProven: false
      },
      note: tool.boundary
    };
  }
  return common;
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
    learningObjectiveStatements: (lesson.learningObjectives ?? lesson.objectives ?? []).map((id) => {
      const target = path.join(root, 'content/learning-objectives', `${id}.json`);
      if (!fs.existsSync(target)) return null;
      const objective = JSON.parse(fs.readFileSync(target, 'utf8'));
      return typeof objective.statement === 'string' ? objective.statement : null;
    }).filter(Boolean),
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
  const visibleCourses = [...courses.values()]
    .filter((course) => isVisible(course, previewDrafts, publicReleaseIds))
    .filter((course) => previewDrafts || /^COURSE-LH-/.test(String(course.id || '')))
    .sort((a, b) => String(a.title).localeCompare(String(b.title))).map((course) => ({
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
    academicPublicationStatus: course.extensions?.academicPublicationStatus ?? null,
    academicCompletionBlocked: course.extensions?.academicCompletionBlockedWhileOpenDependencies === true && (course.extensions?.openAcademicDependencies?.length ?? 0) > 0,
    openAcademicDependencies: (course.extensions?.openAcademicDependencies ?? []).map((moduleId) => {
      const module = modules.get(moduleId);
      return { id: moduleId, title: module?.title ?? moduleId, status: module?.status ?? 'missing' };
    }),
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
  const remediationByObjective = {};
  for (const lessonId of module.lessons ?? []) {
    const target = path.join(root, 'content/lessons', `${lessonId}.json`);
    if (!fs.existsSync(target)) continue;
    const lesson = JSON.parse(fs.readFileSync(target, 'utf8'));
    for (const objectiveId of lesson.learningObjectives ?? lesson.objectives ?? []) {
      remediationByObjective[objectiveId] = { lessonId: lesson.id, lessonTitle: lesson.title };
    }
  }
  return {
    module: { id: module.id, title: module.title, version: module.version, status: publicStatus(module, publicReleaseIds) },
    remediationByObjective,
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
    const appliedGraphMatch = url.pathname.match(/^\/api\/applied-learning\/graphs\/(ALGRAPH-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && appliedGraphMatch) {
      const graph = appliedGraphMatch[1] === 'ALGRAPH-ACADEMY-SEED-001'
        ? buildCanonicalAppliedLearningGraph({ root })
        : findAppliedLearningRecord('graphs', appliedGraphMatch[1]);
      if (!graph || !isVisible(graph, previewDrafts)) return json(res, 404, { error: 'applied-learning-graph-not-found' });
      return json(res, 200, safeAppliedLearningGraph(graph));
    }
    const appliedMeasurementMatch = url.pathname.match(/^\/api\/applied-learning\/measurements\/(ALMEAS-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && appliedMeasurementMatch) {
      const activity = findAppliedLearningRecord('measurements', appliedMeasurementMatch[1]);
      if (!activity || !isVisible(activity, previewDrafts)) return json(res, 404, { error: 'applied-learning-measurement-not-found' });
      return json(res, 200, safeAppliedLearningMeasurement(activity));
    }

    const appliedCalculatorMatch = url.pathname.match(/^\/api\/applied-learning\/calculators\/(ALCALC-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && appliedCalculatorMatch) {
      const calculator = findAppliedLearningRecord('calculators', appliedCalculatorMatch[1]);
      if (!calculator || !isVisible(calculator, previewDrafts)) return json(res, 404, { error: 'applied-learning-calculator-not-found' });
      return json(res, 200, safeAppliedLearningCalculator(calculator));
    }
    const appliedCalculatorRunMatch = url.pathname.match(/^\/api\/applied-learning\/calculators\/(ALCALC-[A-Z0-9-]+)\/calculate$/);
    if (req.method === 'POST' && appliedCalculatorRunMatch) {
      const calculator = findAppliedLearningRecord('calculators', appliedCalculatorRunMatch[1]);
      if (!calculator || !isVisible(calculator, previewDrafts)) return json(res, 404, { error: 'applied-learning-calculator-not-found' });
      let body;
      try { body = await readRequestJson(req); } catch { return json(res, 400, { error: 'invalid-json' }); }
      if (calculator.calculation !== 'dli-from-ppfd') return json(res, 400, { error: 'unsupported-calculation' });
      const ppfdUmolM2S = Number(body.ppfdUmolM2S);
      const photoperiodHours = Number(body.photoperiodHours);
      try {
        const value = dliFromPpfd({ ppfdUmolM2S, photoperiodHours });
        return json(res, 200, {
          calculatorId: calculator.id,
          inputs: { ppfdUmolM2S, photoperiodHours },
          value,
          unit: calculator.output?.unit ?? 'mol/m²/day',
          limitations: calculator.limitations ?? []
        });
      } catch (error) {
        return json(res, 400, { error: 'invalid-calculation-input', message: error.message });
      }
    }
    const appliedDifferentialMatch = url.pathname.match(/^\/api\/applied-learning\/differentials\/(ALDIFF-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && appliedDifferentialMatch) {
      const differential = findAppliedLearningRecord('differentials', appliedDifferentialMatch[1]);
      if (!differential || !isVisible(differential, previewDrafts)) return json(res, 404, { error: 'applied-learning-differential-not-found' });
      return json(res, 200, safeAppliedLearningDifferential(differential));
    }
    if (req.method === 'GET' && url.pathname === '/api/applied-learning/tools') {
      const tools = readDirJson('content/applied-learning/tools')
        .filter((tool) => isVisible(tool, previewDrafts))
        .map(safeAppliedLearningTool)
        .sort((a, b) => a.title.localeCompare(b.title));
      return json(res, 200, { mode: previewDrafts ? 'staging-preview' : 'published-only', tools });
    }
    const appliedToolMatch = url.pathname.match(/^\/api\/applied-learning\/tools\/(ALTOOL-[A-Z0-9-]+)$/);
    if (req.method === 'GET' && appliedToolMatch) {
      const tool = findAppliedLearningRecord('tools', appliedToolMatch[1]);
      if (!tool || !isVisible(tool, previewDrafts)) return json(res, 404, { error: 'applied-learning-tool-not-found' });
      return json(res, 200, safeAppliedLearningTool(tool));
    }
    const appliedToolRunMatch = url.pathname.match(/^\/api\/applied-learning\/tools\/(ALTOOL-[A-Z0-9-]+)\/evaluate$/);
    if (req.method === 'POST' && appliedToolRunMatch) {
      const tool = findAppliedLearningRecord('tools', appliedToolRunMatch[1]);
      if (!tool || !isVisible(tool, previewDrafts)) return json(res, 404, { error: 'applied-learning-tool-not-found' });
      let body;
      try { body = await readRequestJson(req); } catch { return json(res, 400, { error: 'invalid-json' }); }
      try { return json(res, 200, evaluateAppliedLearningTool(tool, body)); }
      catch (error) { return json(res, 400, { error: 'invalid-tool-input', message: error.message }); }
    }
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
      ['/applied-learning', ['applied-learning.html', 'text/html; charset=utf-8']],
      ['/applied-learning.js', ['applied-learning.js', 'text/javascript; charset=utf-8']],
      ['/applied-learning.css', ['applied-learning.css', 'text/css; charset=utf-8']],
      ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/progress.js', ['progress.js', 'text/javascript; charset=utf-8']],
      ['/completion-documents.js', ['completion-documents.js', 'text/javascript; charset=utf-8']],
      ['/rich-content.js', ['rich-content.js', 'text/javascript; charset=utf-8']],
      ['/governance.js', ['governance.js', 'text/javascript; charset=utf-8']], ['/portal.js', ['portal.js', 'text/javascript; charset=utf-8']],
      ['/course-assessment.js', ['course-assessment.js', 'text/javascript; charset=utf-8']], ['/assessor.js', ['assessor.js', 'text/javascript; charset=utf-8']],
      ['/vendor/qrcode.min.js', [path.join('vendor', 'qrcode.min.js'), 'text/javascript; charset=utf-8']],
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
