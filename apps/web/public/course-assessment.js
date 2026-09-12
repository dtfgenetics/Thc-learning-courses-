import { renderRichBlocks } from './rich-content.js';

const COURSE_ID = 'COURSE-LH-TECH1-001';
const lessonView = document.querySelector('#lesson-view');
const catalogRoot = document.querySelector('#catalog');
const pendingSaves = new Set();
const saveChains = new Map();
let currentAttempt = null;

function el(tag, value = '', className = '') {
  const node = document.createElement(tag);
  if (value !== '') node.textContent = value;
  if (className) node.className = className;
  return node;
}

function setCurriculumTabActive() {
  for (const tab of document.querySelectorAll('.portal-tab')) {
    const active = tab.id === 'tab-catalog';
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

async function courseEvidence() {
  const response = await fetch(`/api/v1/me/courses/${COURSE_ID}/evidence`, {
    headers: { accept: 'application/json' }, credentials: 'same-origin'
  });
  if (response.status === 401 || response.status === 403) return { state: 'authentication-required' };
  if (!response.ok) return { state: 'unavailable' };
  return { state: 'loaded', data: await response.json() };
}

function courseActionLabel(outcome) {
  if (outcome === 'in-progress') return 'Continue course final';
  if (outcome === 'not-passed') return 'Retake course final';
  if (outcome === 'passed') return 'Retake course final';
  return 'Start course final';
}

function updateEvidenceRow(panel, evidence) {
  const written = evidence?.writtenAssessment;
  if (!written) return;
  const row = [...panel.querySelectorAll('.course-evidence-row')].find((entry) => entry.querySelector('strong')?.textContent === 'Course final');
  if (!row) return;
  const badge = row.querySelector('.course-evidence-status');
  if (badge) {
    const labels = { passed: 'Passed', 'not-passed': 'Not passed', 'in-progress': 'In progress', 'not-attempted': 'Not attempted' };
    badge.textContent = labels[written.outcome] ?? String(written.outcome ?? '').replaceAll('-', ' ');
    badge.className = `course-evidence-status status-${written.outcome ?? 'not-attempted'}`;
  }
  const detail = row.querySelector('.course-evidence-detail');
  const parts = [];
  if (written.bestScorePercent != null) parts.push(`${Number(written.bestScorePercent).toFixed(0)}% best`);
  if (written.passingScorePercent != null) parts.push(`pass ${Number(written.passingScorePercent).toFixed(0)}%`);
  if (Number(written.attemptCount ?? 0) > 0) parts.push(`${written.attemptCount} attempt${Number(written.attemptCount) === 1 ? '' : 's'}`);
  if (detail) detail.textContent = parts.join(' • ');
}

async function enhanceEvidencePanel(panel) {
  if (!panel || panel.dataset.assessmentEnhanced === 'true') return;
  panel.dataset.assessmentEnhanced = 'true';
  const result = await courseEvidence().catch(() => ({ state: 'unavailable' }));
  if (!panel.isConnected || result.state !== 'loaded') return;
  updateEvidenceRow(panel, result.data);
  const written = result.data?.writtenAssessment ?? {};
  const actions = el('div', '', 'course-assessment-actions');
  const button = el('button', courseActionLabel(written.outcome), 'course-assessment-launch');
  button.type = 'button';
  button.addEventListener('click', () => openCourseAssessment(button));
  actions.append(button);
  panel.append(actions);
}

function observeEvidencePanel() {
  const panel = catalogRoot?.querySelector('.course-evidence-panel');
  if (panel) enhanceEvidencePanel(panel);
}

async function openCourseAssessment(sourceButton) {
  sourceButton.disabled = true;
  const original = sourceButton.textContent;
  sourceButton.textContent = 'Opening final…';
  try {
    const response = await fetch(`/api/v1/me/courses/${COURSE_ID}/assessment-attempts`, {
      method: 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error === 'authentication-required' ? 'Sign in to start the official course final.' : body.error || `Assessment unavailable (${response.status}).`);
    renderAssessment(body);
  } catch (error) {
    sourceButton.textContent = original;
    sourceButton.disabled = false;
    const note = el('p', error.message, 'portal-error');
    sourceButton.closest('.course-assessment-actions')?.append(note);
  }
}

function answerCount(panel) {
  return [...panel.querySelectorAll('.course-assessment-item')].filter((item) => item.dataset.answered === 'true').length;
}

function allAnsweredAndSaved(panel) {
  const items = [...panel.querySelectorAll('.course-assessment-item')];
  return items.length > 0 && items.every((item) => item.dataset.answered === 'true' && item.dataset.saved === 'true');
}

function updateAssessmentProgress(panel) {
  const total = panel.querySelectorAll('.course-assessment-item').length;
  const answered = answerCount(panel);
  const progress = panel.querySelector('.course-assessment-progress');
  if (progress) progress.textContent = `${answered}/${total} answered`;
  const submit = panel.querySelector('.course-assessment-submit');
  if (submit) submit.disabled = !allAnsweredAndSaved(panel) || pendingSaves.size > 0;
}

function responseForFieldset(fieldset, type) {
  if (type === 'multiple-response') return [...fieldset.querySelectorAll('input[type="checkbox"]:checked')].map((input) => Number(input.value)).sort((a, b) => a - b);
  if (type === 'numeric') {
    const value = fieldset.querySelector('input[type="number"]')?.value;
    return value === '' || value == null ? null : Number(value);
  }
  const selected = fieldset.querySelector('input[type="radio"]:checked');
  return selected ? Number(selected.value) : null;
}

function isAnswered(response, type) {
  if (type === 'multiple-response') return Array.isArray(response) && response.length > 0;
  return response !== null && response !== undefined && response !== '';
}

function persistResponse(panel, item, fieldset) {
  const responseValue = responseForFieldset(fieldset, item.type);
  fieldset.dataset.answered = isAnswered(responseValue, item.type) ? 'true' : 'false';
  fieldset.dataset.saved = 'false';
  const status = panel.querySelector('.course-assessment-save-status');
  const key = `${item.id}@${item.version}`;
  const previous = saveChains.get(key) ?? Promise.resolve();
  let request;
  request = previous.catch(() => {}).then(async () => {
    const response = await fetch(`/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/responses`, {
      method: 'PUT',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ responses: [{ itemId: item.id, itemVersion: item.version, response: responseValue }] })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Save failed (${response.status}).`);
    }
    fieldset.dataset.saved = 'true';
    if (status) { status.textContent = 'Responses saved.'; status.classList.remove('error'); }
  }).catch((error) => {
    fieldset.dataset.saved = 'false';
    if (status) {
      status.textContent = `Save problem: ${error.message}`;
      status.classList.add('error');
    }
  }).finally(() => {
    pendingSaves.delete(request);
    if (saveChains.get(key) === request) saveChains.delete(key);
    updateAssessmentProgress(panel);
  });
  saveChains.set(key, request);
  pendingSaves.add(request);
  if (status) { status.textContent = 'Saving…'; status.classList.remove('error'); }
  updateAssessmentProgress(panel);
}

function singleChoiceControl(item, choice, index, fieldset, panel) {
  const label = el('label', '', 'course-assessment-choice');
  const input = document.createElement('input');
  input.type = 'radio'; input.name = `final-${currentAttempt.attempt.id}-${item.id}`; input.value = String(index);
  input.checked = Number(item.response) === index;
  input.addEventListener('change', () => persistResponse(panel, item, fieldset));
  label.append(input, el('span', choice));
  return label;
}

function multipleChoiceControl(item, choice, index, fieldset, panel) {
  const label = el('label', '', 'course-assessment-choice');
  const input = document.createElement('input');
  input.type = 'checkbox'; input.value = String(index);
  input.checked = Array.isArray(item.response) && item.response.includes(index);
  input.addEventListener('change', () => persistResponse(panel, item, fieldset));
  label.append(input, el('span', choice));
  return label;
}

function renderAssessmentItem(item, index, panel) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'course-assessment-item';
  fieldset.dataset.answered = isAnswered(item.response, item.type) ? 'true' : 'false';
  fieldset.dataset.saved = 'true';
  const legend = document.createElement('legend');
  legend.textContent = `${index + 1}. ${item.stem}`;
  fieldset.append(legend);
  renderRichBlocks(fieldset, item.stimulus);

  if (['multiple-choice', 'scenario', 'case-study', 'multiple-response'].includes(item.type)) {
    const choices = el('div', '', 'course-assessment-choices');
    item.choices.forEach((choice, choiceIndex) => {
      choices.append(item.type === 'multiple-response'
        ? multipleChoiceControl(item, choice, choiceIndex, fieldset, panel)
        : singleChoiceControl(item, choice, choiceIndex, fieldset, panel));
    });
    fieldset.append(choices);
    if (item.type === 'multiple-response') fieldset.append(el('p', 'Select all that apply.', 'course-assessment-hint'));
  } else if (item.type === 'numeric') {
    const input = document.createElement('input');
    input.type = 'number'; input.className = 'course-assessment-number'; input.inputMode = 'decimal';
    input.value = item.response ?? '';
    input.addEventListener('change', () => persistResponse(panel, item, fieldset));
    fieldset.append(input);
  }
  return fieldset;
}

function renderAssessment(payload) {
  currentAttempt = payload;
  pendingSaves.clear();
  saveChains.clear();
  setCurriculumTabActive();
  const panel = el('article', '', 'portal-panel course-assessment-panel');
  panel.append(el('p', 'Course 1 summative assessment', 'eyebrow'));
  panel.append(el('h2', payload.assessment.title));
  panel.append(el('p', `This is the public Course 1 final, not the restricted Technician I certification examination. Passing score: ${Number(payload.assessment.passingScorePercent).toFixed(0)}%.`, 'lede'));
  panel.append(el('p', payload.resumed ? 'Your open attempt was resumed. Previously saved responses are restored.' : 'A new attempt has started. Responses save to your learner record as you answer.', 'course-assessment-note'));
  const toolbar = el('div', '', 'course-assessment-toolbar');
  toolbar.append(el('strong', '0/0 answered', 'course-assessment-progress'), el('span', 'Responses saved.', 'course-assessment-save-status'));
  panel.append(toolbar);
  const form = document.createElement('form');
  form.className = 'course-assessment-form';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitAssessment(panel);
  });
  payload.items.forEach((item, index) => form.append(renderAssessmentItem(item, index, panel)));
  const submitArea = el('div', '', 'course-assessment-submit-area');
  const submit = el('button', 'Submit course final', 'course-assessment-submit');
  submit.type = 'submit'; submit.disabled = true;
  submitArea.append(submit, el('p', 'Submission is scored server-side. Post-attempt feedback is domain-level; answer keys are not displayed.', 'course-assessment-note'));
  form.append(submitArea);
  panel.append(form);
  lessonView.replaceChildren(panel);
  lessonView.focus();
  updateAssessmentProgress(panel);
}

async function submitAssessment(panel) {
  const submit = panel.querySelector('.course-assessment-submit');
  if (!submit || submit.disabled) return;
  submit.disabled = true; submit.textContent = 'Submitting…';
  try {
    await Promise.all([...pendingSaves]);
    if (!allAnsweredAndSaved(panel)) throw new Error('Every item must have a successfully saved response before submission.');
    const response = await fetch(`/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/submit`, {
      method: 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error === 'assessment-incomplete' ? 'Every item must have a saved response before submission.' : body.error || `Submission failed (${response.status}).`);
    renderAssessmentResult(body);
    refreshCourseEvidenceCard();
  } catch (error) {
    submit.textContent = 'Submit course final';
    updateAssessmentProgress(panel);
    const existing = panel.querySelector('.course-assessment-submit-error');
    existing?.remove();
    const errorNode = el('p', error.message, 'portal-error course-assessment-submit-error');
    submit.closest('.course-assessment-submit-area')?.append(errorNode);
  }
}

function renderAssessmentResult(result) {
  const panel = el('article', '', 'portal-panel course-assessment-result');
  panel.append(el('p', 'Course 1 final result', 'eyebrow'));
  panel.append(el('h2', result.attempt.passed ? 'Course final passed' : 'Course final not passed yet'));
  const score = el('div', '', `course-assessment-score ${result.attempt.passed ? 'passed' : 'not-passed'}`);
  score.append(el('strong', `${Number(result.attempt.scorePercent).toFixed(0)}%`), el('span', `Passing score ${Number(result.assessment.passingScorePercent).toFixed(0)}%`));
  panel.append(score);
  panel.append(el('p', 'This result is Course 1 knowledge evidence only. Practical-performance evidence remains separate, and this is not a Technician I credential decision.', 'course-assessment-note'));
  const domains = el('section', '', 'course-assessment-domains');
  domains.append(el('h3', 'Domain results'));
  const list = el('div', '', 'course-assessment-domain-grid');
  [...(result.competencyResults ?? [])].sort((a, b) => Number(a.scorePercent) - Number(b.scorePercent)).forEach((row) => {
    const card = el('div', '', 'course-assessment-domain');
    card.append(el('strong', row.title), el('span', `${Number(row.scorePercent).toFixed(0)}%`, 'course-assessment-domain-score'), el('span', String(row.masteryLevel).replaceAll('-', ' '), 'course-assessment-domain-state'));
    list.append(card);
  });
  domains.append(list); panel.append(domains);
  if (result.remediation) {
    const remediation = el('section', '', 'course-assessment-remediation');
    remediation.append(el('h3', 'Next step'), el('p', result.remediation.message));
    const referenceButton = el('button', 'Open Field References', 'course-assessment-secondary');
    referenceButton.type = 'button'; referenceButton.addEventListener('click', () => document.querySelector('#tab-field-references')?.click());
    remediation.append(referenceButton); panel.append(remediation);
  }
  const back = el('button', 'Return to Course 1', 'course-assessment-secondary');
  back.type = 'button'; back.addEventListener('click', () => document.querySelector('#tab-catalog')?.click());
  panel.append(back);
  lessonView.replaceChildren(panel); lessonView.focus();
}

async function refreshCourseEvidenceCard() {
  const panel = catalogRoot?.querySelector('.course-evidence-panel');
  if (!panel) return;
  const result = await courseEvidence().catch(() => ({ state: 'unavailable' }));
  if (result.state !== 'loaded') return;
  updateEvidenceRow(panel, result.data);
  const button = panel.querySelector('.course-assessment-launch');
  if (button) button.textContent = courseActionLabel(result.data?.writtenAssessment?.outcome);
}

if (catalogRoot) {
  new MutationObserver(observeEvidencePanel).observe(catalogRoot, { childList: true, subtree: true });
  observeEvidencePanel();
}
