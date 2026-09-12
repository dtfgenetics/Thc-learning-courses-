const STORAGE_KEY = 'thc-academy-progress-v1';
const ADMIN_COURSE_ID = 'COURSE-LH-TECH1-001';
const ACADEMIC_RECORD_COURSE_ID = 'COURSE-LH-TECH1-001';

export function readProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { completedLessons: [] };
    const parsed = JSON.parse(raw);
    const completedLessons = Array.isArray(parsed.completedLessons)
      ? [...new Set(parsed.completedLessons.filter((id) => typeof id === 'string'))]
      : [];
    return { completedLessons };
  } catch {
    return { completedLessons: [] };
  }
}

export function writeProgress(progress, storage = globalThis.localStorage) {
  const normalized = {
    completedLessons: [...new Set((progress?.completedLessons ?? []).filter((id) => typeof id === 'string'))].sort()
  };
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function setLessonComplete(progress, lessonId, complete = true) {
  const current = new Set(progress?.completedLessons ?? []);
  if (complete) current.add(lessonId);
  else current.delete(lessonId);
  return { completedLessons: [...current].sort() };
}

export function progressFromServerRows(rows = []) {
  return {
    completedLessons: [...new Set(
      rows
        .filter((row) => row?.status === 'completed' && typeof row.lessonId === 'string')
        .map((row) => row.lessonId)
    )].sort()
  };
}

export function createServerProgressClient({ fetchImpl = globalThis.fetch, basePath = '/api/v1' } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Server progress client requires fetch');
  return {
    async load() {
      const response = await fetchImpl(`${basePath}/me/progress`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      });
      if (!response.ok) throw Object.assign(new Error(`Account progress unavailable (${response.status})`), { status: response.status });
      const body = await response.json();
      return { progress: progressFromServerRows(body.progress), subject: body.learner?.subject ?? null };
    },
    async setLesson({ lessonId, lessonVersion, complete }) {
      const response = await fetchImpl(`${basePath}/me/lessons/${encodeURIComponent(lessonId)}`, {
        method: 'PUT',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ lessonVersion: String(lessonVersion), status: complete ? 'completed' : 'not-started' })
      });
      if (!response.ok) throw Object.assign(new Error(`Account progress update failed (${response.status})`), { status: response.status });
      return response.json();
    }
  };
}

export function courseProgress(course, progress) {
  const lessonIds = (course?.modules ?? []).flatMap((module) => (module.lessons ?? []).map((lesson) => lesson.id));
  const completed = new Set(progress?.completedLessons ?? []);
  const completedCount = lessonIds.filter((id) => completed.has(id)).length;
  return {
    completed: completedCount,
    total: lessonIds.length,
    percent: lessonIds.length ? Math.round((completedCount / lessonIds.length) * 100) : 0
  };
}

function adminElement(tag, value = '', className = '') {
  const node = document.createElement(tag);
  if (value !== '') node.textContent = value;
  if (className) node.className = className;
  return node;
}

