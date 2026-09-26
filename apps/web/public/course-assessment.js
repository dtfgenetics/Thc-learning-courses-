import { renderRichBlocks } from './rich-content.js';

const COURSE_ID = 'COURSE-LH-TECH1-001';
const lessonView = document.querySelector('#lesson-view');
const catalogRoot = document.querySelector('#catalog');
const pendingSaves = new Set();
const saveChains = new Map();
let currentAttempt = null;
let assessmentTimer = null;

/* COURSE1_PRACTICAL_PUBLIC_DATA_START */
const COURSE_PRACTICAL_PUBLIC = {
  "id": "PRACTICAL-LH-TECH1-001-WORKFLOW",
  "title": "Course 1 Integrated Cultivation Workflow Practical",
  "version": "1.1.0",
  "status": "published",
  "deliveryModes": [
    "simulation",
    "supervised-lab",
    "workplace-equivalent"
  ],
  "evidenceOutputs": [
    "Pre-task hazard brief",
    "Sanitation and biosecurity movement record",
    "Controlled-instruction review",
    "Traceability movement and reconciliation record",
    "Equipment readiness and fault report",
    "Corrected record preserving original history",
    "Professional shift handoff"
  ],
  "scoring": {
    "totalPoints": 100,
    "domains": [
      {
        "name": "Safety, PPE and stop-work judgment",
        "points": 18
      },
      {
        "name": "Sanitation and biosecurity",
        "points": 14
      },
      {
        "name": "SOP and work-order execution",
        "points": 12
      },
      {
        "name": "Identity and traceability",
        "points": 16
      },
      {
        "name": "Inventory and discrepancy reasoning",
        "points": 10
      },
      {
        "name": "Equipment readiness and operator-care boundary",
        "points": 10
      },
      {
        "name": "Data integrity and documentation",
        "points": 12
      },
      {
        "name": "Shift handoff and communication",
        "points": 8
      }
    ]
  },
  "passingStandard": {
    "minimumPercent": 80,
    "noCriticalErrors": true
  },
  "criticalErrors": [
    "Deliberately falsifies, fabricates, or forces a cultivation, identity, inventory, or traceability record.",
    "Bypasses an explicit hold, quarantine, restricted-entry, or other supplied access-control instruction.",
    "Attempts protected equipment servicing, energized technical work, or repair outside the stated Technician I authority.",
    "Knowingly continues an explicit unsafe condition after the supplied procedure requires stopping or escalation.",
    "Causes avoidable unrecoverable plant or material identity loss by ignoring a detected identity discrepancy."
  ],
  "overview": "Apply Course 1 as one connected cultivation workflow while conditions change during a simulated shift. Learners must preserve safety, identity, traceability, authorization boundaries, record integrity, and handoff quality as new information appears.",
  "academicUse": "The practical framework is public academic course content. It may be studied without authentication and used for simulation, supervised-lab, or workplace-equivalent learning and evaluation. Personal assessor results remain private learner records.",
  "preparationSteps": [
    "Complete the Course 1 lessons, workbook activities, and low-stakes practice before attempting an evaluated practical.",
    "Review the six Course 1 Field References and know which one applies to hazards, biosecurity, controlled work, traceability, equipment, and records/handoff.",
    "Practice producing all seven required evidence outputs using the Course 1 workbook templates without inventing missing facts.",
    "Be ready to explain when work must stop, what can proceed within Technician I authority, and what must be escalated to another role.",
    "Expect conditions to change during the simulated shift and reassess earlier decisions when new status, identity, sanitation, equipment, or record information appears."
  ],
  "stages": [
    {
      "title": "1. Pre-task review",
      "summary": "Recognize hazards, access restrictions, work-order limits, identity risks, PPE needs, and operator authority before work begins."
    },
    {
      "title": "2. Status and sanitation change",
      "summary": "Reassess work when one restriction changes but another remains active, and verify exact sanitation-product authorization before substitution."
    },
    {
      "title": "3. Recurring equipment fault",
      "summary": "Stay inside the operator-care boundary, record the fault timeline, and escalate repeated unresolved conditions without unsupported diagnosis."
    },
    {
      "title": "4. Record integrity",
      "summary": "Correct records while preserving original history and distinguish observation time from later entry time without backdating."
    },
    {
      "title": "5. Closed-loop handoff",
      "summary": "Transfer unresolved holds, identity discrepancies, equipment status, sanitation status, and next actions using two-way read-back and source cross-checking."
    }
  ],
  "supportResources": [
    "Course 1 Field References",
    "Course 1 Student Workbook",
    "Course 1 Workbook Templates",
    "Course 1 remediation matrix and instructor coaching when assigned"
  ],
  "boundary": "This is Course 1 practical learning and performance evidence. It is separate from the Technician I credential examination and does not by itself issue a professional credential."
};
/* COURSE1_PRACTICAL_PUBLIC_DATA_END */

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
  const practical = evidence?.performanceAssessment;
  if (written) {
    const row = [...panel.querySelectorAll('.course-evidence-row')].find((entry) => entry.querySelector('strong')?.textContent === 'Course final');
    if (row) {
      const badge = row.querySelector('.course-evidence-status');
      if (badge) {
        const labels = { passed: 'Passed', 'not-passed': 'Not passed', 'in-progress': 'In progress', 'not-attempted': 'Not attempted' };
        badge.textContent = labels[written.outcome] ?? String(written.outcome ?? '').replaceAll('-', ' ');
        badge.className = `course-evidence-status status-${written.outcome ?? 'not-attempted'}`;
      }
      const detail = row.querySelector('.course-evidence-detail');
      const parts = [];
      if (written.bestScorePercent != null) parts.push(`${Number(written.bestScorePercent).toFixed(0)}% best`);
      if (written.passingScorePercent != null) parts.push(`current threshold ${Number(written.passingScorePercent).toFixed(0)}%`);
      if (Number(written.attemptCount ?? 0) > 0) parts.push(`${written.attemptCount} attempt${Number(written.attemptCount) === 1 ? '' : 's'}`);
      if (detail) detail.textContent = parts.join(' • ');
    }
  }
  if (practical) {
    const row = [...panel.querySelectorAll('.course-evidence-row')].find((entry) => entry.querySelector('strong')?.textContent === 'Course practical');
    if (row) {
      const badge = row.querySelector('.course-evidence-status');
      if (badge) {
        const labels = { passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', 'not-recorded': 'Not evaluated', voided: 'Voided' };
        badge.textContent = labels[practical.status] ?? String(practical.status ?? 'not-recorded').replaceAll('-', ' ');
        badge.className = `course-evidence-status status-${practical.status ?? 'not-recorded'}`;
      }
      const detail = row.querySelector('.course-evidence-detail');
      const parts = [];
      if (practical.scorePercent != null) parts.push(`${Number(practical.scorePercent).toFixed(0)}% recorded`);
      if (Number(practical.criticalErrorCount ?? 0) > 0) parts.push(`${practical.criticalErrorCount} critical error${Number(practical.criticalErrorCount) === 1 ? '' : 's'}`);
      if (detail) detail.textContent = parts.join(' • ');
    }
  }
}

