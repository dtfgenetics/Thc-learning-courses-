import { buildAcademicCourseRecord } from './progress.js';

const COURSE_ID = 'COURSE-LH-TECH1-001';

function iso(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function printable(value) {
  return iso(value) ?? '—';
}

function statusLabel(value) {
  return String(value ?? 'unknown').replaceAll('-', ' ');
}

function transitionLabel(eventType) {
  if (eventType === 'course-enrollment-academic-completed') return 'Academic course completed';
  if (eventType === 'course-enrollment-academic-reopened') return 'Academic requirements reopened';
  return statusLabel(eventType ?? 'transition');
}

export function buildAcademicTranscriptText(record, { generatedAt = new Date().toISOString() } = {}) {
  if (!record?.course?.id) throw new Error('academic record required');
  const complete = Boolean(record.academicCompletion?.complete);
  const lines = [
    complete ? 'THC Academy Academic Completion Statement and Transcript' : 'THC Academy Academic Course Record and Transcript',
    '',
    `Course: ${record.course.title}`,
    `Course ID: ${record.course.id}`,
    `Current course version: ${record.course.currentVersion || '—'}`,
    `Generated: ${printable(generatedAt)}`,
    '',
    'IMPORTANT ACADEMIC BOUNDARY',
    'This document is an academic learning record. It is not a professional credential, license, certification, credential-eligibility decision, or substitute for the separate THC Academy credential system.',
    '',
    'ACADEMIC COURSE STATUS',
    `Status: ${complete ? 'Complete' : 'In progress'}`,
    `Completion recorded through: ${printable(record.academicCompletion?.completionRecordedAt)}`,
    `Instruction: ${Number(record.instruction?.completedLessons ?? 0)}/${Number(record.instruction?.totalLessons ?? 0)} canonical lessons completed`,
    `Course final: ${statusLabel(record.writtenAssessment?.outcome)}`,
    `Course practical: ${statusLabel(record.performanceAssessment?.status)}`,
    `Practical critical errors: ${Number(record.performanceAssessment?.criticalErrorCount ?? 0)}`
  ];

  if ((record.academicCompletion?.missingRequirements ?? []).length) {
    lines.push('', 'OPEN ACADEMIC REQUIREMENTS');
    for (const requirement of record.academicCompletion.missingRequirements) lines.push(`- ${statusLabel(requirement)}`);
  }

  lines.push('', 'INSTRUCTION RECORD');
  for (const module of record.instruction?.modules ?? []) {
    lines.push('', `${module.title} — ${module.completedLessons}/${module.totalLessons} completed`);
    for (const lesson of module.lessons ?? []) {
      const detail = lesson.completed
        ? `Completed • version ${lesson.completedVersion ?? 'unknown'} • ${printable(lesson.completedAt)}`
        : 'Open';
      lines.push(`- ${lesson.title}: ${detail}`);
    }
  }

  lines.push('', 'COURSE ASSESSMENT EVIDENCE');
  lines.push(`Course final outcome: ${statusLabel(record.writtenAssessment?.outcome)}`);
  lines.push(`Course final attempts recorded: ${Number(record.writtenAssessment?.attemptCount ?? 0)}`);
  lines.push(`Course final best score: ${record.writtenAssessment?.bestScorePercent == null ? '—' : `${Number(record.writtenAssessment.bestScorePercent).toFixed(1)}%`}`);
  lines.push(`Course final passing standard: ${record.writtenAssessment?.passingScorePercent == null ? '—' : `${Number(record.writtenAssessment.passingScorePercent).toFixed(1)}%`}`);
  lines.push(`Latest course-final score date: ${printable(record.writtenAssessment?.latestScoredAt)}`);
  lines.push(`Practical status: ${statusLabel(record.performanceAssessment?.status)}`);
  lines.push(`Practical score: ${record.performanceAssessment?.scorePercent == null ? '—' : `${Number(record.performanceAssessment.scorePercent).toFixed(1)}%`}`);
  lines.push(`Practical evaluated: ${printable(record.performanceAssessment?.evaluatedAt)}`);
  lines.push(`Practical follow-up: ${statusLabel(record.performanceAssessment?.followUpStatus ?? 'none')}`);
  if (record.performanceAssessment?.reassessmentTargetDate) lines.push(`Reassessment target: ${record.performanceAssessment.reassessmentTargetDate}`);
  if (record.performanceAssessment?.learnerFeedback) lines.push(`Learner-facing assessor feedback: ${record.performanceAssessment.learnerFeedback}`);

  lines.push('', 'ACADEMIC COMPLETION TRANSITION HISTORY');
  if (!(record.academicStatusHistory ?? []).length) {
    lines.push('No automatic academic completion transitions are recorded.');
  } else {
    for (const event of record.academicStatusHistory) {
      const snapshot = event.academicSnapshot ?? {};
      lines.push(`- ${printable(event.occurredAt)} • ${transitionLabel(event.eventType)} • version ${event.courseVersion || '—'} • ${Number(snapshot.completedLessonCount ?? 0)}/${Number(snapshot.requiredLessonCount ?? 0)} lessons • final ${statusLabel(snapshot.finalAssessmentStatus)} • practical ${statusLabel(snapshot.performanceAssessmentStatus)} • ${Number(snapshot.performanceCriticalErrorCount ?? 0)} critical errors`);
    }
  }

  lines.push('', 'COURSE-VERSION ENROLLMENT HISTORY');
  if (!(record.courseVersionHistory ?? []).length) {
    lines.push('No account enrollment history is recorded.');
  } else {
    for (const row of record.courseVersionHistory) {
      lines.push(`- Version ${row.courseVersion} • ${statusLabel(row.status)} • enrolled ${printable(row.enrolledAt)} • current completion ${printable(row.completedAt)}`);
    }
  }

  lines.push('', 'END OF ACADEMIC RECORD', 'This export contains learner-facing academic information only and intentionally excludes evaluator identity, private evaluator notes, detailed evidence locators, secure assessment keys, and professional credential issuance/signing data.', '');
  return lines.join('\n');
}

export function buildAcademicRecordJson(record, { generatedAt = new Date().toISOString() } = {}) {
  if (!record?.course?.id) throw new Error('academic record required');
  return `${JSON.stringify({
    exportType: 'thc-academy-academic-course-record',
    generatedAt: iso(generatedAt),
    academicBoundary: 'Academic learning record only; not a professional credential, license, certification, or credential-eligibility decision.',
    record
  }, null, 2)}\n`;
}

export function academicRecordDownloadFiles(record, options = {}) {
  const suffix = String(record?.course?.id ?? COURSE_ID).toLowerCase();
  return {
    transcript: {
      filename: `${suffix}-academic-transcript.txt`,
      type: 'text/plain;charset=utf-8',
      content: buildAcademicTranscriptText(record, options)
    },
    data: {
      filename: `${suffix}-academic-record.json`,
      type: 'application/json;charset=utf-8',
      content: buildAcademicRecordJson(record, options)
    }
  };
}

async function loadAcademicRecord() {
  const [catalogResponse, progressResponse, enrollmentResponse, evidenceResponse] = await Promise.all([
    fetch('/api/catalog', { headers: { accept: 'application/json' }, credentials: 'same-origin' }),
    fetch('/api/v1/me/progress', { headers: { accept: 'application/json' }, credentials: 'same-origin' }),
    fetch('/api/v1/me/enrollments', { headers: { accept: 'application/json' }, credentials: 'same-origin' }),
    fetch(`/api/v1/me/courses/${COURSE_ID}/evidence`, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
  ]);
  if ([progressResponse, enrollmentResponse, evidenceResponse].some((response) => response.status === 401 || response.status === 403)) throw new Error('authentication-required');
  for (const response of [catalogResponse, progressResponse, enrollmentResponse, evidenceResponse]) if (!response.ok) throw new Error(`academic-record-unavailable:${response.status}`);
  const [catalog, progress, enrollments, evidence] = await Promise.all([catalogResponse.json(), progressResponse.json(), enrollmentResponse.json(), evidenceResponse.json()]);
  const course = (catalog.courses ?? []).find((row) => row.id === COURSE_ID);
  if (!course) throw new Error('course-not-found');
  return buildAcademicCourseRecord({ course, progressRows: progress.progress ?? [], enrollments: enrollments.enrollments ?? [], evidence });
}

function downloadFile(file) {
  const blob = new Blob([file.content], { type: file.type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = file.filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function waitForRecordActions(timeoutMs = 5000) {
  const current = document.querySelector('.academic-record .record-actions');
  if (current) return Promise.resolve(current);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('record-actions-unavailable')); }, timeoutMs);
    const observer = new MutationObserver(() => {
      const node = document.querySelector('.academic-record .record-actions');
      if (!node) return;
      clearTimeout(timeout);
      observer.disconnect();
      resolve(node);
    });
    observer.observe(document.querySelector('#lesson-view') ?? document.body, { childList: true, subtree: true });
  });
}

async function attachAcademicRecordDownloads() {
  let record;
  try { record = await loadAcademicRecord(); }
  catch { return false; }
  let actions;
  try { actions = await waitForRecordActions(); }
  catch { return false; }
  if (actions.querySelector('[data-academic-download="transcript"]')) return true;
  const files = academicRecordDownloadFiles(record);
  const transcript = document.createElement('button');
  transcript.type = 'button';
  transcript.className = 'record-button';
  transcript.dataset.academicDownload = 'transcript';
  transcript.textContent = record.academicCompletion?.complete ? 'Download completion transcript' : 'Download academic transcript';
  transcript.addEventListener('click', () => downloadFile(files.transcript));
  const data = document.createElement('button');
  data.type = 'button';
  data.className = 'record-button';
  data.dataset.academicDownload = 'json';
  data.textContent = 'Download record data';
  data.addEventListener('click', () => downloadFile(files.data));
  actions.append(transcript, data);
  return true;
}

export function initializeAcademicRecordDownloads() {
  const tab = document.querySelector('#tab-course-record');
  if (!tab) return false;
  tab.addEventListener('click', () => { void attachAcademicRecordDownloads(); });
  return true;
}

if (typeof document !== 'undefined') initializeAcademicRecordDownloads();