function adminStatusLabel(value) {
  return ({ passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', voided: 'Voided', 'not-recorded': 'Not evaluated' })[value] ?? 'Not evaluated';
}

function adminFollowUpLabel(value) {
  return ({ none: 'No follow-up', 'remediation-assigned': 'Remediation assigned', 'remediation-in-progress': 'Remediation in progress', 'ready-for-reassessment': 'Ready for reassessment', 'reassessment-scheduled': 'Reassessment scheduled', closed: 'Closed' })[value] ?? String(value || 'none').replaceAll('-', ' ');
}

function injectAdminStyles() {
  if (document.querySelector('#course1-admin-dashboard-styles')) return;
  const style = document.createElement('style');
  style.id = 'course1-admin-dashboard-styles';
  style.textContent = `
    .admin-panel{max-width:1320px}.admin-runtime{display:grid;gap:1rem}.admin-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:.65rem}.admin-metric{display:grid;gap:.2rem;padding:.85rem;border:1px solid var(--line);border-radius:.75rem;background:#fff}.admin-metric strong{font-size:1.5rem}.admin-metric span,.admin-status{color:var(--muted)}.admin-toolbar{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center}.admin-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem}.admin-field{display:grid;gap:.35rem;font-weight:750}.admin-field input,.admin-field select,.admin-assignment input{width:100%;min-height:44px;border:1px solid var(--line);border-radius:.6rem;padding:.65rem .7rem;background:#fff;color:var(--ink);font:inherit}.admin-button{min-height:44px;border:1px solid var(--green);border-radius:.65rem;padding:.65rem .85rem;background:#fff;color:var(--green);font:inherit;font-weight:800;cursor:pointer}.admin-button.primary{background:var(--green);color:#fff}.admin-button:disabled{opacity:.55;cursor:not-allowed}.admin-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:.75rem;background:#fff}.admin-table{width:100%;min-width:980px;border-collapse:collapse}.admin-table th,.admin-table td{padding:.75rem;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}.admin-table th{background:var(--panel);white-space:nowrap}.admin-assignment{display:grid;grid-template-columns:minmax(175px,1fr) auto auto;gap:.4rem;min-width:325px}.admin-button:focus-visible,.admin-field input:focus-visible,.admin-field select:focus-visible,.admin-assignment input:focus-visible,.admin-table-wrap:focus-visible{outline:3px solid rgba(36,95,61,.22);outline-offset:2px}@media(max-width:960px){.admin-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.admin-filters{grid-template-columns:1fr}.admin-toolbar{display:grid}.admin-button{width:100%}}@media print{#tab-admin,.admin-toolbar,.admin-filters,.admin-assignment button{display:none!important}.admin-table{min-width:0;font-size:9pt}.admin-table-wrap{overflow:visible;border:0}}
  `;
  document.head.append(style);
}

function adminMetric(label, value) {
  const card = adminElement('article', '', 'admin-metric');
  card.append(adminElement('strong', String(value)), adminElement('span', label));
  return card;
}

function filterAdminRows(rows, { search, status, assignment, followUp }) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    const text = `${row.learnerSubject ?? ''} ${row.assignedEvaluatorId ?? ''}`.toLowerCase();
    const follow = row.followUpStatus ?? 'none';
    return (!query || text.includes(query))
      && (!status || (row.practicalStatus ?? 'not-recorded') === status)
      && (!assignment || (assignment === 'unassigned' ? !row.assignedEvaluatorId : assignment === 'assigned' ? Boolean(row.assignedEvaluatorId) : row.assignedEvaluatorId === assignment))
      && (!followUp || (followUp === 'open' ? !['none', 'closed'].includes(follow) : follow === followUp));
  });
}