async function enhanceEvidencePanel(panel) {
  if (!panel || panel.dataset.assessmentEnhanced === 'true') return;
  panel.dataset.assessmentEnhanced = 'true';
  const result = await courseEvidence().catch(() => ({ state: 'unavailable' }));
  if (!panel.isConnected) return;
  if (result.state === 'loaded') updateEvidenceRow(panel, result.data);

  const actions = el('div', '', 'course-assessment-actions');
  const practicalButton = el('button', 'Study course practical', 'course-assessment-secondary course-practical-launch');
  practicalButton.type = 'button';
  practicalButton.addEventListener('click', () => openCoursePractical(practicalButton));
  actions.append(practicalButton);

  if (result.state === 'loaded') {
    const written = result.data?.writtenAssessment ?? {};
    const finalButton = el('button', courseActionLabel(written.outcome), 'course-assessment-launch');
    finalButton.type = 'button';
    finalButton.addEventListener('click', () => launchCourseAssessment(COURSE_ID, finalButton));
    actions.prepend(finalButton);
  }
  panel.append(actions);
}

function observeEvidencePanel() {
  const panel = catalogRoot?.querySelector('.course-evidence-panel');
  if (panel) enhanceEvidencePanel(panel);
}

function practicalStatusLabel(status) {
  return ({ passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', 'not-recorded': 'Not evaluated', voided: 'Voided' })[status] ?? String(status ?? 'not-recorded').replaceAll('-', ' ');
}

function renderPracticalPersonalStatus(panel, evidenceResult) {
  const section = el('section', '', 'course-practical-personal-status');
  section.append(el('h3', 'Your assessor-recorded practical status'));
  if (evidenceResult.state === 'authentication-required') {
    section.append(el('p', 'The practical is public academic content. Sign in only if you want to view your private assessor-recorded practical result.', 'course-assessment-note'));
  } else if (evidenceResult.state !== 'loaded') {
    section.append(el('p', 'Personal practical status is temporarily unavailable. The academic practical below remains fully viewable.', 'course-assessment-note'));
  } else {
    const practical = evidenceResult.data?.performanceAssessment ?? { status: 'not-recorded' };
    const line = el('div', '', 'course-practical-status-line');
    line.append(el('strong', practicalStatusLabel(practical.status), `course-evidence-status status-${practical.status ?? 'not-recorded'}`));
    const details = [];
    if (practical.scorePercent != null) details.push(`${Number(practical.scorePercent).toFixed(0)}% recorded`);
    if (Number(practical.criticalErrorCount ?? 0) > 0) details.push(`${practical.criticalErrorCount} critical error${Number(practical.criticalErrorCount) === 1 ? '' : 's'}`);
    line.append(el('span', details.length ? details.join(' • ') : 'No scored practical result is recorded yet.'));
    section.append(line);
    if (practical.status === 'failed') {
      section.append(el('p', 'Use the Course 1 workbook, Field References, and instructor remediation to practice the weak performance areas before an equivalent reassessment.', 'course-practical-remediation'));
    } else if (practical.status === 'voided') {
      section.append(el('p', 'This practical record is voided. Review the recorded next step with the instructor or assessor before another evaluated attempt.', 'course-practical-remediation'));
    }
  }
  panel.append(section);
}

async function loadPracticalSubmission() {
  const response = await fetch(`/api/v1/me/courses/${COURSE_ID}/practical-submission`, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
  if (response.status === 401 || response.status === 403) return { state: 'authentication-required' };
  if (!response.ok) return { state: 'unavailable' };
  return { state: 'loaded', data: await response.json() };
}

async function renderPracticalSubmission(panel) {
  const result = await loadPracticalSubmission().catch(() => ({ state: 'unavailable' }));
  const section = el('section', '', 'course-practical-section practical-submission');
  section.append(el('h3', 'Submit practical evidence references'));
  if (result.state === 'authentication-required') {
    section.append(el('p', 'Sign in to save private references to your practical evidence.', 'course-assessment-note'));
    panel.append(section); return;
  }
  if (result.state !== 'loaded') {
    section.append(el('p', 'The private submission workspace is temporarily unavailable.', 'course-assessment-note'));
    panel.append(section); return;
  }
  const submission = result.data.submission;
  section.append(el('p', result.data.boundary, 'course-assessment-note'));
  const form = document.createElement('form'); form.className = 'practical-submission-form';
  for (const output of submission.evidenceOutputs) {
    const row = el('fieldset', '', 'practical-submission-row'); row.dataset.evidenceName = output.name;
    row.append(el('legend', output.name));
    const refLabel = el('label', '', 'practical-submission-field'); refLabel.append(el('span', 'Controlled reference'));
    const reference = document.createElement('input'); reference.type = 'text'; reference.maxLength = 500; reference.value = output.reference; reference.placeholder = 'Approved storage link, object ID, packet, or page'; reference.dataset.reference = 'true'; refLabel.append(reference);
    const descLabel = el('label', '', 'practical-submission-field'); descLabel.append(el('span', 'What this evidence demonstrates'));
    const description = document.createElement('textarea'); description.rows = 2; description.maxLength = 1000; description.value = output.description; description.dataset.description = 'true'; descLabel.append(description);
    row.append(refLabel, descLabel); form.append(row);
  }
  const statementLabel = el('label', '', 'practical-submission-field'); statementLabel.append(el('span', 'Learner statement'));
  const statement = document.createElement('textarea'); statement.rows = 3; statement.maxLength = 2000; statement.value = submission.learnerStatement; statement.placeholder = 'Summarize the practical context, accommodations, and unresolved limitations.'; statementLabel.append(statement); form.append(statementLabel);
  const status = el('p', submission.status === 'submitted' ? 'Submitted for review' : 'Draft not submitted', 'practical-submission-status');
  const actions = el('div', '', 'course-assessment-actions');
  const draft = el('button', 'Save draft', 'course-assessment-secondary'); draft.type = 'button';
  const submit = el('button', submission.status === 'submitted' ? 'Update submission' : 'Submit for review', 'course-assessment-launch'); submit.type = 'button';
  const save = async (nextStatus) => {
    draft.disabled = true; submit.disabled = true; status.textContent = nextStatus === 'submitted' ? 'Submitting...' : 'Saving...';
    const evidenceOutputs = [...form.querySelectorAll('.practical-submission-row')].map((row) => ({ name: row.dataset.evidenceName, reference: row.querySelector('[data-reference]').value, description: row.querySelector('[data-description]').value }));
    const response = await fetch(`/api/v1/me/courses/${COURSE_ID}/practical-submission`, { method: 'PUT', headers: { accept: 'application/json', 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ status: nextStatus, evidenceOutputs, learnerStatement: statement.value }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { status.textContent = `Submission not saved: ${body.error || response.status}`; status.classList.add('error'); draft.disabled = false; submit.disabled = false; return; }
    status.classList.remove('error'); status.textContent = body.submission.status === 'submitted' ? 'Submitted for authorized evaluator review.' : 'Draft saved.'; submit.textContent = body.submission.status === 'submitted' ? 'Update submission' : 'Submit for review'; draft.disabled = false; submit.disabled = false;
  };
  draft.addEventListener('click', () => save('draft')); submit.addEventListener('click', () => save('submitted')); actions.append(draft, submit); form.append(status, actions); section.append(form); panel.append(section);
}

function appendNumberedList(parent, items, className = '') {
  const list = document.createElement('ol');
  if (className) list.className = className;
  for (const item of items) list.append(el('li', item));
  parent.append(list);
}

function appendBulletList(parent, items, className = '') {
  const list = document.createElement('ul');
  if (className) list.className = className;
  for (const item of items) list.append(el('li', item));
  parent.append(list);
}

async function openCoursePractical(sourceButton) {
  sourceButton.disabled = true;
  const original = sourceButton.textContent;
  sourceButton.textContent = 'Opening practical…';
  const evidenceResult = await courseEvidence().catch(() => ({ state: 'unavailable' }));
  renderCoursePractical(evidenceResult);
  sourceButton.textContent = original;
  sourceButton.disabled = false;
}

async function renderCoursePractical(evidenceResult) {
  setCurriculumTabActive();
  const practical = COURSE_PRACTICAL_PUBLIC;
  const panel = el('article', '', 'portal-panel course-practical-panel');
  panel.append(el('p', 'Course 1 public academic practical', 'eyebrow'));
  panel.append(el('h2', practical.title));
  panel.append(el('p', practical.overview, 'lede'));

  const meta = el('div', '', 'course-practical-meta');
  meta.append(el('span', `Published v${practical.version}`, 'course-practical-pill'));
  for (const mode of practical.deliveryModes) meta.append(el('span', mode.replaceAll('-', ' '), 'course-practical-pill subtle'));
  panel.append(meta);
  panel.append(el('p', practical.academicUse, 'course-assessment-note'));
  renderPracticalPersonalStatus(panel, evidenceResult);

  const prep = el('section', '', 'course-practical-section');
  prep.append(el('h3', 'Preparation'));
  appendNumberedList(prep, practical.preparationSteps, 'course-practical-list');
  panel.append(prep);

  const stages = el('section', '', 'course-practical-section');
  stages.append(el('h3', 'Five-stage workflow'));
  const stageGrid = el('div', '', 'course-practical-stage-grid');
  for (const stage of practical.stages) {
    const card = el('article', '', 'course-practical-stage');
    card.append(el('h4', stage.title), el('p', stage.summary));
    stageGrid.append(card);
  }
  stages.append(stageGrid);
  panel.append(stages);

  const evidence = el('section', '', 'course-practical-section');
  evidence.append(el('h3', 'Seven required evidence outputs'));
  appendNumberedList(evidence, practical.evidenceOutputs, 'course-practical-list');
  panel.append(evidence);
  await renderPracticalSubmission(panel);

  const scoring = el('section', '', 'course-practical-section');
  scoring.append(el('h3', '100-point scoring model'));
  const scoreGrid = el('div', '', 'course-practical-score-grid');
  for (const domain of practical.scoring.domains) {
    const card = el('div', '', 'course-practical-score-domain');
    card.append(el('strong', `${domain.points} pts`), el('span', domain.name));
    scoreGrid.append(card);
  }
  scoring.append(scoreGrid);
  const pass = el('p', `${Number(practical.passingStandard.minimumPercent).toFixed(0)}% provisional academic development threshold`, 'course-practical-pass');
  if (practical.passingStandard.noCriticalErrors) pass.append(document.createTextNode(' • no critical errors'));
  scoring.append(pass);
  scoring.append(el('p', 'This threshold remains provisional pending pilot evidence and documented standard setting; it is not a Technician I credential cut score.', 'course-assessment-note'));
  panel.append(scoring);

  const critical = el('section', '', 'course-practical-section course-practical-critical');
  critical.append(el('h3', 'Critical-error boundaries'));
  critical.append(el('p', 'These boundaries protect the integrity of the practical. They define actions that cannot be offset by points earned elsewhere.'));
  appendBulletList(critical, practical.criticalErrors, 'course-practical-list');
  panel.append(critical);

  const resources = el('section', '', 'course-practical-section');
  resources.append(el('h3', 'Study and preparation resources'));
  appendBulletList(resources, practical.supportResources, 'course-practical-list');
  panel.append(resources);
  panel.append(el('p', practical.boundary, 'course-assessment-note course-practical-boundary'));

  const actions = el('div', '', 'course-practical-page-actions');
  const printButton = el('button', 'Print practical', 'course-assessment-secondary');
  printButton.type = 'button';
  printButton.addEventListener('click', () => window.print());
  const referencesButton = el('button', 'Open Field References', 'course-assessment-secondary');
  referencesButton.type = 'button';
  referencesButton.addEventListener('click', () => document.querySelector('#tab-field-references')?.click());
  const back = el('button', 'Return to Course 1', 'course-assessment-secondary');
  back.type = 'button';
  back.addEventListener('click', () => document.querySelector('#tab-catalog')?.click());
  actions.append(printButton, referencesButton, back);
  panel.append(actions);

  lessonView.replaceChildren(panel);
  lessonView.focus();
}

export async function launchCourseAssessment(courseId, sourceButton) {
  if (!courseId || !sourceButton) return;
  sourceButton.disabled = true;
  const original = sourceButton.textContent;
  sourceButton.textContent = 'Opening final…';
  try {
    const response = await fetch(`/api/v1/me/courses/${encodeURIComponent(courseId)}/assessment-attempts`, {
      method: 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body.error === 'authentication-required'
        ? 'Sign in to start the official course final.'
        : body.error === 'certificate-name-required'
          ? 'Set the name you want printed on your certificate in My Learning Dashboard before starting the final.'
          : body.error === 'active-credential-application-required'
            ? 'Create your certification application in My Learning Dashboard before starting the final.'
            : body.error || `Assessment unavailable (${response.status}).`;
      throw new Error(message);
    }
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

function stopAssessmentTimer() {
  if (assessmentTimer) clearInterval(assessmentTimer);
  assessmentTimer = null;
}

function disableAssessmentInputs(panel) {
  for (const control of panel.querySelectorAll('.course-assessment-form input, .course-assessment-submit')) control.disabled = true;
}

function startAssessmentTimer(panel) {
  stopAssessmentTimer();
  const timer = panel.querySelector('.course-assessment-timer');
  const expiresAt = currentAttempt?.attempt?.expiresAt;
  if (!timer || !expiresAt) {
    if (timer) timer.textContent = 'Untimed';
    return;
  }
  const tick = async () => {
    const remainingMs = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(remainingMs)) { timer.textContent = 'Time unavailable'; stopAssessmentTimer(); return; }
    if (remainingMs <= 0) {
      timer.textContent = 'Time expired — submitting';
      timer.classList.add('expired');
      stopAssessmentTimer();
      disableAssessmentInputs(panel);
      await submitAssessment(panel, { force: true, timedOut: true });
      return;
    }
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    timer.textContent = hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} remaining`
      : `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
    timer.classList.toggle('warning', totalSeconds <= 300);
  };
  tick();
  assessmentTimer = setInterval(tick, 1000);
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
  panel.append(el('p', 'Authenticated summative assessment', 'eyebrow'));
  panel.append(el('h2', payload.assessment.title));
  panel.append(el('p', `This is the graded academic final for ${payload.course?.title ?? 'this course'}. It is recorded to your learner account and remains separate from professional credential issuance. Current academic development threshold: ${Number(payload.assessment.passingScorePercent).toFixed(0)}%.`, 'lede'));
  panel.append(el('p', payload.resumed ? 'Your open attempt was resumed. Previously saved responses are restored.' : 'A new attempt has started. Responses save to your learner record as you answer.', 'course-assessment-note'));
  const identity = el('div', '', 'course-assessment-identity');
  identity.append(el('span', `Learner: ${payload.learner?.learnerReference ?? 'account linked'}`));
  identity.append(el('span', `Application: ${payload.learner?.applicationReference ?? 'not linked'}`));
  identity.append(el('span', `Certificate name: ${payload.learner?.certificateName ?? 'not set'}`));
  identity.append(el('span', `Attempt: ${payload.attempt.id}`));
  panel.append(identity);
  const toolbar = el('div', '', 'course-assessment-toolbar');
  toolbar.append(el('strong', '0/0 answered', 'course-assessment-progress'), el('strong', '', 'course-assessment-timer'), el('span', 'Responses saved.', 'course-assessment-save-status'));
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
  startAssessmentTimer(panel);
}

async function submitAssessment(panel, { force = false, timedOut = false } = {}) {
  const submit = panel.querySelector('.course-assessment-submit');
  if (!submit || (submit.disabled && !force)) return;
  submit.disabled = true; submit.textContent = timedOut ? 'Time expired — grading…' : 'Submitting…';
  try {
    await Promise.all([...pendingSaves]);
    if (!force && !allAnsweredAndSaved(panel)) throw new Error('Every item must have a successfully saved response before submission.');
    const response = await fetch(`/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/submit`, {
      method: 'POST', headers: { accept: 'application/json' }, credentials: 'same-origin'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error === 'assessment-incomplete' ? 'Every item must have a saved response before submission.' : body.error || `Submission failed (${response.status}).`);
    renderAssessmentResult(body);
    if (body.course?.id === COURSE_ID) refreshCourseEvidenceCard();
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
  stopAssessmentTimer();
  const panel = el('article', '', 'portal-panel course-assessment-result');
  panel.append(el('p', 'Recorded course-final result', 'eyebrow'));
  panel.append(el('h2', result.attempt.passed ? 'Course final passed under the current academic threshold' : 'Course final not passed under the current academic threshold'));
  const score = el('div', '', `course-assessment-score ${result.attempt.passed ? 'passed' : 'not-passed'}`);
  score.append(el('strong', `${Number(result.attempt.scorePercent).toFixed(0)}%`), el('span', `Current provisional threshold ${Number(result.assessment.passingScorePercent).toFixed(0)}%`));
  panel.append(score);
  const resultRefs = el('div', '', 'course-assessment-identity');
  resultRefs.append(el('span', `Learner: ${result.learner?.learnerReference ?? 'account linked'}`));
  resultRefs.append(el('span', `Application: ${result.learner?.applicationReference ?? 'not linked'}`));
  resultRefs.append(el('span', `Certificate name: ${result.learner?.certificateName ?? 'not set'}`));
  resultRefs.append(el('span', `Attempt: ${result.attempt.id}`));
  resultRefs.append(el('span', `Scored: ${result.attempt.scoredAt ? new Date(result.attempt.scoredAt).toLocaleString() : 'pending'}`));
  panel.append(resultRefs);
  panel.append(el('p', `This is academic knowledge evidence for ${result.course?.title ?? 'the course'}. Practical/performance evidence and professional credential issuance remain separate decisions.`, 'course-assessment-note'));
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
  const actions = el('div', '', 'course-practical-page-actions');
  if (result.course?.id === COURSE_ID) {
    const practicalButton = el('button', 'Study course practical', 'course-assessment-secondary');
    practicalButton.type = 'button';
    practicalButton.addEventListener('click', async () => renderCoursePractical(await courseEvidence().catch(() => ({ state: 'unavailable' }))));
    actions.append(practicalButton);
  }
  const back = el('button', 'Return to course catalog', 'course-assessment-secondary');
  back.type = 'button'; back.addEventListener('click', () => document.querySelector('#tab-catalog')?.click());
  actions.append(back);
  panel.append(actions);
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
