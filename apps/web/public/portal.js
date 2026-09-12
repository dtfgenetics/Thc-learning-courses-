const lessonView = document.querySelector('#lesson-view');
const tabs = [...document.querySelectorAll('.portal-tab')];
const catalogPanel = document.querySelector('#catalog-panel');
const catalogToggle = document.querySelector('#catalog-toggle');
const catalogBody = document.querySelector('#catalog-body');
const catalogToggleState = document.querySelector('#catalog-toggle-state');
const catalogRoot = document.querySelector('#catalog');
const compactCatalog = globalThis.matchMedia?.('(max-width: 840px)');
const COURSE1_ID = 'COURSE-LH-TECH1-001';
const COURSE1_TITLE = 'Safety, Responsible Practice & Cultivation Workflows';
let course1EvidencePromise = null;

function text(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = value ?? '';
  if (className) node.className = className;
  return node;
}

function setActive(id) {
  for (const tab of tabs) {
    const active = tab.id === id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function setCatalogExpanded(expanded) {
  if (!catalogToggle || !catalogBody || !catalogPanel) return;
  const isCompact = Boolean(compactCatalog?.matches);
  const effectiveExpanded = isCompact ? Boolean(expanded) : true;
  catalogToggle.setAttribute('aria-expanded', effectiveExpanded ? 'true' : 'false');
  catalogPanel.dataset.expanded = effectiveExpanded ? 'true' : 'false';
  catalogBody.hidden = isCompact && !effectiveExpanded;
  if (catalogToggleState) catalogToggleState.textContent = effectiveExpanded ? 'Hide' : 'Show';
}

function syncCatalogViewport() {
  setCatalogExpanded(!compactCatalog?.matches);
}

function renderWelcome() {
  const card = document.createElement('div');
  card.className = 'welcome-card';
  card.append(text('p', 'Start here', 'eyebrow'));
  card.append(text('h2', 'Choose a lesson'));
  card.append(text('p', 'Select a course and lesson from the catalog. You can also review credential progress, use the learning calculators, or verify an Academy credential.'));
  lessonView.replaceChildren(card);
  lessonView.focus();
}

function statusLabel(value) {
  return String(value ?? 'not-recorded').replaceAll('-', ' ');
}

function courseEvidenceLabel(value, kind) {
  if (kind === 'written') {
    return ({ passed: 'Passed', 'not-passed': 'Not passed', 'in-progress': 'In progress', 'not-attempted': 'Not attempted' })[value] ?? statusLabel(value);
  }
  return ({ passed: 'Passed', failed: 'Not passed', 'in-progress': 'In progress', 'not-recorded': 'Not evaluated', voided: 'Voided' })[value] ?? statusLabel(value);
}

function courseEvidenceBadge(value, kind) {
  const badge = text('span', courseEvidenceLabel(value, kind), `course-evidence-status status-${String(value ?? 'not-recorded')}`);
  return badge;
}

function courseEvidenceRow(label, status, kind, detail = '') {
  const row = document.createElement('div');
  row.className = 'course-evidence-row';
  const copy = document.createElement('div');
  copy.append(text('strong', label));
  if (detail) copy.append(text('span', detail, 'course-evidence-detail'));
  row.append(copy, courseEvidenceBadge(status, kind));
  return row;
}

function loadCourse1Evidence() {
  if (!course1EvidencePromise) {
    course1EvidencePromise = fetch(`/api/v1/me/courses/${COURSE1_ID}/evidence`, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin'
    }).then(async (response) => {
      if (response.status === 401 || response.status === 403) return { state: 'authentication-required' };
      if (!response.ok) return { state: 'unavailable', status: response.status };
      return { state: 'loaded', data: await response.json() };
    }).catch(() => ({ state: 'unavailable' }));
  }
  return course1EvidencePromise;
}

function buildCourseEvidencePanel(result) {
  const panel = document.createElement('section');
  panel.className = 'course-evidence-panel';
  panel.setAttribute('aria-label', 'Official Course 1 assessment and practical status');
  panel.append(text('p', 'Official course evidence', 'course-evidence-heading'));

  if (result.state === 'authentication-required') {
    panel.append(text('p', 'Sign in to view your official Course 1 final-assessment and practical status. Device lesson checkmarks are separate from official evidence.', 'course-evidence-note'));
    return panel;
  }
  if (result.state !== 'loaded') {
    panel.append(text('p', 'Official Course 1 assessment and practical status is temporarily unavailable. Lesson progress remains separate.', 'course-evidence-note'));
    return panel;
  }

  const data = result.data ?? {};
  const written = data.writtenAssessment ?? {};
  const practical = data.performanceAssessment ?? {};
  const writtenDetail = [];
  if (written.bestScorePercent != null) writtenDetail.push(`${Number(written.bestScorePercent).toFixed(0)}% best`);
  if (written.passingScorePercent != null) writtenDetail.push(`pass ${Number(written.passingScorePercent).toFixed(0)}%`);
  if (Number(written.attemptCount ?? 0) > 0) writtenDetail.push(`${written.attemptCount} attempt${Number(written.attemptCount) === 1 ? '' : 's'}`);
  const practicalDetail = [];
  if (practical.scorePercent != null) practicalDetail.push(`${Number(practical.scorePercent).toFixed(0)}% recorded`);
  if (Number(practical.criticalErrorCount ?? 0) > 0) practicalDetail.push(`${practical.criticalErrorCount} critical error${Number(practical.criticalErrorCount) === 1 ? '' : 's'}`);

  const rows = document.createElement('div');
  rows.className = 'course-evidence-rows';
  rows.append(
    courseEvidenceRow('Course final', written.outcome ?? 'not-attempted', 'written', writtenDetail.join(' • ')),
    courseEvidenceRow('Course practical', practical.status ?? 'not-recorded', 'practical', practicalDetail.join(' • '))
  );
  panel.append(rows);
  panel.append(text('p', data.completionModel || 'Lesson progress, the course final, and practical-performance evidence are tracked separately.', 'course-evidence-note'));
  return panel;
}

async function injectCourse1Evidence() {
  if (!catalogRoot) return;
  const target = [...catalogRoot.querySelectorAll('details.course')].find((course) => course.querySelector('summary > span')?.textContent?.trim() === COURSE1_TITLE);
  if (!target || target.querySelector('.course-evidence-panel')) return;
  const marker = document.createElement('div');
  marker.className = 'course-evidence-loading';
  marker.append(text('p', 'Loading official course evidence…', 'course-evidence-note'));
  const firstModule = target.querySelector('.module');
  if (firstModule) firstModule.before(marker); else target.append(marker);
  const result = await loadCourse1Evidence();
  if (!marker.isConnected) return;
  marker.replaceWith(buildCourseEvidencePanel(result));
}

function summaryCard(label, value, note = '') {
  const card = document.createElement('div');
  card.className = 'portal-summary-card';
  card.append(text('span', label, 'portal-summary-label'));
  card.append(text('strong', value, 'portal-summary-value'));
  if (note) card.append(text('span', note, 'portal-summary-note'));
  return card;
}

function evidenceList(title, rows, idKey) {
  const section = document.createElement('section');
  section.className = 'portal-progress-section';
  section.append(text('h3', title));
  const list = document.createElement('div');
  list.className = 'portal-evidence-list';
  for (const row of rows) {
    const item = document.createElement('div');
    item.className = 'portal-evidence-row';
    const identity = document.createElement('div');
    identity.append(text('strong', row[idKey] ?? 'Unknown evidence'));
    const details = [];
    if (row.scorePercent != null) details.push(`${Number(row.scorePercent).toFixed(0)}%`);
    if (Number(row.criticalErrorCount ?? 0) > 0) details.push(`${row.criticalErrorCount} critical error${Number(row.criticalErrorCount) === 1 ? '' : 's'}`);
    if (details.length) identity.append(text('span', details.join(' • '), 'portal-evidence-meta'));
    const state = text('span', statusLabel(row.status), `portal-evidence-status status-${String(row.status ?? 'not-recorded')}`);
    item.append(identity, state);
    list.append(item);
  }
  section.append(list);
  return section;
}

async function renderCredentialProgress() {
  setActive('tab-progress');
  if (compactCatalog?.matches) setCatalogExpanded(false);
  const panel = document.createElement('div');
  panel.className = 'portal-panel';
  panel.append(text('p', 'Private learner record', 'eyebrow'));
  panel.append(text('h2', 'My Credential Progress'));
  panel.append(text('p', 'Your exam, competency, practical, capstone, and portfolio evidence are evaluated together. Lesson completion alone does not issue a credential.', 'lede'));
  panel.append(text('p', 'Loading Technician II credential evidence…', 'status'));
  lessonView.replaceChildren(panel);
  lessonView.focus();

  try {
    const response = await fetch('/api/v1/me/credentials/CRED-CULT-TECH-II-001/progress', {
      headers: { accept: 'application/json' },
      credentials: 'same-origin'
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Account credential progress is available after learner authentication. Local preview completion is not official credential evidence.');
      throw new Error(`Credential progress unavailable (${response.status}).`);
    }
    const data = await response.json();
    panel.querySelector('.status')?.remove();

    const summary = document.createElement('section');
    summary.className = 'portal-progress-summary';
    const attempts = data.assessmentAttempts ?? [];
    const bestScore = attempts.filter((row) => row.status === 'scored' && row.scorePercent != null).reduce((best, row) => Math.max(best, Number(row.scorePercent)), -1);
    const demonstrated = (data.competencies ?? []).filter((row) => row.masteryLevel === 'demonstrated').length;
    const performancePassed = (data.performanceAssessments ?? []).filter((row) => row.status === 'passed' && Number(row.criticalErrorCount ?? 0) === 0).length;
    const portfolioComplete = (data.portfolioArtifacts ?? []).filter((row) => ['accepted','verified','complete'].includes(row.status)).length;
    summary.append(
      summaryCard('Credential status', data.eligibility?.eligible ? 'Eligible' : 'In progress', data.credential?.title ?? ''),
      summaryCard('Best written exam', bestScore >= 0 ? `${bestScore.toFixed(0)}%` : 'Not attempted', `Pass ${data.credential?.minimumPassingScorePercent ?? 80}%`),
      summaryCard('Competencies demonstrated', String(demonstrated), `${(data.competencies ?? []).length} transcript records`),
      summaryCard('Performance evidence', `${performancePassed}/${(data.performanceAssessments ?? []).length}`, '7 practicals + capstone'),
      summaryCard('Portfolio evidence', `${portfolioComplete}/${(data.portfolioArtifacts ?? []).length}`, 'Employment artifacts')
    );
    panel.append(summary);

    if (!(data.eligibility?.eligible)) {
      const blocker = document.createElement('section');
      blocker.className = 'portal-blockers';
      blocker.append(text('h3', 'What remains'));
      const list = document.createElement('ul');
      for (const row of data.eligibility?.missingRequirements ?? []) {
        const humanType = row.type === 'assessment' ? 'Written assessment' : row.type === 'performance-assessment' ? 'Practical/capstone' : 'Portfolio artifact';
        list.append(text('li', `${humanType}: ${row.id} — ${statusLabel(row.reason)}`));
      }
      if (!list.children.length) list.append(text('li', 'No unresolved requirement details are available.'));
      blocker.append(list);
      panel.append(blocker);
    }

    const attemptsSection = document.createElement('section');
    attemptsSection.className = 'portal-progress-section';
    attemptsSection.append(text('h3', 'Credential exam attempts'));
    if (!attempts.length) {
      attemptsSection.append(text('p', 'No official Technician II credential exam attempt is recorded yet.', 'portal-result-note'));
    } else {
      const tableWrap = document.createElement('div');
      tableWrap.className = 'portal-table-wrap';
      const table = document.createElement('table');
      table.className = 'portal-progress-table';
      const thead = document.createElement('thead');
      const header = document.createElement('tr');
      for (const label of ['Status', 'Score', 'Result', 'Started', 'Scored']) header.append(text('th', label));
      thead.append(header);
      const tbody = document.createElement('tbody');
      for (const attempt of attempts) {
        const row = document.createElement('tr');
        const started = attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : '—';
        const scored = attempt.scoredAt ? new Date(attempt.scoredAt).toLocaleString() : '—';
        row.append(
          text('td', statusLabel(attempt.status)),
          text('td', attempt.scorePercent == null ? '—' : `${Number(attempt.scorePercent).toFixed(0)}%`),
          text('td', attempt.passed == null ? 'Pending' : attempt.passed ? 'Passed' : 'Not passed'),
          text('td', started),
          text('td', scored)
        );
        tbody.append(row);
      }
      table.append(thead, tbody);
      tableWrap.append(table);
      attemptsSection.append(tableWrap);
    }
    panel.append(attemptsSection);

    const transcript = document.createElement('section');
    transcript.className = 'portal-progress-section';
    transcript.append(text('h3', 'Competency transcript'));
    if (!(data.competencies ?? []).length) {
      transcript.append(text('p', 'No competency mastery records are available yet. Competency evidence is created by scored official assessments, not by opening lessons.', 'portal-result-note'));
    } else {
      const list = document.createElement('div');
      list.className = 'portal-evidence-list';
      for (const row of data.competencies) {
        const item = document.createElement('div');
        item.className = 'portal-evidence-row';
        const identity = document.createElement('div');
        identity.append(text('strong', row.competencyId));
        identity.append(text('span', `Curriculum ${row.curriculumVersion}`, 'portal-evidence-meta'));
        item.append(identity, text('span', statusLabel(row.masteryLevel), `portal-evidence-status status-${row.masteryLevel}`));
        list.append(item);
      }
      transcript.append(list);
    }
    panel.append(transcript);
    panel.append(evidenceList('Practical & capstone evidence', data.performanceAssessments ?? [], 'assessmentId'));
    panel.append(evidenceList('Employment portfolio', data.portfolioArtifacts ?? [], 'artifactId'));
  } catch (error) {
    panel.querySelector('.status')?.remove();
    panel.append(text('p', error.message, 'portal-error'));
  }
}

function numberField(label, value, options = {}) {
  const row = document.createElement('label');
  row.className = 'portal-input-row';
  row.append(text('span', label));
  const input = document.createElement('input');
  input.type = 'number';
  input.value = value;
  for (const [key, val] of Object.entries(options)) input[key] = val;
  row.append(input);
  return { row, input };
}

function renderTools() {
  setActive('tab-tools');
  if (compactCatalog?.matches) setCatalogExpanded(false);
  const panel = document.createElement('div');
  panel.className = 'portal-panel';
  panel.append(text('p', 'Cultivation learning tools', 'eyebrow'));
  panel.append(text('h2', 'Cultivation Calculators'));
  panel.append(text('p', 'Practice environmental and lighting math. Calculator outputs are measurements, not universal cultivation targets.', 'lede'));

  const grid = document.createElement('div');
  grid.className = 'portal-tools-grid';

  const vpd = document.createElement('section');
  vpd.className = 'portal-tool-card';
  vpd.append(text('h3', 'Leaf vapor pressure deficit'));
  vpd.append(text('p', 'Estimate leaf-to-air vapor pressure deficit from canopy air temperature, relative humidity, and measured leaf-temperature offset.', 'portal-tool-copy'));
  const air = numberField('Canopy air temperature (°C)', '25', { step: '0.5' });
  const rh = numberField('Relative humidity (%)', '65', { step: '1', min: '1', max: '100' });
  const offset = numberField('Leaf offset from air (°C)', '-1.5', { step: '0.5' });
  const vpdResult = text('strong', '', 'portal-result');
  const vpdContext = text('p', '', 'portal-result-note');
  function computeVpd() {
    const tAir = Number(air.input.value);
    const humidity = Math.min(100, Math.max(0, Number(rh.input.value)));
    const tLeaf = tAir + Number(offset.input.value);
    const sat = (t) => 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
    const airVp = sat(tAir) * (humidity / 100);
    const leafVpd = Math.max(0, sat(tLeaf) - airVp);
    const airVpd = Math.max(0, sat(tAir) - airVp);
    vpdResult.textContent = `${leafVpd.toFixed(2)} kPa leaf VPD`;
    vpdContext.textContent = `Air VPD ${airVpd.toFixed(2)} kPa • estimated leaf temperature ${tLeaf.toFixed(1)} °C. Interpret with the lesson, crop stage, cultivar, sensor quality, and approved SOP.`;
  }
  for (const input of [air.input, rh.input, offset.input]) input.addEventListener('input', computeVpd);
  vpd.append(air.row, rh.row, offset.row, vpdResult, vpdContext);
  computeVpd();
  grid.append(vpd);

  const dli = document.createElement('section');
  dli.className = 'portal-tool-card';
  dli.append(text('h3', 'Daily light integral'));
  dli.append(text('p', 'Convert average PPFD and photoperiod into mol/m²/day.', 'portal-tool-copy'));
  const ppfd = numberField('Average canopy PPFD (µmol/m²/s)', '850', { step: '25', min: '0' });
  const hours = numberField('Photoperiod (hours/day)', '12', { step: '0.5', min: '0', max: '24' });
  const dliResult = text('strong', '', 'portal-result');
  const dliContext = text('p', 'DLI = PPFD × seconds of light ÷ 1,000,000. Interpret with canopy uniformity, crop response, and the approved lighting plan.', 'portal-result-note');
  function computeDli() {
    const result = Math.max(0, Number(ppfd.input.value)) * Math.max(0, Number(hours.input.value)) * 3600 / 1_000_000;
    dliResult.textContent = `${result.toFixed(1)} mol/m²/day`;
  }
  ppfd.input.addEventListener('input', computeDli);
  hours.input.addEventListener('input', computeDli);
  dli.append(ppfd.row, hours.row, dliResult, dliContext);
  computeDli();
  grid.append(dli);

  panel.append(grid);
  lessonView.replaceChildren(panel);
  lessonView.focus();
}

function renderVerify() {
  setActive('tab-verify');
  if (compactCatalog?.matches) setCatalogExpanded(false);
  const panel = document.createElement('div');
  panel.className = 'portal-panel';
  panel.append(text('p', 'Trust & verification', 'eyebrow'));
  panel.append(text('h2', 'Verify an Academy Credential'));
  panel.append(text('p', 'Check a public verification record without exposing private learner or assessment data.', 'lede'));

  const form = document.createElement('form');
  form.className = 'portal-verify-form';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Verification ID';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Credential verification ID');
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Verify credential';
  const result = document.createElement('div');
  result.className = 'portal-verify-result';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = input.value.trim();
    if (!id) return;
    result.replaceChildren(text('p', 'Checking verification record…', 'status'));
    try {
      const response = await fetch(`/api/v1/credentials/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error === 'credential-not-found' ? 'Verification ID not found.' : `Verification request failed (${response.status}).`);
      }
      const record = await response.json();
      const card = document.createElement('section');
      card.className = 'portal-credential-card';
      card.append(text('p', `Status: ${record.status ?? 'valid'}`, 'portal-credential-status'));
      card.append(text('h3', record.credential?.title ?? 'THC Academy Credential'));
      const dl = document.createElement('dl');
      const fields = [
        ['Verification ID', record.verificationId],
        ['Credential', record.credential?.id],
        ['Role', record.credential?.role],
        ['Course', record.course?.id],
        ['Issuer', record.issuer?.name],
        ['Issued', record.issuedAt ? new Date(record.issuedAt).toLocaleDateString() : null],
        ['Expires', record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : 'No expiration recorded']
      ];
      for (const [label, value] of fields) {
        if (!value) continue;
        const row = document.createElement('div');
        row.append(text('dt', label), text('dd', value));
        dl.append(row);
      }
      card.append(dl);
      if (record.evidenceSummary) {
        card.append(text('p', `Verified evidence: ${record.evidenceSummary.writtenAssessments ?? 0} written assessment(s), ${record.evidenceSummary.performanceAssessments ?? 0} performance assessment(s), ${record.evidenceSummary.portfolioArtifacts ?? 0} portfolio artifact(s).`, 'portal-result-note'));
      }
      if (record.disclaimer) card.append(text('p', record.disclaimer, 'portal-result-note'));
      result.replaceChildren(card);
    } catch (error) {
      result.replaceChildren(text('p', error.message, 'portal-error'));
    }
  });

  form.append(input, button);
  panel.append(form, result);
  lessonView.replaceChildren(panel);
  lessonView.focus();
}

catalogToggle?.addEventListener('click', () => {
  const expanded = catalogToggle.getAttribute('aria-expanded') === 'true';
  setCatalogExpanded(!expanded);
});

compactCatalog?.addEventListener?.('change', syncCatalogViewport);
syncCatalogViewport();

const catalogEvidenceObserver = catalogRoot ? new MutationObserver(() => injectCourse1Evidence()) : null;
catalogEvidenceObserver?.observe(catalogRoot, { childList: true, subtree: true });
injectCourse1Evidence();

document.addEventListener('click', (event) => {
  const lessonLink = event.target instanceof Element ? event.target.closest('.lesson-link') : null;
  if (!lessonLink) return;
  setActive('tab-catalog');
  if (compactCatalog?.matches) setCatalogExpanded(false);
});

document.querySelector('#tab-catalog')?.addEventListener('click', () => {
  setActive('tab-catalog');
  if (compactCatalog?.matches) setCatalogExpanded(true);
  renderWelcome();
});
document.querySelector('#tab-progress')?.addEventListener('click', renderCredentialProgress);
document.querySelector('#tab-tools')?.addEventListener('click', renderTools);
document.querySelector('#tab-verify')?.addEventListener('click', renderVerify);
