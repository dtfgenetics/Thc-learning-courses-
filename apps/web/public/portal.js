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
  card.append(text('p', 'Recommended next step', 'eyebrow'));
  card.append(text('h2', 'Start with Cultivation Technician I'));
  card.append(text('p', 'Begin with Course 1 if you are new to the Academy, or continue from the course outline. The pathway builds plant science, practical reasoning and cultivation skill in sequence.'));
  const start = document.createElement('a');
  start.className = 'academy-primary-action';
  start.href = '?course=COURSE-LH-TECH1-001';
  start.textContent = 'Open Course 1';
  card.append(start);
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
  return text('span', courseEvidenceLabel(value, kind), `course-evidence-status status-${String(value ?? 'not-recorded')}`);
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
  if (!target || target.querySelector('.course-evidence-panel, .course-evidence-loading')) return;
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
  panel.append(text('h2', 'My Learning Dashboard'));
  panel.append(text('p', 'Review your enrolled academic courses, graded-final progress, certification applications, and professional credential evidence in one place. Academic course completion and professional credential issuance remain separate.', 'lede'));
  panel.append(text('p', 'Loading learner records…', 'status'));
  lessonView.replaceChildren(panel);
  lessonView.focus();

  try {
    const [profileResponse, applicationsResponse, enrollmentResponse, catalogResponse, issuedCredentialsResponse, tech1ProgressResponse, tech1TranscriptResponse, progressResponse, transcriptResponse] = await Promise.all([
      fetch('/api/v1/me/profile', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/applications', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/enrollments', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/catalog', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/credentials', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/credentials/CRED-CULT-TECH-I-001/progress', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/credentials/CRED-CULT-TECH-I-001/transcript', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/credentials/CRED-CULT-TECH-II-001/progress', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      }),
      fetch('/api/v1/me/credentials/CRED-CULT-TECH-II-001/transcript', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      })
    ]);
    if (!profileResponse.ok || !applicationsResponse.ok) {
      if ([profileResponse.status, applicationsResponse.status].some((status) => status === 401 || status === 403)) throw new Error('Learner identity and application records are available after learner authentication.');
      throw new Error('Learner identity/application records are unavailable.');
    }
    if (!enrollmentResponse.ok) {
      if (enrollmentResponse.status === 401 || enrollmentResponse.status === 403) throw new Error('Learner dashboard is available after learner authentication.');
      throw new Error(`Enrollment status unavailable (${enrollmentResponse.status}).`);
    }
    if (!catalogResponse.ok) throw new Error(`Course catalog unavailable (${catalogResponse.status}).`);
    if (!issuedCredentialsResponse.ok) {
      if (issuedCredentialsResponse.status === 401 || issuedCredentialsResponse.status === 403) throw new Error('Issued certificates are available after learner authentication.');
      throw new Error(`Issued credential records unavailable (${issuedCredentialsResponse.status}).`);
    }
    for (const [response, label] of [[tech1ProgressResponse, 'Technician I credential progress'], [tech1TranscriptResponse, 'Technician I competency transcript']]) {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error(`${label} is available after learner authentication.`);
        throw new Error(`${label} unavailable (${response.status}).`);
      }
    }
    if (!progressResponse.ok) {
      if (progressResponse.status === 401 || progressResponse.status === 403) throw new Error('Account credential progress is available after learner authentication. Local preview completion is not official credential evidence.');
      throw new Error(`Credential progress unavailable (${progressResponse.status}).`);
    }
    if (!transcriptResponse.ok) {
      if (transcriptResponse.status === 401 || transcriptResponse.status === 403) throw new Error('Competency transcript is available after learner authentication.');
      throw new Error(`Competency transcript unavailable (${transcriptResponse.status}).`);
    }
    const profileData = await profileResponse.json();
    const applicationsData = await applicationsResponse.json();
    const enrollmentData = await enrollmentResponse.json();
    const catalogData = await catalogResponse.json();
    const issuedCredentialsData = await issuedCredentialsResponse.json();
    const tech1Data = await tech1ProgressResponse.json();
    const tech1TranscriptData = await tech1TranscriptResponse.json();
    const data = await progressResponse.json();
    const transcriptData = await transcriptResponse.json();
    panel.querySelector('.status')?.remove();

    const profile = profileData.profile ?? {};
    const applications = applicationsData.applications ?? [];
    const applicationPrograms = [
      { id: 'CREDPROG-CULT-TECH-I-001', title: 'Technician I' },
      { id: 'CREDPROG-CULT-TECH-II-001', title: 'Technician II' }
    ];
    const activeApplications = new Map(applicationPrograms.map((program) => [
      program.id,
      applications.find((row) => row.programId === program.id && row.status === 'active') ?? null
    ]));
    const identitySection = document.createElement('section');
    identitySection.className = 'portal-progress-section learner-identity-section';
    identitySection.append(text('h3', 'Learner identity & certification application'));
    const identitySummary = document.createElement('div');
    identitySummary.className = 'portal-progress-summary';
    identitySummary.append(summaryCard('Learner reference', profile.learnerReference ?? 'Not assigned', 'Private learner-account reference'));
    for (const program of applicationPrograms) {
      const application = activeApplications.get(program.id);
      identitySummary.append(summaryCard(`${program.title} application`, application?.applicationReference ?? 'Not created', application ? 'Active certification application' : 'Create before beginning credential-bearing finals'));
    }
    identitySummary.append(summaryCard('Certificate name', profile.certificateName || 'Not set', 'Printed exactly as saved after credential issuance'));
    identitySection.append(identitySummary);
    const identityForm = document.createElement('form');
    identityForm.className = 'learner-identity-form';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'portal-input-row';
    nameLabel.append(text('span', 'Name to print on certificate'));
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 120;
    nameInput.autocomplete = 'name';
    nameInput.value = profile.certificateName ?? profile.displayName ?? '';
    nameLabel.append(nameInput);
    const identityActions = document.createElement('div');
    identityActions.className = 'record-actions';
    const saveName = text('button', 'Save certificate name', 'record-button');
    saveName.type = 'submit';
    identityActions.append(saveName);
    for (const program of applicationPrograms) {
      if (activeApplications.get(program.id)) continue;
      const createApplication = text('button', `Create ${program.title} application`, 'record-button');
      createApplication.type = 'button';
      createApplication.addEventListener('click', async () => {
        createApplication.disabled = true;
        const response = await fetch('/api/v1/me/applications', {
          method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, credentials: 'same-origin',
          body: JSON.stringify({ programId: program.id })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          createApplication.disabled = false;
          createApplication.textContent = body.error || `${program.title} application not created`;
          return;
        }
        activeApplications.set(program.id, body.application);
        createApplication.textContent = `${program.title}: ${body.application.applicationReference}`;
        createApplication.disabled = true;
      });
      identityActions.append(createApplication);
    }
    const identityStatus = text('p', '', 'portal-result-note');
    identityForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      saveName.disabled = true;
      identityStatus.textContent = 'Saving…';
      const response = await fetch('/api/v1/me/profile', {
        method: 'PUT', headers: { accept: 'application/json', 'content-type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ displayName: profile.displayName ?? nameInput.value, certificateName: nameInput.value })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { identityStatus.textContent = body.error || 'Name not saved.'; saveName.disabled = false; return; }
      identityStatus.textContent = `Saved for certificate printing as ${body.profile.certificateName}.`;
      saveName.disabled = false;
    });
    identityForm.append(nameLabel, identityActions, identityStatus);
    identitySection.append(identityForm);
    panel.append(identitySection);

    const issuedCredentialsSection = document.createElement('section');
    issuedCredentialsSection.className = 'portal-progress-section learner-issued-credentials';
    issuedCredentialsSection.append(text('h3', 'Issued certificates'));
    const issuedRecords = issuedCredentialsData.credentials ?? [];
    if (!issuedRecords.length) {
      issuedCredentialsSection.append(text('p', 'No issued professional credential is recorded for this learner account yet.', 'portal-result-note'));
    } else {
      const issuedList = document.createElement('div');
      issuedList.className = 'portal-course-record-list';
      for (const record of issuedRecords) {
        const card = document.createElement('article');
        card.className = 'portal-course-record portal-issued-credential';
        card.append(text('h4', record.credential?.title ?? record.credential?.id ?? 'THC Academy Credential'));
        const issuedMeta = document.createElement('div');
        issuedMeta.className = 'portal-progress-summary compact';
        issuedMeta.append(
          summaryCard('Status', statusLabel(record.status), record.verificationId ?? ''),
          summaryCard('Certificate name', record.recipient?.certificateName ?? 'Not recorded', record.recipient?.learnerReference ?? ''),
          summaryCard('Issued', record.issuedAt ? new Date(record.issuedAt).toLocaleDateString() : 'Not recorded', record.recipient?.applicationReference ?? '')
        );
        card.append(issuedMeta);
        if (['issued','valid'].includes(record.status)) {
          const print = text('button', 'Print certificate', 'record-button portal-certificate-print');
          print.type = 'button';
          print.addEventListener('click', () => printVerifiedCertificate(record));
          card.append(print);
        }
        issuedList.append(card);
      }
      issuedCredentialsSection.append(issuedList);
    }
    panel.append(issuedCredentialsSection);

    const enrolledCourseIds = new Set((enrollmentData.enrollments ?? []).map((row) => row.courseId));
    const academicCourses = (catalogData.courses ?? []).filter((course) =>
      course.status === 'published' &&
      course.credentialBearing === true &&
      enrolledCourseIds.has(course.id)
    );
    const completionResults = await Promise.all(academicCourses.map(async (course) => {
      if (!course.finalAssessment) return { course, integratedPerformance: true };
      const response = await fetch(`/api/v1/me/courses/${encodeURIComponent(course.id)}/completion`, {
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      });
      if (!response.ok) return { course, unavailable: true, status: response.status };
      return { course, completion: await response.json() };
    }));

    const academicSection = document.createElement('section');
    academicSection.className = 'portal-progress-section';
    academicSection.append(text('h3', 'Academic course status'));
    if (!completionResults.length) {
      academicSection.append(text('p', 'No enrolled credential-path academic course is recorded yet.', 'portal-result-note'));
    } else {
      const courseList = document.createElement('div');
      courseList.className = 'portal-course-record-list';
      for (const result of completionResults) {
        const row = document.createElement('article');
        row.className = 'portal-course-record';
        row.append(text('h4', result.course.title));
        const enrollment = (enrollmentData.enrollments ?? []).find((item) => item.courseId === result.course.id && String(item.courseVersion) === String(result.course.version));
        if (result.integratedPerformance) {
          row.append(text('p', 'Integrated performance lab: this course intentionally has no ordinary final. Completion depends on its mapped practical/capstone evidence and remains separate from professional credential issuance.', 'portal-result-note'));
          const integratedStats = document.createElement('div');
          integratedStats.className = 'portal-progress-summary compact';
          integratedStats.append(
            summaryCard('Enrollment', enrollment ? statusLabel(enrollment.status) : 'Not enrolled', `Course v${result.course.version}`),
            summaryCard('Assessment model', 'Integrated performance', 'No redundant conventional final'),
            summaryCard('Credential issuance', 'Separate', 'Professional release gates remain fail-closed')
          );
          row.append(integratedStats);
          courseList.append(row);
          continue;
        }
        if (result.unavailable) {
          row.append(text('p', `Completion record unavailable (${result.status}).`, 'portal-result-note'));
          courseList.append(row);
          continue;
        }
        const completion = result.completion;
        const instruction = completion.instruction ?? {};
        const stats = document.createElement('div');
        stats.className = 'portal-progress-summary compact';
        stats.append(
          summaryCard('Enrollment', enrollment ? statusLabel(enrollment.status) : 'Not enrolled', `Course v${completion.course?.version ?? result.course.version}`),
          summaryCard('Lessons', `${instruction.completedLessonCount ?? 0}/${instruction.requiredLessonCount ?? 0}`, `${instruction.completionPercent ?? 0}% complete`),
          summaryCard('Final', statusLabel(completion.finalAssessment?.status), 'Server-graded academic assessment'),
          summaryCard('Academic practical', statusLabel(completion.performanceAssessment?.status), completion.performanceAssessment?.status === 'not-required' ? 'Not required for this course' : 'Separate academic performance evidence')
        );
        row.append(stats);
        if (completion.complete === true) {
          row.append(text('p', 'Academic requirements complete. This does not by itself issue or authorize a professional credential.', 'portal-result-note'));
        } else {
          const remaining = (completion.missingRequirements ?? []).map(statusLabel);
          row.append(text('p', remaining.length ? `Requirements still open: ${remaining.join(', ')}.` : 'Academic requirements are still in progress.', 'portal-result-note'));
        }
        courseList.append(row);
      }
      academicSection.append(courseList);
    }
    panel.append(academicSection);

    const tech1Summary = document.createElement('section');
    tech1Summary.className = 'portal-progress-section credential-program-summary';
    tech1Summary.append(text('h3', 'Technician I professional credential progress'));
    const tech1Cards = document.createElement('div');
    tech1Cards.className = 'portal-progress-summary';
    const tech1Attempts = tech1Data.assessmentAttempts ?? [];
    const tech1BestScore = tech1Attempts.filter((row) => row.status === 'scored' && row.scorePercent != null).reduce((best, row) => Math.max(best, Number(row.scorePercent)), -1);
    const tech1CoursesRequired = tech1Data.credential?.requiredCourses ?? [];
    const tech1MissingCourses = (tech1Data.eligibility?.missingRequirements ?? []).filter((row) => row.type === 'course-completion').length;
    const tech1CoursesComplete = Math.max(0, tech1CoursesRequired.length - tech1MissingCourses);
    const tech1PerformancePassed = (tech1Data.performanceAssessments ?? []).filter((row) => row.status === 'passed' && Number(row.criticalErrorCount ?? 0) === 0).length;
    const tech1Demonstrated = (tech1TranscriptData.competencies ?? []).filter((row) => row.masteryLevel === 'demonstrated').length;
    const tech1ReleasePending = tech1Data.eligibility?.requirementsSatisfied === true && tech1Data.eligibility?.releaseAuthorized === false;
    const tech1CredentialStatus = tech1Data.eligibility?.eligible ? 'Eligible' : tech1ReleasePending ? 'Release pending' : 'In progress';
    tech1Cards.append(
      summaryCard('Credential status', tech1CredentialStatus, tech1Data.credential?.title ?? 'THC Cultivation Technician I'),
      summaryCard('Required courses', `${tech1CoursesComplete}/${tech1CoursesRequired.length}`, 'All seven Technician I courses are required'),
      summaryCard('Credential assessment', tech1BestScore >= 0 ? `${tech1BestScore.toFixed(0)}%` : 'Not attempted', `Current configured threshold ${tech1Data.credential?.minimumPassingScorePercent ?? 80}%`),
      summaryCard('Practical & capstone evidence', `${tech1PerformancePassed}/${(tech1Data.performanceAssessments ?? []).length}`, 'Practicals A–F plus integrated capstone'),
      summaryCard('Competencies demonstrated', String(tech1Demonstrated), `${(tech1TranscriptData.competencies ?? []).length} transcript records`)
    );
    tech1Summary.append(tech1Cards);
    if (!(tech1Data.eligibility?.eligible)) {
      const tech1Blockers = document.createElement('div');
      tech1Blockers.className = 'portal-blockers';
      tech1Blockers.append(text('h4', 'Technician I requirements still open'));
      const tech1List = document.createElement('ul');
      for (const row of tech1Data.eligibility?.missingRequirements ?? []) {
        const humanType = row.type === 'assessment' ? 'Credential assessment' : row.type === 'performance-assessment' ? 'Practical/capstone' : row.type === 'course-completion' ? 'Course completion' : 'Portfolio artifact';
        tech1List.append(text('li', `${humanType}: ${row.id} — ${statusLabel(row.reason)}`));
      }
      for (const row of tech1Data.eligibility?.releaseBlockers ?? []) tech1List.append(text('li', `Credential release: ${statusLabel(row.reason)}`));
      if (!tech1List.children.length) tech1List.append(text('li', 'No unresolved Technician I requirement details are available.'));
      tech1Blockers.append(tech1List);
      tech1Summary.append(tech1Blockers);
    }
    panel.append(tech1Summary);

    const summary = document.createElement('section');
    summary.className = 'portal-progress-summary';
    const attempts = data.assessmentAttempts ?? [];
    const bestScore = attempts.filter((row) => row.status === 'scored' && row.scorePercent != null).reduce((best, row) => Math.max(best, Number(row.scorePercent)), -1);
    const demonstrated = (data.competencies ?? []).filter((row) => row.masteryLevel === 'demonstrated').length;
    const performancePassed = (data.performanceAssessments ?? []).filter((row) => row.status === 'passed' && Number(row.criticalErrorCount ?? 0) === 0).length;
    const portfolioComplete = (data.portfolioArtifacts ?? []).filter((row) => ['accepted','verified','complete'].includes(row.status)).length;
    const releasePending = data.eligibility?.requirementsSatisfied === true && data.eligibility?.releaseAuthorized === false;
    const credentialStatus = data.eligibility?.eligible ? 'Eligible' : releasePending ? 'Release pending' : 'In progress';
    const credentialStatusNote = releasePending
      ? 'Learner requirements are satisfied; credential validation/release gates are still open.'
      : (data.credential?.title ?? '');
    summary.append(
      summaryCard('Credential status', credentialStatus, credentialStatusNote),
      summaryCard('Best written exam', bestScore >= 0 ? `${bestScore.toFixed(0)}%` : 'Not attempted', `Pass ${data.credential?.minimumPassingScorePercent ?? 80}%`),
      summaryCard('Competencies demonstrated', String(demonstrated), `${(data.competencies ?? []).length} transcript records`),
      summaryCard('Performance evidence', `${performancePassed}/${(data.performanceAssessments ?? []).length}`, '7 practicals + capstone'),
      summaryCard('Portfolio evidence', `${portfolioComplete}/${(data.portfolioArtifacts ?? []).length}`, 'Employment artifacts')
    );
    panel.append(text('h3', 'Technician II professional credential progress'), summary);

    if (!(data.eligibility?.eligible)) {
      const blocker = document.createElement('section');
      blocker.className = 'portal-blockers';
      blocker.append(text('h3', 'What remains'));
      const list = document.createElement('ul');
      for (const row of data.eligibility?.missingRequirements ?? []) {
        const humanType = row.type === 'assessment'
          ? 'Written assessment'
          : row.type === 'performance-assessment'
            ? 'Practical/capstone'
            : row.type === 'course-completion'
              ? 'Course completion'
              : 'Portfolio artifact';
        list.append(text('li', `${humanType}: ${row.id} — ${statusLabel(row.reason)}`));
      }
      for (const row of data.eligibility?.releaseBlockers ?? []) {
        list.append(text('li', `Credential release: ${statusLabel(row.reason)}`));
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
    transcript.append(text('p', 'This transcript is a privacy-bounded evidence view. It excludes learner identifiers, private evaluator notes, raw responses, and answer-key material.', 'portal-result-note'));
    if (!(transcriptData.competencies ?? []).length) {
      transcript.append(text('p', 'No competency mastery records are available yet. Competency evidence is created by scored official assessments, not by opening lessons.', 'portal-result-note'));
    } else {
      const list = document.createElement('div');
      list.className = 'portal-evidence-list';
      for (const row of transcriptData.competencies) {
        const item = document.createElement('div');
        item.className = 'portal-evidence-row';
        const identity = document.createElement('div');
        identity.append(text('strong', row.competencyId));
        identity.append(text('span', `Curriculum ${row.curriculumVersion ?? 'not recorded'}`, 'portal-evidence-meta'));
        item.append(identity, text('span', statusLabel(row.masteryLevel), `portal-evidence-status status-${row.masteryLevel}`));
        list.append(item);
      }
      transcript.append(list);
    }
    panel.append(transcript);
    panel.append(evidenceList('Practical & capstone evidence', transcriptData.performanceAssessments ?? [], 'assessmentId'));
    panel.append(evidenceList('Employment portfolio', transcriptData.portfolioArtifacts ?? [], 'artifactId'));
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

function downloadStatusLabel(download) {
  if (download.status === 'published' && download.releaseStatus === 'public') return 'Published resource';
  return 'Development preview';
}

function renderDownloadCard(download) {
  const card = document.createElement('article');
  card.className = 'download-card';

  const header = document.createElement('div');
  header.className = 'download-card-header';
  const identity = document.createElement('div');
  identity.append(text('p', `${String(download.format ?? '').toUpperCase()} · ${statusLabel(download.kind)}`, 'download-kind'));
  identity.append(text('h3', download.title));
  header.append(identity, text('span', downloadStatusLabel(download), `download-status status-${download.status}`));
  card.append(header, text('p', download.description, 'download-description'));

  const metadata = document.createElement('dl');
  const fields = [
    ['Course mappings', String((download.courseMappings ?? []).length)],
    ['Version', download.version],
    ['Accessibility', statusLabel(download.accessibilityStatus)]
  ];
  for (const [label, value] of fields) {
    const row = document.createElement('div');
    row.append(text('dt', label), text('dd', value));
    metadata.append(row);
  }
  card.append(metadata);

  if ((download.instructions ?? []).length) {
    card.append(text('p', 'Use this tool', 'download-subheading'));
    const list = document.createElement('ul');
    for (const instruction of download.instructions) list.append(text('li', instruction));
    card.append(list);
  }

  const action = document.createElement('a');
  action.className = 'download-action';
  action.href = download.path;
  action.download = '';
  action.append(text('span', 'Download CSV'));
  action.setAttribute('aria-label', `Download ${download.title} as CSV`);
  card.append(action);
  return card;
}

async function renderDownloads() {
  setActive('tab-resources');
  if (compactCatalog?.matches) setCatalogExpanded(false);
  const panel = document.createElement('div');
  panel.className = 'portal-panel downloads-panel';
  panel.append(text('p', 'Printable learner resources', 'eyebrow'));
  panel.append(text('h2', 'Logs, Worksheets & Job Aids'));
  panel.append(text('p', 'Use these structured tools during course exercises and practice. Site-approved records and SOPs remain authoritative for regulated or workplace activity.', 'lede'));
  const status = text('p', 'Loading learner resources…', 'status');
  status.setAttribute('aria-live', 'polite');
  panel.append(status);
  lessonView.replaceChildren(panel);
  lessonView.focus();

  try {
    const response = await fetch('/api/downloads', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Resource catalog unavailable (${response.status}).`);
    const body = await response.json();
    const downloads = Array.isArray(body.downloads) ? body.downloads : [];
    status.textContent = downloads.length
      ? `${downloads.length} resource${downloads.length === 1 ? '' : 's'} available in ${body.mode === 'staging-preview' ? 'development preview' : 'the public library'}.`
      : 'No learner downloads are currently published.';
    if (!downloads.length) return;
    const grid = document.createElement('div');
    grid.className = 'download-grid';
    for (const download of downloads) grid.append(renderDownloadCard(download));
    panel.append(grid);
  } catch (error) {
    status.className = 'portal-error';
    status.textContent = error.message;
  }
}

function printVerifiedCertificate(record) {
  if (!record?.verificationId || !['issued','valid'].includes(record.status)) return;
  const certificate = document.createElement('section');
  certificate.className = 'print-certificate';
  certificate.setAttribute('aria-label', 'Printable THC Academy credential certificate');
  certificate.append(text('p', 'Teaching Healthy Cultivation', 'print-certificate-brand'));
  certificate.append(text('p', 'THC Academy', 'print-certificate-academy'));
  certificate.append(text('h1', 'Certificate of Credential'));
  certificate.append(text('p', 'This certifies that', 'print-certificate-copy'));
  certificate.append(text('h2', record.recipientDisplayName || record.recipient?.certificateName || 'Credential holder', 'print-certificate-name'));
  certificate.append(text('p', 'has been issued the educational credential', 'print-certificate-copy'));
  certificate.append(text('h3', record.credential?.title ?? 'THC Academy Credential', 'print-certificate-title'));
  const meta = document.createElement('dl');
  const fields = [
    ['Verification ID', record.verificationId],
    ['Credential ID', record.credential?.id],
    ['Status', record.status],
    ['Issued', record.issuedAt ? new Date(record.issuedAt).toLocaleDateString() : null],
    ['Expires', record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : 'No expiration recorded'],
    ['Issuer', record.issuer?.name]
  ];
  for (const [label, value] of fields) {
    if (!value) continue;
    const row = document.createElement('div');
    row.append(text('dt', label), text('dd', value));
    meta.append(row);
  }
  certificate.append(meta);
  certificate.append(text('p', 'Verify this credential using the verification ID at the THC Academy credential verification page.', 'print-certificate-verify'));
  certificate.append(text('p', record.disclaimer ?? '', 'print-certificate-disclaimer'));
  document.body.append(certificate);
  document.body.classList.add('printing-certificate');
  const cleanup = () => {
    document.body.classList.remove('printing-certificate');
    certificate.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(() => { if (certificate.isConnected) cleanup(); }, 1500);
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
      if (['issued','valid'].includes(record.status)) {
        const print = text('button', 'Print certificate', 'record-button portal-certificate-print');
        print.type = 'button';
        print.addEventListener('click', () => printVerifiedCertificate(record));
        card.append(print);
      }
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
document.querySelector('#tab-resources')?.addEventListener('click', renderDownloads);
document.querySelector('#tab-verify')?.addEventListener('click', renderVerify);
