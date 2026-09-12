const COURSE_ID = 'COURSE-LH-TECH1-001';
const tab = document.querySelector('#tab-assessor');
const lessonView = document.querySelector('#lesson-view');
let currentPayload = null;
let currentLearnerSubject = '';
let learnerFeedbackKey = '';
let reassessmentMode = false;

function el(tag, value = '', className = '') {
  const node = document.createElement(tag);
  if (value !== '') node.textContent = value;
  if (className) node.className = className;
  return node;
}

function setAssessorTabActive() {
  for (const item of document.querySelectorAll('.portal-tab')) {
    const active = item.id === 'tab-assessor';
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

async function capability() {
  try {
    const response = await fetch('/api/v1/evaluator/capabilities', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (!response.ok) return false;
    const body = await response.json();
    return body.coursePracticalEvaluation === true;
  } catch {
    return false;
  }
}

function statusLabel(value) {
  return ({ passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', voided: 'Voided', 'not-recorded': 'Not evaluated' })[value] ?? 'Not evaluated';
}

function followUpLabel(value) {
  return ({
    none: 'No follow-up set',
    'remediation-assigned': 'Remediation assigned',
    'remediation-in-progress': 'Remediation in progress',
    'ready-for-reassessment': 'Ready for reassessment',
    'reassessment-scheduled': 'Reassessment scheduled',
    closed: 'Closed'
  })[value] ?? String(value ?? 'none').replaceAll('-', ' ');
}

async function loadAssessorQueue() {
  const response = await fetch(`/api/v1/evaluator/courses/${COURSE_ID}/practical-evaluation`, {
    headers: { accept: 'application/json' }, credentials: 'same-origin'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Queue unavailable (${response.status})`);
  return body;
}

function queueMetric(label, value) {
  const card = el('div', '', 'assessor-queue-metric');
  card.append(el('strong', String(value)), el('span', label));
  return card;
}

function queueRow(row, openLearner) {
  const item = el('article', '', 'assessor-queue-row');
  item.dataset.status = row.practicalStatus ?? 'not-recorded';
  item.dataset.search = String(row.learnerSubject ?? '').toLowerCase();
  const identity = el('div', '', 'assessor-queue-identity');
  identity.append(el('strong', row.learnerSubject || 'Unknown learner'));
  const meta = [];
  meta.push(statusLabel(row.practicalStatus));
  if (row.scorePercent != null) meta.push(`${Number(row.scorePercent).toFixed(1)}%`);
  if (Number(row.criticalErrorCount ?? 0) > 0) meta.push(`${row.criticalErrorCount} critical error${Number(row.criticalErrorCount) === 1 ? '' : 's'}`);
  if (row.followUpStatus && row.followUpStatus !== 'none') meta.push(followUpLabel(row.followUpStatus));
  if (row.reassessmentTargetDate) meta.push(`target ${row.reassessmentTargetDate}`);
  identity.append(el('span', meta.join(' • '), 'assessor-queue-meta'));
  const action = el('button', row.practicalStatus === 'not-recorded' ? 'Start evaluation' : 'Open evaluation', 'assessor-secondary assessor-queue-open');
  action.type = 'button';
  action.addEventListener('click', () => openLearner(row.learnerSubject));
  item.append(identity, action);
  return item;
}

async function renderAssessorHome() {
  setAssessorTabActive();
  reassessmentMode = false;
  const panel = el('article', '', 'portal-panel assessor-panel');
  panel.append(el('p', 'Authorized Course 1 evaluation', 'eyebrow'));
  panel.append(el('h2', 'Practical Assessor Workspace'));
  panel.append(el('p', 'Review enrolled learners, track practical evidence, score the eight canonical performance domains, document remediation, and manage equivalent reassessment. Official results are calculated and saved by the server; this workspace does not issue a professional credential.', 'lede'));
  const loading = el('p', 'Loading evaluator queue…', 'assessor-status');
  panel.append(loading);
  lessonView.replaceChildren(panel);
  lessonView.focus();

  let queue;
  try {
    queue = await loadAssessorQueue();
  } catch (error) {
    loading.textContent = error.message;
    return;
  }
  loading.remove();
  const learners = Array.isArray(queue.learners) ? queue.learners : [];
  const counts = learners.reduce((out, row) => {
    const key = row.practicalStatus ?? 'not-recorded';
    out[key] = (out[key] ?? 0) + 1;
    if (row.followUpStatus && !['none', 'closed'].includes(row.followUpStatus)) out.followUp += 1;
    return out;
  }, { 'not-recorded': 0, 'in-progress': 0, passed: 0, failed: 0, voided: 0, followUp: 0 });

  const metrics = el('div', '', 'assessor-queue-metrics');
  metrics.append(
    queueMetric('Learners', learners.length),
    queueMetric('Not evaluated', counts['not-recorded']),
    queueMetric('In progress', counts['in-progress']),
    queueMetric('Not passed', counts.failed),
    queueMetric('Follow-up open', counts.followUp),
    queueMetric('Passed', counts.passed)
  );
  panel.append(metrics);

  const controls = el('div', '', 'assessor-queue-controls');
  const searchLabel = el('label', '', 'assessor-field');
  searchLabel.append(el('span', 'Search learner'));
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search learner subject…';
  search.autocomplete = 'off';
  searchLabel.append(search);
  const statusLabelNode = el('label', '', 'assessor-field');
  statusLabelNode.append(el('span', 'Practical status'));
  const filter = document.createElement('select');
  for (const [value, label] of [['', 'All statuses'], ['not-recorded', 'Not evaluated'], ['in-progress', 'In progress'], ['failed', 'Not passed'], ['passed', 'Passed'], ['voided', 'Voided']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    filter.append(option);
  }
  statusLabelNode.append(filter);
  controls.append(searchLabel, statusLabelNode);
  panel.append(controls);

  const queueStatus = el('p', '', 'assessor-status');
  const list = el('div', '', 'assessor-queue-list');
  const openLearner = async (subject) => {
    currentLearnerSubject = subject;
    await loadEvaluation(queueStatus);
  };
  for (const row of learners) list.append(queueRow(row, openLearner));
  panel.append(queueStatus, list);

  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    const wantedStatus = filter.value;
    let shown = 0;
    for (const row of list.querySelectorAll('.assessor-queue-row')) {
      const visible = (!query || row.dataset.search.includes(query)) && (!wantedStatus || row.dataset.status === wantedStatus);
      row.hidden = !visible;
      if (visible) shown += 1;
    }
    queueStatus.textContent = `${shown} of ${learners.length} learner${learners.length === 1 ? '' : 's'} shown.`;
  }
  search.addEventListener('input', applyFilters);
  filter.addEventListener('change', applyFilters);
  applyFilters();

  const manual = document.createElement('details');
  manual.className = 'assessor-manual-lookup';
  const manualSummary = document.createElement('summary');
  manualSummary.textContent = 'Load a learner subject manually';
  manual.append(manualSummary);
  const lookup = el('form', '', 'assessor-lookup');
  const label = el('label', '', 'assessor-field');
  label.append(el('span', 'Learner subject'));
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'learnerSubject';
  input.autocomplete = 'off';
  input.maxLength = 256;
  input.required = true;
  input.placeholder = 'Learner identity subject';
  label.append(input);
  const button = el('button', 'Load learner practical', 'assessor-primary');
  button.type = 'submit';
  const status = el('p', '', 'assessor-status');
  lookup.append(label, button, status);
  lookup.addEventListener('submit', async (event) => {
    event.preventDefault();
    currentLearnerSubject = input.value.trim();
    if (!currentLearnerSubject) return;
    button.disabled = true;
    status.textContent = 'Loading practical record…';
    await loadEvaluation(status);
    button.disabled = false;
  });
  manual.append(lookup);
  panel.append(manual);
}

async function loadEvaluation(statusNode = null) {
  const url = `/api/v1/evaluator/courses/${COURSE_ID}/practical-evaluation?learnerSubject=${encodeURIComponent(currentLearnerSubject)}`;
  const response = await fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (statusNode) statusNode.textContent = body.error === 'learner-not-found' ? 'Learner record not found.' : `Unable to load practical: ${body.error || response.status}`;
    return;
  }
  currentPayload = body;
  reassessmentMode = false;
  renderEvaluationForm(body);
}

function inputRow(domain, existingScore, updatePreview) {
  const label = el('label', '', 'assessor-domain-row');
  const copy = el('span', '', 'assessor-domain-copy');
  copy.append(el('strong', domain.name), el('small', `0–${domain.points} points`));
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(domain.points);
  input.step = '0.5';
  input.inputMode = 'decimal';
  input.dataset.domain = domain.name;
  input.dataset.points = String(domain.points);
  if (existingScore != null) input.value = String(existingScore);
  input.addEventListener('input', updatePreview);
  label.append(copy, input);
  return label;
}

function collectDomainScores(form) {
  return [...form.querySelectorAll('input[data-domain]')]
    .filter((input) => input.value !== '')
    .map((input) => ({ name: input.dataset.domain, score: Number(input.value) }));
}

function collectCriticalIndexes(form) {
  return [...form.querySelectorAll('input[data-critical-index]:checked')].map((input) => Number(input.dataset.criticalIndex));
}

function collectEvidenceOutputs(form) {
  return [...form.querySelectorAll('.assessor-evidence-row')].map((row) => ({
    name: row.dataset.evidenceName,
    status: row.querySelector('[data-evidence-status]').value,
    reference: row.querySelector('[data-evidence-reference]').value,
    note: row.querySelector('[data-evidence-note]').value
  }));
}

function updatePreview(form, practical) {
  const output = form.querySelector('.assessor-score-preview');
  if (!output) return;
  const scores = collectDomainScores(form);
  const earned = scores.reduce((sum, row) => sum + Number(row.score), 0);
  const total = Number(practical.scoring.totalPoints || 100);
  const percent = total > 0 ? earned / total * 100 : 0;
  const critical = collectCriticalIndexes(form).length;
  const complete = scores.length === practical.scoring.domains.length;
  const projected = complete ? (percent >= Number(practical.passingStandard.minimumPercent) && critical === 0 ? 'Projected pass' : 'Projected not passed') : 'Incomplete scoring';
  output.textContent = `${earned.toFixed(1)}/${total} points • ${percent.toFixed(1)}% • ${critical} critical error${critical === 1 ? '' : 's'} • ${projected}. Server result is authoritative.`;
}

function renderExistingSummary(panel, payload) {
  const current = payload.evaluation;
  const summary = el('section', '', 'assessor-current');
  summary.append(el('h3', 'Current authoritative record'));
  if (!current) {
    summary.append(el('p', 'No Course 1 practical evaluation is recorded for this learner.'));
  } else {
    const line = el('div', '', 'assessor-current-grid');
    line.append(
      el('strong', statusLabel(current.status), `course-evidence-status status-${current.status}`),
      el('span', current.scorePercent == null ? 'No finalized score' : `${Number(current.scorePercent).toFixed(1)}%`),
      el('span', `${Number(current.criticalErrorCount ?? 0)} critical error${Number(current.criticalErrorCount ?? 0) === 1 ? '' : 's'}`),
      el('span', followUpLabel(current.followUpStatus)),
      el('span', `${Number(current.historyCount ?? 0)} prior finalized revision${Number(current.historyCount ?? 0) === 1 ? '' : 's'} preserved`)
    );
    summary.append(line);
  }
  panel.append(summary);
}

function renderHistory(panel, current) {
  if (!Array.isArray(current?.history) || current.history.length === 0) return;
  const details = document.createElement('details');
  details.className = 'assessor-history';
  const summary = document.createElement('summary');
  summary.textContent = `Evaluation history (${current.history.length})`;
  details.append(summary);
  const list = el('div', '', 'assessor-history-list');
  [...current.history].reverse().forEach((revision, offset) => {
    const card = el('article', '', 'assessor-history-card');
    const index = current.history.length - offset;
    card.append(el('h4', `Revision ${index}: ${statusLabel(revision.status)}`));
    const parts = [];
    if (revision.scorePercent != null) parts.push(`${Number(revision.scorePercent).toFixed(1)}%`);
    parts.push(`${Number(revision.criticalErrorCount ?? 0)} critical errors`);
    if (revision.evaluatedAt) parts.push(new Date(revision.evaluatedAt).toLocaleString());
    card.append(el('p', parts.join(' • '), 'assessor-queue-meta'));
    if (revision.followUpStatus) card.append(el('p', followUpLabel(revision.followUpStatus)));
    if (revision.learnerFeedback) card.append(el('p', `Learner feedback: ${revision.learnerFeedback}`));
    list.append(card);
  });
  details.append(list);
  panel.append(details);
}

function evidenceOutputRow(output, existing, statuses) {
  const row = el('article', '', 'assessor-evidence-row');
  row.dataset.evidenceName = output;
  row.append(el('h4', output));
  const grid = el('div', '', 'assessor-evidence-fields');
  const statusLabelNode = el('label', '', 'assessor-field');
  statusLabelNode.append(el('span', 'Review status'));
  const status = document.createElement('select');
  status.dataset.evidenceStatus = 'true';
  for (const value of statuses) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value.replaceAll('-', ' ');
    option.selected = (existing?.status ?? 'not-reviewed') === value;
    status.append(option);
  }
  statusLabelNode.append(status);
  const refLabel = el('label', '', 'assessor-field');
  refLabel.append(el('span', 'Evidence reference'));
  const reference = document.createElement('input');
  reference.type = 'text';
  reference.maxLength = 500;
  reference.placeholder = 'Artifact name, storage reference, packet/page, or controlled evidence locator';
  reference.value = existing?.reference ?? '';
  reference.dataset.evidenceReference = 'true';
  refLabel.append(reference);
  grid.append(statusLabelNode, refLabel);
  const noteLabel = el('label', '', 'assessor-field');
  noteLabel.append(el('span', 'Evidence note'));
  const note = document.createElement('textarea');
  note.rows = 2;
  note.maxLength = 1000;
  note.value = existing?.note ?? '';
  note.dataset.evidenceNote = 'true';
  noteLabel.append(note);
  row.append(grid, noteLabel);
  return row;
}

function renderEvaluationForm(payload) {
  setAssessorTabActive();
  const practical = payload.practical;
  const current = payload.evaluation;
  const panel = el('article', '', 'portal-panel assessor-panel');
  panel.append(el('p', reassessmentMode ? 'Equivalent Course 1 reassessment' : 'Authorized Course 1 evaluation', 'eyebrow'));
  panel.append(el('h2', practical.title));
  panel.append(el('p', `Learner: ${payload.learner.subject}`, 'assessor-learner'));
  panel.append(el('p', `Passing standard: ${Number(practical.passingStandard.minimumPercent).toFixed(0)}%${practical.passingStandard.noCriticalErrors ? ' and no critical errors' : ''}. Evidence references identify the evaluated learner artifacts; they do not replace the evidence itself.`, 'lede'));
  renderExistingSummary(panel, payload);
  renderHistory(panel, current);

  const form = el('form', '', 'assessor-form');
  const existingByName = reassessmentMode ? new Map() : new Map((current?.domainScores ?? []).map((row) => [row.name, row.score]));
  const scoreSection = el('section', '', 'assessor-section');
  scoreSection.append(el('h3', 'Performance scoring domains'));
  const domainGrid = el('div', '', 'assessor-domain-grid');
  const refresh = () => updatePreview(form, practical);
  for (const domain of practical.scoring.domains) domainGrid.append(inputRow(domain, existingByName.get(domain.name), refresh));
  scoreSection.append(domainGrid, el('p', '', 'assessor-score-preview'));
  form.append(scoreSection);

  const evidenceSection = el('section', '', 'assessor-section assessor-evidence');
  evidenceSection.append(el('h3', 'Required practical evidence outputs'));
  evidenceSection.append(el('p', 'Track the current practical definition dynamically. New or revised evidence outputs in the canonical practical can appear here without changing a hard-coded count.', 'assessor-help'));
  const existingEvidence = new Map((reassessmentMode ? [] : current?.evidenceOutputs ?? []).map((row) => [row.name, row]));
  const evidenceGrid = el('div', '', 'assessor-evidence-grid');
  const evidenceStatuses = practical.evidenceOutputStatuses ?? ['not-reviewed', 'received', 'verified', 'needs-revision'];
  for (const output of practical.evidenceOutputs ?? []) evidenceGrid.append(evidenceOutputRow(output, existingEvidence.get(output), evidenceStatuses));
  evidenceSection.append(evidenceGrid);
  form.append(evidenceSection);

  const criticalSection = el('section', '', 'assessor-section assessor-critical');
  criticalSection.append(el('h3', 'Critical-error findings'));
  const selectedCritical = reassessmentMode ? new Set() : new Set((current?.criticalErrors ?? []).map((row) => Number(row.index)));
  practical.criticalErrors.forEach((description, index) => {
    const label = el('label', '', 'assessor-check-row');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.criticalIndex = String(index);
    input.checked = selectedCritical.has(index);
    input.addEventListener('change', refresh);
    label.append(input, el('span', description));
    criticalSection.append(label);
  });
  form.append(criticalSection);

  const followUp = el('section', '', 'assessor-section assessor-follow-up');
  followUp.append(el('h3', 'Remediation and reassessment state'));
  const followGrid = el('div', '', 'assessor-follow-grid');
  const followLabel = el('label', '', 'assessor-field');
  followLabel.append(el('span', 'Follow-up status'));
  const followSelect = document.createElement('select');
  followSelect.name = 'followUpStatus';
  for (const value of practical.followUpStatuses ?? ['none', 'remediation-assigned', 'remediation-in-progress', 'ready-for-reassessment', 'reassessment-scheduled', 'closed']) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = followUpLabel(value);
    option.selected = (reassessmentMode ? 'none' : current?.followUpStatus ?? 'none') === value;
    followSelect.append(option);
  }
  followLabel.append(followSelect);
  const dateLabel = el('label', '', 'assessor-field');
  dateLabel.append(el('span', 'Reassessment target date (optional unless scheduled)'));
  const date = document.createElement('input');
  date.type = 'date';
  date.name = 'reassessmentTargetDate';
  date.value = reassessmentMode ? '' : current?.reassessmentTargetDate ?? '';
  dateLabel.append(date);
  followGrid.append(followLabel, dateLabel);
  followUp.append(followGrid);
  form.append(followUp);

  const notes = el('section', '', 'assessor-section assessor-notes');
  notes.append(el('h3', 'Evaluation notes and learner remediation'));
  const privateLabel = el('label', '', 'assessor-field');
  privateLabel.append(el('span', 'Evaluator notes (private)'));
  const privateNotes = document.createElement('textarea');
  privateNotes.name = 'evaluatorNotes';
  privateNotes.maxLength = 4000;
  privateNotes.rows = 5;
  privateNotes.value = reassessmentMode ? '' : current?.evaluatorNotes ?? '';
  privateLabel.append(privateNotes);
  const learnerLabel = el('label', '', 'assessor-field');
  learnerLabel.append(el('span', 'Learner feedback / remediation'));
  const learnerFeedback = document.createElement('textarea');
  learnerFeedback.name = 'learnerFeedback';
  learnerFeedback.maxLength = 2500;
  learnerFeedback.rows = 5;
  learnerFeedback.value = reassessmentMode ? '' : current?.learnerFeedback ?? '';
  learnerLabel.append(learnerFeedback);
  notes.append(privateLabel, learnerLabel);
  form.append(notes);

  const confirmation = el('label', '', 'assessor-confirm');
  const confirmInput = document.createElement('input');
  confirmInput.type = 'checkbox';
  confirmation.append(confirmInput, el('span', 'I confirm the domain scores, evidence review statuses, and critical-error findings reflect the evaluated practical evidence.'));
  form.append(confirmation);

  const actions = el('div', '', 'assessor-actions');
  const save = el('button', reassessmentMode ? 'Save reassessment in progress' : 'Save in-progress evaluation', 'assessor-secondary');
  save.type = 'button';
  const finalize = el('button', reassessmentMode ? 'Finalize reassessment' : 'Finalize evaluation', 'assessor-primary');
  finalize.type = 'button';
  const back = el('button', 'Return to evaluator queue', 'assessor-secondary');
  back.type = 'button';
  back.addEventListener('click', renderAssessorHome);
  if (current && ['passed', 'failed', 'voided'].includes(current.status) && !reassessmentMode) {
    const reassess = el('button', 'Start equivalent reassessment', 'assessor-secondary');
    reassess.type = 'button';
    reassess.addEventListener('click', () => {
      reassessmentMode = true;
      renderEvaluationForm(payload);
    });
    actions.append(reassess);
  }
  const status = el('p', '', 'assessor-status');
  actions.append(save, finalize, back);
  form.append(actions, status);

  async function submit(mode) {
    if (mode === 'finalize' && !confirmInput.checked) {
      status.textContent = 'Confirm the evaluation statement before finalizing.';
      return;
    }
    save.disabled = true;
    finalize.disabled = true;
    status.textContent = mode === 'finalize' ? 'Finalizing official practical result…' : 'Saving in-progress evaluation…';
    const body = {
      learnerSubject: payload.learner.subject,
      mode,
      startReassessment: reassessmentMode,
      domainScores: collectDomainScores(form),
      evidenceOutputs: collectEvidenceOutputs(form),
      criticalErrorIndexes: collectCriticalIndexes(form),
      followUpStatus: followSelect.value,
      reassessmentTargetDate: date.value,
      evaluatorNotes: privateNotes.value,
      learnerFeedback: learnerFeedback.value
    };
    const response = await fetch(`/api/v1/evaluator/courses/${COURSE_ID}/practical-evaluation`, {
      method: 'PUT',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      status.textContent = `Evaluation not saved: ${result.error || response.status}`;
      save.disabled = false;
      finalize.disabled = false;
      return;
    }
    currentPayload = result;
    currentLearnerSubject = result.learner.subject;
    reassessmentMode = false;
    renderEvaluationForm(result);
  }

  save.addEventListener('click', () => submit('save'));
  finalize.addEventListener('click', () => submit('finalize'));
  panel.append(form);
  lessonView.replaceChildren(panel);
  lessonView.focus();
  refresh();
}

async function initializeAssessorCapability() {
  if (!tab) return;
  const allowed = await capability();
  tab.hidden = !allowed;
  if (allowed) tab.addEventListener('click', renderAssessorHome);
}

async function injectLearnerPracticalFeedback() {
  const host = lessonView?.querySelector('.course-practical-personal-status');
  if (!host || host.querySelector('.course-practical-evaluator-feedback')) return;
  try {
    const response = await fetch(`/api/v1/me/courses/${COURSE_ID}/evidence`, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (!response.ok) return;
    const body = await response.json();
    const practical = body.performanceAssessment ?? {};
    const feedback = String(practical.remediationSummary ?? '').trim();
    if (!feedback) return;
    const key = `${practical.updatedAt ?? ''}:${feedback}`;
    if (key === learnerFeedbackKey && host.querySelector('.course-practical-evaluator-feedback')) return;
    learnerFeedbackKey = key;
    const card = el('aside', '', 'course-practical-remediation course-practical-evaluator-feedback');
    card.setAttribute('aria-label', 'Assessor feedback and remediation');
    card.append(el('strong', 'Assessor feedback / remediation'), el('p', feedback));
    host.append(card);
  } catch {
    // Public academic practical remains fully usable when private learner evidence is unavailable.
  }
}

initializeAssessorCapability();
if (lessonView) {
  new MutationObserver(() => injectLearnerPracticalFeedback()).observe(lessonView, { childList: true, subtree: true });
  injectLearnerPracticalFeedback();
}
