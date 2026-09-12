const COURSE_ID = 'COURSE-LH-TECH1-001';
const tab = document.querySelector('#tab-assessor');
const lessonView = document.querySelector('#lesson-view');
let currentPayload = null;
let currentLearnerSubject = '';

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
  return ({ passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', voided: 'Voided' })[value] ?? 'Not evaluated';
}

function renderAssessorHome() {
  setAssessorTabActive();
  const panel = el('article', '', 'portal-panel assessor-panel');
  panel.append(el('p', 'Authorized Course 1 evaluation', 'eyebrow'));
  panel.append(el('h2', 'Practical Assessor Workspace'));
  panel.append(el('p', 'Load a learner by the external subject used by the Academy identity system. Official scoring is calculated and saved by the server; this interface does not issue a professional credential.', 'lede'));

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
  panel.append(lookup);
  lessonView.replaceChildren(panel);
  lessonView.focus();
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
      el('span', `${Number(current.historyCount ?? 0)} prior finalized revision${Number(current.historyCount ?? 0) === 1 ? '' : 's'} preserved`)
    );
    summary.append(line);
  }
  panel.append(summary);
}

function renderEvaluationForm(payload) {
  setAssessorTabActive();
  const practical = payload.practical;
  const current = payload.evaluation;
  const panel = el('article', '', 'portal-panel assessor-panel');
  panel.append(el('p', 'Authorized Course 1 evaluation', 'eyebrow'));
  panel.append(el('h2', practical.title));
  panel.append(el('p', `Learner: ${payload.learner.subject}`, 'assessor-learner'));
  panel.append(el('p', `Passing standard: ${Number(practical.passingStandard.minimumPercent).toFixed(0)}%${practical.passingStandard.noCriticalErrors ? ' and no critical errors' : ''}.`, 'lede'));
  renderExistingSummary(panel, payload);

  const form = el('form', '', 'assessor-form');
  const existingByName = new Map((current?.domainScores ?? []).map((row) => [row.name, row.score]));
  const scoreSection = el('section', '', 'assessor-section');
  scoreSection.append(el('h3', 'Eight scoring domains'));
  const domainGrid = el('div', '', 'assessor-domain-grid');
  const refresh = () => updatePreview(form, practical);
  for (const domain of practical.scoring.domains) domainGrid.append(inputRow(domain, existingByName.get(domain.name), refresh));
  scoreSection.append(domainGrid, el('p', '', 'assessor-score-preview'));
  form.append(scoreSection);

  const criticalSection = el('section', '', 'assessor-section assessor-critical');
  criticalSection.append(el('h3', 'Critical-error findings'));
  const selectedCritical = new Set((current?.criticalErrors ?? []).map((row) => Number(row.index)));
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

  const notes = el('section', '', 'assessor-section assessor-notes');
  notes.append(el('h3', 'Evaluation notes and learner remediation'));
  const privateLabel = el('label', '', 'assessor-field');
  privateLabel.append(el('span', 'Evaluator notes (private)'));
  const privateNotes = document.createElement('textarea');
  privateNotes.name = 'evaluatorNotes';
  privateNotes.maxLength = 4000;
  privateNotes.rows = 5;
  privateNotes.value = current?.evaluatorNotes ?? '';
  privateLabel.append(privateNotes);
  const learnerLabel = el('label', '', 'assessor-field');
  learnerLabel.append(el('span', 'Learner feedback / remediation'));
  const learnerFeedback = document.createElement('textarea');
  learnerFeedback.name = 'learnerFeedback';
  learnerFeedback.maxLength = 2500;
  learnerFeedback.rows = 5;
  learnerFeedback.value = current?.learnerFeedback ?? '';
  learnerLabel.append(learnerFeedback);
  notes.append(privateLabel, learnerLabel);
  form.append(notes);

  const confirmation = el('label', '', 'assessor-confirm');
  const confirmInput = document.createElement('input');
  confirmInput.type = 'checkbox';
  confirmation.append(confirmInput, el('span', 'I confirm the domain scores and critical-error findings reflect the evaluated practical evidence.'));
  form.append(confirmation);

  const actions = el('div', '', 'assessor-actions');
  const save = el('button', 'Save in-progress evaluation', 'assessor-secondary');
  save.type = 'button';
  const finalize = el('button', 'Finalize evaluation', 'assessor-primary');
  finalize.type = 'button';
  const back = el('button', 'Load another learner', 'assessor-secondary');
  back.type = 'button';
  back.addEventListener('click', renderAssessorHome);
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
      domainScores: collectDomainScores(form),
      criticalErrorIndexes: collectCriticalIndexes(form),
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

initializeAssessorCapability();
