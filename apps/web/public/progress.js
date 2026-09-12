const STORAGE_KEY = 'thc-academy-progress-v1';
const ADMIN_COURSE_ID = 'COURSE-LH-TECH1-001';

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

if (typeof document !== 'undefined') initializeAdminDashboard();
