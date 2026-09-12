const COURSE_ID = 'COURSE-LH-TECH1-001';
const tab = document.querySelector('#tab-admin');
const lessonView = document.querySelector('#lesson-view');
let adminWrite = false;
let reportPayload = null;

function el(tag, text = '', className = '') {
  const node = document.createElement(tag);
  if (text !== '') node.textContent = text;
  if (className) node.className = className;
  return node;
}

function activateAdminTab() {
  for (const item of document.querySelectorAll('.portal-tab')) {
    const active = item.id === 'tab-admin';
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function statusLabel(value) {
  return ({ passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', voided: 'Voided', 'not-recorded': 'Not evaluated' })[value] ?? 'Not evaluated';
}

function followUpLabel(value) {
  return ({
    none: 'No follow-up',
    'remediation-assigned': 'Remediation assigned',
    'remediation-in-progress': 'Remediation in progress',
    'ready-for-reassessment': 'Ready for reassessment',
    'reassessment-scheduled': 'Reassessment scheduled',
    closed: 'Closed'
  })[value] ?? String(value || 'none').replaceAll('-', ' ');
}

async function loadCapabilities() {
  try {
    const response = await fetch('/api/v1/admin/capabilities', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (!response.ok) return false;
    const body = await response.json();
    adminWrite = body.adminWrite === true;
    return body.coursePracticalOperations === true;
  } catch {
    return false;
  }
}

async function loadReport() {
  const response = await fetch(`/api/v1/admin/courses/${COURSE_ID}/practical-report`, {
    headers: { accept: 'application/json' }, credentials: 'same-origin'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Admin report unavailable (${response.status})`);
  return body;
}

function metric(label, value) {
  const card = el('article', '', 'admin-metric');
  card.append(el('strong', String(value)), el('span', label));
  return card;
}

function filteredRows(rows, filters) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesSearch = !query || String(row.learnerSubject ?? '').toLowerCase().includes(query) || String(row.assignedEvaluatorId ?? '').toLowerCase().includes(query);
    const matchesStatus = !filters.status || (row.practicalStatus ?? 'not-recorded') === filters.status;
    const matchesAssignment = !filters.assignment || (filters.assignment === 'unassigned' ? !row.assignedEvaluatorId : filters.assignment === 'assigned' ? Boolean(row.assignedEvaluatorId) : row.assignedEvaluatorId === filters.assignment);
    const follow = row.followUpStatus ?? 'none';
    const matchesFollow = !filters.followUp || (filters.followUp === 'open' ? !['none', 'closed'].includes(follow) : follow === filters.followUp);
    return matchesSearch && matchesStatus && matchesAssignment && matchesFollow;
  });
}

function uniqueEvaluators(rows) {
  return [...new Set(rows.map((row) => row.assignedEvaluatorId).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function setAssignment(row, evaluatorId, statusNode) {
  statusNode.textContent = evaluatorId ? `Assigning ${row.learnerSubject}…` : `Clearing assignment for ${row.learnerSubject}…`;
  const response = await fetch(`/api/v1/admin/courses/${COURSE_ID}/practical-assignment`, {
    method: 'PUT',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ learnerSubject: row.learnerSubject, evaluatorId })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    statusNode.textContent = `Assignment not changed: ${body.error || response.status}`;
    return false;
  }
  statusNode.textContent = evaluatorId ? `Assigned ${row.learnerSubject} to ${evaluatorId}.` : `Assignment cleared for ${row.learnerSubject}.`;
  return true;
}

function assignmentControl(row, refresh, statusNode) {
  if (!adminWrite) return el('span', row.assignedEvaluatorId || 'Unassigned', 'admin-assignment-readonly');
  const wrap = el('div', '', 'admin-assignment-control');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = row.assignedEvaluatorId ?? '';
  input.maxLength = 256;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', `Assigned evaluator for ${row.learnerSubject}`);
  input.placeholder = 'Evaluator subject';
  const save = el('button', 'Set', 'admin-secondary');
  save.type = 'button';
  const clear = el('button', 'Clear', 'admin-tertiary');
  clear.type = 'button';
  clear.disabled = !row.assignedEvaluatorId;
  save.addEventListener('click', async () => {
    const evaluatorId = input.value.trim();
    if (!evaluatorId) {
      statusNode.textContent = 'Enter an evaluator subject or choose Clear.';
      return;
    }
    save.disabled = true;
    if (await setAssignment(row, evaluatorId, statusNode)) await refresh();
    save.disabled = false;
  });
  clear.addEventListener('click', async () => {
    clear.disabled = true;
    if (await setAssignment(row, '', statusNode)) await refresh();
    clear.disabled = false;
  });
  wrap.append(input, save, clear);
  return wrap;
}

function reportTable(rows, refresh, statusNode) {
  const wrap = el('div', '', 'admin-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('aria-label', 'Course 1 practical operations table');
  const table = document.createElement('table');
  table.className = 'admin-table';
  const head = document.createElement('thead');
  const hr = document.createElement('tr');
  for (const label of ['Learner', 'Practical', 'Score', 'Critical', 'Follow-up', 'Reassessment', 'Evaluator assignment', 'Updated']) {
    const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; hr.append(th);
  }
  head.append(hr); table.append(head);
  const body = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    const values = [row.learnerSubject ?? '', statusLabel(row.practicalStatus), row.scorePercent == null ? '—' : `${Number(row.scorePercent).toFixed(1)}%`, String(Number(row.criticalErrorCount ?? 0)), followUpLabel(row.followUpStatus), row.reassessmentTargetDate || '—'];
    for (const value of values) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
    const assign = document.createElement('td'); assign.append(assignmentControl(row, refresh, statusNode)); tr.append(assign);
    const updated = document.createElement('td'); updated.textContent = row.updatedAt ? new Date(row.updatedAt).toLocaleString() : (row.enrolledAt ? new Date(row.enrolledAt).toLocaleDateString() : '—'); tr.append(updated);
    body.append(tr);
  }
  table.append(body); wrap.append(table); return wrap;
}

function downloadCsv() {
  const anchor = document.createElement('a');
  anchor.href = `/api/v1/admin/courses/${COURSE_ID}/practical-report?format=csv`;
  anchor.download = 'course-1-practical-report.csv';
  anchor.rel = 'noopener';
  document.body.append(anchor); anchor.click(); anchor.remove();
}

async function renderAdminDashboard() {
  activateAdminTab();
  const panel = el('article', '', 'portal-panel admin-panel');
  panel.append(el('p', 'Authorized Course 1 operations', 'eyebrow'), el('h2', 'Course 1 Operations Dashboard'));
  panel.append(el('p', 'Manage practical workload, evaluator ownership, remediation and reassessment follow-up, and privacy-bounded cohort reporting. This dashboard does not alter public academic content or issue professional credentials.', 'lede'));
  const statusNode = el('p', 'Loading Course 1 operations…', 'admin-status');
  statusNode.setAttribute('aria-live', 'polite');
  panel.append(statusNode);
  lessonView.replaceChildren(panel); lessonView.focus();

  async function refresh() {
    try {
      reportPayload = await loadReport();
      renderReport();
    } catch (error) {
      statusNode.textContent = error.message;
    }
  }

  function renderReport() {
    const payload = reportPayload ?? { summary: {}, rows: [] };
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    panel.querySelectorAll('.admin-runtime').forEach((node) => node.remove());
    statusNode.textContent = `${rows.length} learner operational record${rows.length === 1 ? '' : 's'} loaded.`;

    const runtime = el('div', '', 'admin-runtime');
    const summary = payload.summary ?? {};
    const metrics = el('section', '', 'admin-metrics');
    metrics.setAttribute('aria-label', 'Course 1 practical cohort summary');
    metrics.append(metric('Learners', summary.total ?? rows.length), metric('Not evaluated', summary.notRecorded ?? 0), metric('In progress', summary.inProgress ?? 0), metric('Not passed', summary.failed ?? 0), metric('Passed', summary.passed ?? 0), metric('Follow-up open', summary.followUpOpen ?? 0), metric('Unassigned', summary.unassigned ?? 0));
    runtime.append(metrics);

    const toolbar = el('section', '', 'admin-toolbar');
    const exportButton = el('button', 'Export CSV', 'admin-primary'); exportButton.type = 'button'; exportButton.addEventListener('click', downloadCsv);
    const reloadButton = el('button', 'Refresh report', 'admin-secondary'); reloadButton.type = 'button'; reloadButton.addEventListener('click', refresh);
    toolbar.append(exportButton, reloadButton);
    if (!adminWrite) toolbar.append(el('span', 'Read-only administrator access', 'admin-readonly-badge'));
    runtime.append(toolbar);

    const filters = el('section', '', 'admin-filters');
    const makeField = (labelText, control) => { const label = el('label', '', 'admin-field'); label.append(el('span', labelText), control); return label; };
    const search = document.createElement('input'); search.type = 'search'; search.autocomplete = 'off'; search.placeholder = 'Learner or evaluator subject…';
    const practical = document.createElement('select');
    for (const [value, label] of [['', 'All practical states'], ['not-recorded', 'Not evaluated'], ['in-progress', 'In progress'], ['failed', 'Not passed'], ['passed', 'Passed'], ['voided', 'Voided']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; practical.append(option); }
    const assignment = document.createElement('select');
    for (const [value, label] of [['', 'All assignments'], ['unassigned', 'Unassigned'], ['assigned', 'Any assigned']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; assignment.append(option); }
    for (const evaluator of uniqueEvaluators(rows)) { const option = document.createElement('option'); option.value = evaluator; option.textContent = evaluator; assignment.append(option); }
    const follow = document.createElement('select');
    for (const [value, label] of [['', 'All follow-up states'], ['open', 'Any open follow-up'], ['remediation-assigned', 'Remediation assigned'], ['remediation-in-progress', 'Remediation in progress'], ['ready-for-reassessment', 'Ready for reassessment'], ['reassessment-scheduled', 'Reassessment scheduled'], ['closed', 'Closed']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; follow.append(option); }
    filters.append(makeField('Search', search), makeField('Practical status', practical), makeField('Assignment', assignment), makeField('Follow-up', follow));
    runtime.append(filters);

    const resultsStatus = el('p', '', 'admin-status'); resultsStatus.setAttribute('aria-live', 'polite'); runtime.append(resultsStatus);
    const tableHost = el('div', '', 'admin-table-host'); runtime.append(tableHost);
    function applyFilters() {
      const visible = filteredRows(rows, { search: search.value, status: practical.value, assignment: assignment.value, followUp: follow.value });
      resultsStatus.textContent = `${visible.length} of ${rows.length} learner${rows.length === 1 ? '' : 's'} shown.`;
      tableHost.replaceChildren(reportTable(visible, refresh, statusNode));
    }
    for (const control of [search, practical, assignment, follow]) control.addEventListener(control === search ? 'input' : 'change', applyFilters);
    applyFilters();
    panel.append(runtime);
  }

  await refresh();
}

async function initializeAdminCapability() {
  if (!tab) return;
  const allowed = await loadCapabilities();
  tab.hidden = !allowed;
  if (allowed) tab.addEventListener('click', renderAdminDashboard);
}

initializeAdminCapability();