async function adminReportRequest() {
  const response = await fetch(`/api/v1/admin/courses/${ADMIN_COURSE_ID}/practical-report`, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Admin report unavailable (${response.status})`);
  return body;
}

async function adminSetAssignment(row, evaluatorId, statusNode) {
  const response = await fetch(`/api/v1/admin/courses/${ADMIN_COURSE_ID}/practical-assignment`, {
    method: 'PUT', headers: { accept: 'application/json', 'content-type': 'application/json' }, credentials: 'same-origin',
    body: JSON.stringify({ learnerSubject: row.learnerSubject, evaluatorId })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { statusNode.textContent = `Assignment not changed: ${body.error || response.status}`; return false; }
  statusNode.textContent = evaluatorId ? `Assigned ${row.learnerSubject} to ${evaluatorId}.` : `Assignment cleared for ${row.learnerSubject}.`;
  return true;
}

function adminAssignmentControl(row, refresh, statusNode) {
  const wrap = adminElement('div', '', 'admin-assignment');
  const input = document.createElement('input'); input.type = 'text'; input.value = row.assignedEvaluatorId ?? ''; input.maxLength = 256; input.autocomplete = 'off'; input.placeholder = 'Evaluator subject'; input.setAttribute('aria-label', `Assigned evaluator for ${row.learnerSubject}`);
  const set = adminElement('button', 'Set', 'admin-button'); set.type = 'button';
  const clear = adminElement('button', 'Clear', 'admin-button'); clear.type = 'button'; clear.disabled = !row.assignedEvaluatorId;
  set.addEventListener('click', async () => { const evaluatorId = input.value.trim(); if (!evaluatorId) { statusNode.textContent = 'Enter an evaluator subject or choose Clear.'; return; } set.disabled = true; if (await adminSetAssignment(row, evaluatorId, statusNode)) await refresh(); set.disabled = false; });
  clear.addEventListener('click', async () => { clear.disabled = true; if (await adminSetAssignment(row, '', statusNode)) await refresh(); clear.disabled = false; });
  wrap.append(input, set, clear); return wrap;
}

function adminTable(rows, refresh, statusNode) {
  const wrap = adminElement('div', '', 'admin-table-wrap'); wrap.tabIndex = 0; wrap.setAttribute('aria-label', 'Course 1 practical operations table');
  const table = document.createElement('table'); table.className = 'admin-table';
  const thead = document.createElement('thead'); const head = document.createElement('tr');
  for (const label of ['Learner','Practical','Score','Critical','Follow-up','Reassessment','Evaluator assignment','Updated']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); }
  thead.append(head); table.append(thead); const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    const cells = [row.learnerSubject ?? '', adminStatusLabel(row.practicalStatus), row.scorePercent == null ? '—' : `${Number(row.scorePercent).toFixed(1)}%`, String(Number(row.criticalErrorCount ?? 0)), adminFollowUpLabel(row.followUpStatus), row.reassessmentTargetDate || '—'];
    for (const value of cells) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
    const assignment = document.createElement('td'); assignment.append(adminAssignmentControl(row, refresh, statusNode)); tr.append(assignment);
    const updated = document.createElement('td'); updated.textContent = row.updatedAt ? new Date(row.updatedAt).toLocaleString() : (row.enrolledAt ? new Date(row.enrolledAt).toLocaleDateString() : '—'); tr.append(updated); tbody.append(tr);
  }
  table.append(tbody); wrap.append(table); return wrap;
}

export async function initializeAdminDashboard() {
  const tab = document.querySelector('#tab-admin');
  const lessonView = document.querySelector('#lesson-view');
  if (!tab || !lessonView) return false;
  let capability;
  try {
    capability = await fetch('/api/v1/admin/diagnostics', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
  } catch { return false; }
  if (!capability.ok) return false;
  injectAdminStyles();
  tab.hidden = false;
  tab.addEventListener('click', async () => {
    for (const item of document.querySelectorAll('.portal-tab')) { const active = item.id === 'tab-admin'; item.classList.toggle('active', active); item.setAttribute('aria-pressed', active ? 'true' : 'false'); }
    const panel = adminElement('article', '', 'portal-panel admin-panel');
    panel.append(adminElement('p', 'Authorized Course 1 operations', 'eyebrow'), adminElement('h2', 'Course 1 Operations Dashboard'), adminElement('p', 'Manage practical workload, evaluator ownership, remediation and reassessment follow-up, and privacy-bounded cohort reporting. This dashboard does not alter public academic content or issue professional credentials.', 'lede'));
    const statusNode = adminElement('p', 'Loading Course 1 operations…', 'admin-status'); statusNode.setAttribute('aria-live', 'polite'); panel.append(statusNode); lessonView.replaceChildren(panel); lessonView.focus();
    let payload = null;
    async function refresh() {
      try { payload = await adminReportRequest(); render(); } catch (error) { statusNode.textContent = error.message; }
    }
    function render() {
      panel.querySelector('.admin-runtime')?.remove();
      const rows = Array.isArray(payload?.rows) ? payload.rows : []; const summary = payload?.summary ?? {};
      statusNode.textContent = `${rows.length} learner operational record${rows.length === 1 ? '' : 's'} loaded.`;
      const runtime = adminElement('div', '', 'admin-runtime');
      const metrics = adminElement('section', '', 'admin-metrics'); metrics.setAttribute('aria-label', 'Course 1 practical cohort summary');
      metrics.append(adminMetric('Learners', summary.total ?? rows.length), adminMetric('Not evaluated', summary.notRecorded ?? 0), adminMetric('In progress', summary.inProgress ?? 0), adminMetric('Not passed', summary.failed ?? 0), adminMetric('Passed', summary.passed ?? 0), adminMetric('Follow-up open', summary.followUpOpen ?? 0), adminMetric('Unassigned', summary.unassigned ?? 0)); runtime.append(metrics);
      const toolbar = adminElement('section', '', 'admin-toolbar'); const csv = adminElement('button', 'Export CSV', 'admin-button primary'); csv.type = 'button'; csv.addEventListener('click', () => { const link = document.createElement('a'); link.href = `/api/v1/admin/courses/${ADMIN_COURSE_ID}/practical-report?format=csv`; link.download = 'course-1-practical-report.csv'; document.body.append(link); link.click(); link.remove(); }); const reload = adminElement('button', 'Refresh report', 'admin-button'); reload.type = 'button'; reload.addEventListener('click', refresh); toolbar.append(csv, reload); runtime.append(toolbar);
      const filters = adminElement('section', '', 'admin-filters');
      const field = (labelText, control) => { const label = adminElement('label', '', 'admin-field'); label.append(adminElement('span', labelText), control); return label; };
      const search = document.createElement('input'); search.type = 'search'; search.autocomplete = 'off'; search.placeholder = 'Learner or evaluator subject…';
      const practical = document.createElement('select'); for (const [value,label] of [['','All practical states'],['not-recorded','Not evaluated'],['in-progress','In progress'],['failed','Not passed'],['passed','Passed'],['voided','Voided']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; practical.append(option); }
      const assignment = document.createElement('select'); for (const [value,label] of [['','All assignments'],['unassigned','Unassigned'],['assigned','Any assigned']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; assignment.append(option); } for (const evaluator of [...new Set(rows.map((row) => row.assignedEvaluatorId).filter(Boolean))].sort()) { const option = document.createElement('option'); option.value = evaluator; option.textContent = evaluator; assignment.append(option); }
      const follow = document.createElement('select'); for (const [value,label] of [['','All follow-up states'],['open','Any open follow-up'],['remediation-assigned','Remediation assigned'],['remediation-in-progress','Remediation in progress'],['ready-for-reassessment','Ready for reassessment'],['reassessment-scheduled','Reassessment scheduled'],['closed','Closed']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; follow.append(option); }
      filters.append(field('Search', search), field('Practical status', practical), field('Assignment', assignment), field('Follow-up', follow)); runtime.append(filters);
      const results = adminElement('p', '', 'admin-status'); results.setAttribute('aria-live', 'polite'); const host = adminElement('div'); runtime.append(results, host);
      function applyFilters() { const visible = filterAdminRows(rows, { search: search.value, status: practical.value, assignment: assignment.value, followUp: follow.value }); results.textContent = `${visible.length} of ${rows.length} learner${rows.length === 1 ? '' : 's'} shown.`; host.replaceChildren(adminTable(visible, refresh, statusNode)); }
      search.addEventListener('input', applyFilters); practical.addEventListener('change', applyFilters); assignment.addEventListener('change', applyFilters); follow.addEventListener('change', applyFilters); applyFilters(); panel.append(runtime);
    }
    await refresh();
  });
  return true;
}

function recordIso(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function latestRecordDate(values = []) {
  const valid = values.map(recordIso).filter(Boolean).sort();
  return valid.length ? valid.at(-1) : null;
}

export function buildAcademicCourseRecord({ course, progressRows = [], enrollments = [], evidence = {} } = {}) {
  if (!course?.id) throw new Error('course required');
  const modules = (course.modules ?? []).map((module) => {
    const lessons = (module.lessons ?? []).map((lesson) => {
      const rows = progressRows.filter((row) => row.lessonId === lesson.id);
      const completedRows = rows.filter((row) => row.status === 'completed').sort((a, b) => String(a.completedAt ?? '').localeCompare(String(b.completedAt ?? '')));
      const latest = completedRows.at(-1) ?? null;
      return {
        id: lesson.id,
        title: lesson.title,
        completed: completedRows.length > 0,
        completedVersion: latest?.lessonVersion == null ? null : String(latest.lessonVersion),
        completedAt: recordIso(latest?.completedAt),
        recordedVersions: [...new Set(rows.map((row) => String(row.lessonVersion)).filter(Boolean))].sort()
      };
    });
    const completedLessons = lessons.filter((lesson) => lesson.completed).length;
    return { id: module.id, title: module.title, lessons, completedLessons, totalLessons: lessons.length, complete: lessons.length > 0 && completedLessons === lessons.length };
  });
  const lessons = modules.flatMap((module) => module.lessons);
  const completedLessons = lessons.filter((lesson) => lesson.completed).length;
  const instructionComplete = lessons.length > 0 && completedLessons === lessons.length;
  const written = evidence.writtenAssessment ?? {};
  const practical = evidence.performanceAssessment ?? {};
  const writtenPassed = written.outcome === 'passed';
  const practicalPassed = practical.status === 'passed' && Number(practical.criticalErrorCount ?? 0) === 0;
  const complete = instructionComplete && writtenPassed && practicalPassed;
  const missingRequirements = [];
  if (!instructionComplete) missingRequirements.push('instruction');
  if (!writtenPassed) missingRequirements.push('course-final');
  if (!practicalPassed) missingRequirements.push('course-practical');
  const versionHistory = enrollments.filter((row) => row.courseId === course.id).map((row) => ({
    courseVersion: String(row.courseVersion),
    status: row.status,
    enrolledAt: recordIso(row.enrolledAt),
    completedAt: recordIso(row.completedAt)
  })).sort((a, b) => String(a.enrolledAt ?? '').localeCompare(String(b.enrolledAt ?? '')));
  return {
    recordType: 'academic-course-record',
    course: { id: course.id, title: course.title, currentVersion: String(evidence.course?.version ?? course.version ?? ''), publicationStatus: course.status ?? 'published' },
    academicCompletion: {
      complete,
      status: complete ? 'complete' : 'in-progress',
      completionRecordedAt: complete ? latestRecordDate([...lessons.map((lesson) => lesson.completedAt), written.latestScoredAt, practical.evaluatedAt]) : null,
      missingRequirements,
      statement: 'This is an academic Course 1 completion record. It is not a professional credential, license, or certification.'
    },
    instruction: { completedLessons, totalLessons: lessons.length, complete: instructionComplete, modules },
    writtenAssessment: {
      assessmentId: written.assessmentId ?? null,
      title: written.title ?? 'Course final assessment',
      outcome: written.outcome ?? 'not-attempted',
      attemptCount: Number(written.attemptCount ?? 0),
      bestScorePercent: written.bestScorePercent == null ? null : Number(written.bestScorePercent),
      passingScorePercent: written.passingScorePercent == null ? null : Number(written.passingScorePercent),
      latestStartedAt: recordIso(written.latestStartedAt),
      latestScoredAt: recordIso(written.latestScoredAt)
    },
    performanceAssessment: {
      assessmentId: practical.assessmentId ?? null,
      status: practical.status ?? 'not-recorded',
      scorePercent: practical.scorePercent == null ? null : Number(practical.scorePercent),
      criticalErrorCount: Number(practical.criticalErrorCount ?? 0),
      evaluatedAt: recordIso(practical.evaluatedAt),
      updatedAt: recordIso(practical.updatedAt),
      followUpStatus: practical.followUpStatus ?? 'none',
      reassessmentTargetDate: practical.reassessmentTargetDate || null,
      learnerFeedback: practical.remediationSummary || null
    },
    courseVersionHistory: versionHistory
  };
}

function transcriptElement(tag, value = '', className = '') {
  const node = document.createElement(tag);
  if (value !== '') node.textContent = value;
  if (className) node.className = className;
  return node;
}

function transcriptStatusLabel(value) {
  return ({ complete: 'Complete', 'in-progress': 'In progress', passed: 'Passed', 'not-passed': 'Not passed', 'not-attempted': 'Not attempted', failed: 'Not passed', 'not-recorded': 'Not evaluated', voided: 'Voided' })[value] ?? String(value ?? '').replaceAll('-', ' ');
}

function transcriptFollowUpLabel(value) {
  return ({ none: 'No follow-up', closed: 'Closed', 'remediation-assigned': 'Remediation assigned', 'remediation-in-progress': 'Remediation in progress', 'ready-for-reassessment': 'Ready for reassessment', 'reassessment-scheduled': 'Reassessment scheduled' })[value] ?? String(value ?? 'none').replaceAll('-', ' ');
}

function transcriptDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function injectTranscriptStyles() {
  if (document.querySelector('#course1-academic-record-styles')) return;
  const style = document.createElement('style');
  style.id = 'course1-academic-record-styles';
  style.textContent = `
    .academic-record{max-width:1120px}.record-boundary{padding:.9rem 1rem;border-left:4px solid var(--green);background:var(--green-soft);border-radius:.5rem}.record-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.7rem;margin:1rem 0}.record-card{display:grid;gap:.25rem;padding:.85rem;border:1px solid var(--line);border-radius:.75rem;background:#fff}.record-card strong{font-size:1.25rem}.record-card span,.record-meta{color:var(--muted)}.record-actions{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.record-button{min-height:44px;border:1px solid var(--green);border-radius:.65rem;padding:.65rem .85rem;background:#fff;color:var(--green);font:inherit;font-weight:800;cursor:pointer}.record-section{margin-top:1.25rem;padding-top:1.1rem;border-top:1px solid var(--line)}.record-module{margin:.7rem 0;border:1px solid var(--line);border-radius:.7rem;background:#fff}.record-module>summary{min-height:44px;padding:.75rem .9rem;cursor:pointer;font-weight:800}.record-lessons{display:grid;gap:.4rem;padding:0 .9rem .9rem}.record-lesson{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.7rem;align-items:center;padding:.6rem 0;border-top:1px solid var(--line)}.record-version-history{overflow-x:auto}.record-table{width:100%;border-collapse:collapse}.record-table th,.record-table td{padding:.65rem;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.record-table th{background:var(--panel)}.record-warning{padding:.8rem;border:1px solid #d7bf92;border-radius:.7rem;background:#fffaf0}.record-button:focus-visible,.record-module>summary:focus-visible,.record-version-history:focus-visible{outline:3px solid rgba(36,95,61,.22);outline-offset:2px}@media(max-width:620px){.record-lesson{grid-template-columns:1fr}.record-actions{display:grid}.record-button{width:100%}}@media print{#tab-course-record,.record-actions,.site-header,.catalog-panel,.site-footer,.governance-dashboard{display:none!important}.academic-record{max-width:none}.record-module{break-inside:avoid}.record-version-history{overflow:visible}}
  `;
  document.head.append(style);
}

function transcriptSummaryCard(label, value, note = '') {
  const card = transcriptElement('article', '', 'record-card');
  card.append(transcriptElement('span', label), transcriptElement('strong', value));
  if (note) card.append(transcriptElement('small', note, 'record-meta'));
  return card;
}

async function loadAcademicRecordData() {
  const requests = [
    fetch('/api/catalog', { headers: { accept: 'application/json' }, credentials: 'same-origin' }),
    fetch('/api/v1/me/progress', { headers: { accept: 'application/json' }, credentials: 'same-origin' }),
    fetch('/api/v1/me/enrollments', { headers: { accept: 'application/json' }, credentials: 'same-origin' }),
    fetch(`/api/v1/me/courses/${ACADEMIC_RECORD_COURSE_ID}/evidence`, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
  ];
  const [catalogResponse, progressResponse, enrollmentResponse, evidenceResponse] = await Promise.all(requests);
  if ([progressResponse, enrollmentResponse, evidenceResponse].some((response) => response.status === 401 || response.status === 403)) throw Object.assign(new Error('Sign in to view your authoritative Course 1 academic record.'), { status: 401 });
  for (const response of [catalogResponse, progressResponse, enrollmentResponse, evidenceResponse]) if (!response.ok) throw new Error(`Academic record data unavailable (${response.status}).`);
  const [catalog, progress, enrollment, evidence] = await Promise.all([catalogResponse.json(), progressResponse.json(), enrollmentResponse.json(), evidenceResponse.json()]);
  const course = (catalog.courses ?? []).find((row) => row.id === ACADEMIC_RECORD_COURSE_ID);
  if (!course) throw new Error('Course 1 is not available in the published Academy catalog.');
  return buildAcademicCourseRecord({ course, progressRows: progress.progress ?? [], enrollments: enrollment.enrollments ?? [], evidence });
}

function renderAcademicRecord(panel, record) {
  panel.replaceChildren();
  panel.append(transcriptElement('p', 'Private learner academic record', 'eyebrow'), transcriptElement('h2', record.course.title));
  panel.append(transcriptElement('p', record.academicCompletion.statement, 'record-boundary'));
  const summary = transcriptElement('section', '', 'record-summary');
  summary.append(
    transcriptSummaryCard('Academic course status', transcriptStatusLabel(record.academicCompletion.status), record.academicCompletion.completionRecordedAt ? `Recorded through ${transcriptDate(record.academicCompletion.completionRecordedAt)}` : ''),
    transcriptSummaryCard('Instruction', `${record.instruction.completedLessons}/${record.instruction.totalLessons}`, record.instruction.complete ? 'All canonical lesson IDs completed' : 'Instruction still in progress'),
    transcriptSummaryCard('Course final', transcriptStatusLabel(record.writtenAssessment.outcome), record.writtenAssessment.bestScorePercent == null ? `${record.writtenAssessment.attemptCount} recorded attempts` : `${record.writtenAssessment.bestScorePercent.toFixed(0)}% best • pass ${Number(record.writtenAssessment.passingScorePercent ?? 0).toFixed(0)}%`),
    transcriptSummaryCard('Course practical', transcriptStatusLabel(record.performanceAssessment.status), record.performanceAssessment.scorePercent == null ? 'No finalized score' : `${record.performanceAssessment.scorePercent.toFixed(0)}% • ${record.performanceAssessment.criticalErrorCount} critical errors`)
  );
  panel.append(summary);
  if (!record.academicCompletion.complete) {
    const missing = transcriptElement('section', '', 'record-warning');
    missing.append(transcriptElement('strong', 'Academic completion requirements still open'));
    const labels = { instruction: 'Complete the canonical Course 1 lesson set', 'course-final': 'Pass the public Course 1 final assessment', 'course-practical': 'Pass the Course 1 practical without disqualifying critical errors' };
    const list = document.createElement('ul');
    for (const item of record.academicCompletion.missingRequirements) list.append(transcriptElement('li', labels[item] ?? item));
    missing.append(list); panel.append(missing);
  }
  const actions = transcriptElement('div', '', 'record-actions');
  const print = transcriptElement('button', 'Print academic record', 'record-button'); print.type = 'button'; print.addEventListener('click', () => globalThis.print?.()); actions.append(print); panel.append(actions);

  const instruction = transcriptElement('section', '', 'record-section');
  instruction.append(transcriptElement('h3', 'Instruction record'), transcriptElement('p', 'Completion is preserved by canonical lesson ID. When a lesson is revised later, the version actually completed remains part of this record rather than being erased.', 'record-meta'));
  for (const module of record.instruction.modules) {
    const details = document.createElement('details'); details.className = 'record-module'; details.open = !module.complete;
    const summaryNode = document.createElement('summary'); summaryNode.textContent = `${module.title} — ${module.completedLessons}/${module.totalLessons} completed`; details.append(summaryNode);
    const lessons = transcriptElement('div', '', 'record-lessons');
    for (const lesson of module.lessons) {
      const row = transcriptElement('div', '', 'record-lesson');
      const copy = transcriptElement('div'); copy.append(transcriptElement('strong', lesson.title));
      const meta = lesson.completed ? `Recorded version ${lesson.completedVersion ?? 'unknown'} • ${transcriptDate(lesson.completedAt)}` : 'No completed lesson record'; copy.append(transcriptElement('div', meta, 'record-meta'));
      row.append(copy, transcriptElement('strong', lesson.completed ? 'Completed' : 'Open')); lessons.append(row);
    }
    details.append(lessons); instruction.append(details);
  }
  panel.append(instruction);

  const assessments = transcriptElement('section', '', 'record-section'); assessments.append(transcriptElement('h3', 'Course assessment evidence'));
  const writtenText = record.writtenAssessment.bestScorePercent == null ? `${record.writtenAssessment.attemptCount} attempt(s) recorded.` : `Best recorded score ${record.writtenAssessment.bestScorePercent.toFixed(1)}%; passing standard ${Number(record.writtenAssessment.passingScorePercent ?? 0).toFixed(0)}%. Latest scored evidence: ${transcriptDate(record.writtenAssessment.latestScoredAt)}.`;
  assessments.append(transcriptElement('p', `Course final: ${transcriptStatusLabel(record.writtenAssessment.outcome)}. ${writtenText}`));
  const practicalText = [`Course practical: ${transcriptStatusLabel(record.performanceAssessment.status)}.`];
  if (record.performanceAssessment.scorePercent != null) practicalText.push(`Recorded score ${record.performanceAssessment.scorePercent.toFixed(1)}%.`);
  practicalText.push(`Critical errors: ${record.performanceAssessment.criticalErrorCount}.`);
  practicalText.push(`Follow-up: ${transcriptFollowUpLabel(record.performanceAssessment.followUpStatus)}.`);
  if (record.performanceAssessment.reassessmentTargetDate) practicalText.push(`Reassessment target: ${record.performanceAssessment.reassessmentTargetDate}.`);
  assessments.append(transcriptElement('p', practicalText.join(' ')));
  if (record.performanceAssessment.learnerFeedback) {
    const feedback = transcriptElement('aside', '', 'record-warning'); feedback.append(transcriptElement('strong', 'Current assessor feedback / remediation'), transcriptElement('p', record.performanceAssessment.learnerFeedback)); assessments.append(feedback);
  }
  panel.append(assessments);

  const versions = transcriptElement('section', '', 'record-section'); versions.append(transcriptElement('h3', 'Course-version history'));
  if (!record.courseVersionHistory.length) {
    versions.append(transcriptElement('p', 'No account enrollment history is recorded for Course 1.', 'record-meta'));
  } else {
    const wrap = transcriptElement('div', '', 'record-version-history'); wrap.tabIndex = 0; wrap.setAttribute('aria-label', 'Course version enrollment history');
    const table = document.createElement('table'); table.className = 'record-table'; const head = document.createElement('thead'); const hr = document.createElement('tr');
    for (const label of ['Course version','Enrollment status','Enrolled','Enrollment completed']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; hr.append(th); } head.append(hr); table.append(head);
    const body = document.createElement('tbody');
    for (const row of record.courseVersionHistory) { const tr = document.createElement('tr'); for (const value of [row.courseVersion, row.status, transcriptDate(row.enrolledAt), transcriptDate(row.completedAt)]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); } body.append(tr); }
    table.append(body); wrap.append(table); versions.append(wrap);
  }
  panel.append(versions);
}

export async function initializeAcademicCourseRecord() {
  const tab = document.querySelector('#tab-course-record');
  const lessonView = document.querySelector('#lesson-view');
  if (!tab || !lessonView) return false;
  injectTranscriptStyles();
  tab.addEventListener('click', async () => {
    for (const item of document.querySelectorAll('.portal-tab')) { const active = item.id === 'tab-course-record'; item.classList.toggle('active', active); item.setAttribute('aria-pressed', active ? 'true' : 'false'); }
    const panel = transcriptElement('article', '', 'portal-panel academic-record'); panel.append(transcriptElement('p', 'Private learner academic record', 'eyebrow'), transcriptElement('h2', 'Course 1 Academic Record'), transcriptElement('p', 'Loading authoritative lesson, course-final, practical, and enrollment evidence…', 'status')); lessonView.replaceChildren(panel); lessonView.focus();
    try { renderAcademicRecord(panel, await loadAcademicRecordData()); }
    catch (error) { panel.replaceChildren(transcriptElement('p', 'Course 1 academic record', 'eyebrow'), transcriptElement('h2', 'Academic record unavailable'), transcriptElement('p', error.message, 'portal-error')); }
  });
  return true;
}

if (typeof document !== 'undefined') {
  initializeAdminDashboard();
  initializeAcademicCourseRecord();
}
