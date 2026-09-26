import { courseProgress, createServerProgressClient, readProgress, setLessonComplete, writeProgress } from './progress.js';
import { renderRichBlocks } from './rich-content.js';
import { launchCourseAssessment } from './course-assessment.js';

const catalogRoot = document.querySelector('#catalog');
const catalogStatus = document.querySelector('#catalog-status');
const searchInput = document.querySelector('#course-search');
const lessonView = document.querySelector('#lesson-view');
const modeBadge = document.querySelector('#mode-badge');

let catalog = null;
let progress = readProgress();
let progressMode = 'local';
let accountSubject = null;
let currentLesson = null;
let enrollments = [];
const progressClient = createServerProgressClient();
const academyParams = new URLSearchParams(globalThis.location?.search ?? '');
const deepLinkedCourseId = academyParams.get('course');
const deepLinkedView = academyParams.get('view');
let deepLinkHandled = false;

function text(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = value ?? '';
  if (className) node.className = className;
  return node;
}

function matchesQuery(course, query) {
  if (!query) return true;
  const haystack = [course.title, course.description, ...course.modules.flatMap((module) => [module.title, ...module.lessons.map((lesson) => lesson.title)])].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function progressLabel() {
  return progressMode === 'account' ? 'Account lesson progress' : 'Device lesson progress';
}
function humanStatus(value) {
  return String(value ?? 'not-recorded').replaceAll('-', ' ');
}


function enrollmentFor(course) {
  return enrollments.find((row) => row.courseId === course.id && String(row.courseVersion) === String(course.version)) ?? null;
}

async function loadAccountEnrollments() {
  const response = await fetch('/api/v1/me/enrollments', {
    headers: { accept: 'application/json' },
    credentials: 'same-origin'
  });
  if (!response.ok) throw new Error(`Enrollment request failed (${response.status})`);
  const body = await response.json();
  enrollments = Array.isArray(body.enrollments) ? body.enrollments : [];
}

async function enrollInCourse(course, button, status) {
  button.disabled = true;
  status.textContent = 'Enrolling…';
  try {
    const response = await fetch('/api/v1/me/enrollments', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ courseId: course.id, courseVersion: String(course.version) })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Sign in to enroll in this course.');
      if (body.error === 'course-not-open-for-enrollment') throw new Error('This course is not open for enrollment yet.');
      throw new Error(`Enrollment failed (${response.status}).`);
    }
    const existing = enrollmentFor(course);
    if (!existing) enrollments.push(body.enrollment);
    status.textContent = body.enrollment.status === 'completed'
      ? 'Already enrolled • academic requirements complete'
      : 'Enrolled • academic course progress is now linked to your account';
    renderCatalog();
  } catch (error) {
    button.disabled = false;
    status.textContent = error.message;
  }
}

function renderCourseEnrollment(details, course) {
  const panel = document.createElement('div');
  panel.className = 'course-enrollment-panel';
  const status = text('p', '', 'course-enrollment-status');
  status.setAttribute('aria-live', 'polite');

  if (course.status !== 'published') {
    status.textContent = 'Development preview only • enrollment is unavailable until this academic course is published.';
    panel.append(status);
    details.append(panel);
    return;
  }

  const enrollment = enrollmentFor(course);
  if (enrollment) {
    status.textContent = enrollment.status === 'completed'
      ? 'Enrolled • academic requirements complete'
      : `Enrolled • ${humanStatus(enrollment.status)}`;
    panel.append(status);
    details.append(panel);
    return;
  }

  if (progressMode !== 'account') {
    status.textContent = 'Sign in to enroll and sync official academic course progress to your account.';
    panel.append(status);
    details.append(panel);
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'course-enroll-button';
  button.textContent = 'Enroll in this course';
  button.addEventListener('click', () => enrollInCourse(course, button, status));
  status.textContent = 'Enrollment is for this academic course only; professional credential eligibility is tracked separately.';
  panel.append(button, status);
  details.append(panel);
}

function renderPathwayPanel(details, course) {
  const pathway = course.pathway;
  const hasCoursePrerequisites = Array.isArray(course.prerequisites) && course.prerequisites.length > 0;
  if (!pathway && !course.level && !hasCoursePrerequisites) return;

  const panel = document.createElement('section');
  panel.className = 'course-pathway-panel';
  panel.setAttribute('aria-label', `${course.title} pathway and prerequisites`);
  panel.append(text('p', 'Pathway & prerequisites', 'course-pathway-heading'));

  if (course.level) {
    panel.append(text('p', `Course level: ${course.level}`, 'course-pathway-line'));
  }

  if (pathway) {
    const status = humanStatus(pathway.status);
    panel.append(text('p', `Professional pathway: ${pathway.title} • ${status}`, 'course-pathway-line'));
    if ((pathway.targetRoles ?? []).length) {
      panel.append(text('p', `Target roles: ${pathway.targetRoles.join(', ')}`, 'course-pathway-line'));
    }
    if ((pathway.proficiencyTarget ?? []).length) {
      panel.append(text('p', `Program proficiency target: ${pathway.proficiencyTarget.join(' / ')}`, 'course-pathway-line'));
    }
    if ((pathway.prerequisiteCredentials ?? []).length) {
      const heading = text('p', 'Professional pathway prerequisite', 'course-pathway-subheading');
      const list = document.createElement('ul');
      list.className = 'course-pathway-list';
      for (const prerequisite of pathway.prerequisiteCredentials) {
        list.append(text('li', `${prerequisite.title} • ${humanStatus(prerequisite.status)}`));
      }
      panel.append(heading, list);
      panel.append(text('p', 'This program prerequisite applies to the professional credential pathway. It does not by itself restrict access to public academic study unless the course prerequisites below say so.', 'course-pathway-note'));
    }
  }

  if (hasCoursePrerequisites) {
    panel.append(text('p', 'Public study prerequisites', 'course-pathway-subheading'));
    const list = document.createElement('ul');
    list.className = 'course-pathway-list';
    for (const prerequisite of course.prerequisites) list.append(text('li', prerequisite));
    panel.append(list);
  }

  if (Array.isArray(course.intendedAudience) && course.intendedAudience.length) {
    panel.append(text('p', `Intended audience: ${course.intendedAudience.join('; ')}`, 'course-pathway-note'));
  }

  details.append(panel);
}

function renderCatalog() {
  catalogRoot.replaceChildren();
  const query = searchInput.value.trim();
  const courses = (catalog?.courses ?? []).filter((course) => matchesQuery(course, query));
  catalogStatus.textContent = `${courses.length} course${courses.length === 1 ? '' : 's'} shown • ${progressLabel()}`;
  const completed = new Set(progress.completedLessons);

  for (const course of courses) {
    const details = document.createElement('details');
    details.className = 'course';
    details.dataset.courseId = course.id;
    if (query || courseProgress(course, progress).completed > 0 || deepLinkedCourseId === course.id) details.open = true;
    const summary = document.createElement('summary');
    summary.append(text('span', course.title));
    const courseState = courseProgress(course, progress);
    const metaParts = [];
    if (course.credentialBearing) metaParts.push('credential pathway');
    metaParts.push(`${courseState.completed}/${courseState.total} lessons • ${courseState.percent}% lesson progress`);
    summary.append(text('span', metaParts.join(' • '), 'course-meta'));
    details.append(summary);

    const progressTrack = document.createElement('div');
    progressTrack.className = 'progress-track';
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-label', `${course.title} lesson progress`);
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', '100');
    progressTrack.setAttribute('aria-valuenow', String(courseState.percent));
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${courseState.percent}%`;
    progressTrack.append(progressFill);
    details.append(progressTrack);

    if (course.credentialBearing) {
      const academicRequirement = course.finalAssessment?.academicPracticalRequired
        ? 'Academic course completion requires the graded final plus the linked academic practical.'
        : 'Academic course completion requires the graded final; professional practical/performance requirements are tracked separately.';
      details.append(text('p', `Lesson progress only. ${academicRequirement} Professional credential issuance remains a separate process.`, 'course-meta'));
    }
    if (course.finalAssessment) {
      const final = course.finalAssessment;
      const label = final.purpose === 'credential' ? 'Credential assessment' : 'Course final';
      const note = `${label}: ${final.title} • ${Number(final.itemCount ?? 0)} items • provisional ${Number(final.passingScorePercent ?? 0).toFixed(0)}% academic threshold`;
      details.append(text('p', note, 'course-final-summary'));
      if (final.status === 'published' && final.purpose === 'summative') {
        const finalActions = document.createElement('div');
        finalActions.className = 'course-assessment-actions course-final-actions';
        const launch = document.createElement('button');
        launch.type = 'button';
        launch.className = 'course-assessment-launch';
        launch.dataset.courseFinalFor = course.id;
        launch.textContent = 'Take graded course final';
        launch.setAttribute('aria-label', `Take graded final for ${course.title}`);
        launch.addEventListener('click', () => launchCourseAssessment(course.id, launch));
        finalActions.append(launch);
        details.append(finalActions);
      }
    }

    renderCourseEnrollment(details, course);
    renderPathwayPanel(details, course);

    for (const module of course.modules) {
      const section = document.createElement('section');
      section.className = 'module';
      section.append(text('h3', module.title, 'module-title'));
      const list = document.createElement('ul');
      list.className = 'lesson-list';
      for (const lesson of module.lessons) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lesson-link';
        if (completed.has(lesson.id)) button.classList.add('lesson-complete');
        const completion = completed.has(lesson.id) ? '✓ ' : '';
        button.textContent = `${completion}${lesson.title}${lesson.estimatedMinutes ? ` · ${lesson.estimatedMinutes} min` : ''}`;
        button.setAttribute('aria-pressed', currentLesson?.id === lesson.id ? 'true' : 'false');
        button.addEventListener('click', () => openLesson(lesson.id));
        item.append(button);
        list.append(item);
      }
      section.append(list);
      if (module.assessment) {
        const checkpoint = document.createElement('button');
        checkpoint.type = 'button';
        checkpoint.className = 'lesson-link module-checkpoint-link';
        checkpoint.textContent = 'Module checkpoint · formative test';
        checkpoint.addEventListener('click', () => openModuleAssessment(module.id));
        section.append(checkpoint);
      }
      details.append(section);
    }
    catalogRoot.append(details);
  }

  if (!deepLinkHandled && deepLinkedCourseId) {
    const target = catalogRoot.querySelector(`details.course[data-course-id="${CSS.escape(deepLinkedCourseId)}"]`);
    if (target) {
      target.open = true;
      const focusTarget = deepLinkedView === 'final'
        ? target.querySelector('[data-course-final-for]')
        : target.querySelector('summary');
      if (focusTarget) {
        deepLinkHandled = true;
        requestAnimationFrame(() => {
          focusTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
          focusTarget.focus();
        });
      }
    }
  }
}

function appendList(parent, heading, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const section = document.createElement('section');
  section.className = 'lesson-section';
  section.append(text('h3', heading));
  const list = document.createElement('ul');
  list.className = 'list-clean';
  for (const item of items) list.append(text('li', item));
  section.append(list);
  parent.append(section);
}

function practiceSeed() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function gradeFormativeResponse(url, { itemId, selectedIndex, presentationSeed }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ itemId, selectedIndex, presentationSeed })
  });
  if (!response.ok) throw new Error(`Feedback request failed (${response.status})`);
  return response.json();
}

function formativeFeedback(result) {
  return result.isCorrect
    ? `Correct. ${result.rationale ?? ''}`
    : `Not quite. The best answer is: ${result.correctChoice ?? 'the keyed response'}. ${result.rationale ?? ''}`;
}

function renderPracticeSection(article, lesson) {
  const section = document.createElement('section');
  section.className = 'lesson-section practice-section';
  section.append(text('h3', 'Practice check'));
  section.append(text('p', 'Use these low-stakes questions to retrieve the lesson ideas before moving on. Feedback appears after each response.'));
  const status = text('p', 'Loading practice…', 'status');
  section.append(status);
  article.append(section);

  const seed = practiceSeed();
  fetch(`/api/lessons/${encodeURIComponent(lesson.id)}/practice?seed=${encodeURIComponent(seed)}`, { headers: { accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`Practice request failed (${response.status})`);
      return response.json();
    })
    .then((payload) => {
      const items = payload.items ?? [];
      if (items.length === 0) {
        status.textContent = 'Lesson practice is being expanded. Continue with the worked examples and practical application below.';
        return;
      }
      status.remove();
      items.forEach((item, itemIndex) => {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'practice-item';
        const legend = document.createElement('legend');
        legend.textContent = `${itemIndex + 1}. ${item.stem}`;
        fieldset.append(legend);
        renderRichBlocks(fieldset, item.stimulus);
        const options = document.createElement('div');
        options.className = 'practice-options';
        const name = `practice-${lesson.id}-${item.id}`;
        item.choices.forEach((choice, choiceIndex) => {
          const label = document.createElement('label');
          label.className = 'practice-choice';
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = name;
          input.value = String(choiceIndex);
          input.addEventListener('change', async () => {
            if (fieldset.dataset.answered === 'true' || fieldset.dataset.submitting === 'true') return;
            fieldset.dataset.submitting = 'true';
            const inputs = [...fieldset.querySelectorAll('input[type="radio"]')];
            inputs.forEach((control) => { control.disabled = true; });
            feedback.dataset.state = '';
            feedback.textContent = 'Checking response…';
            try {
              const result = await gradeFormativeResponse(`/api/lessons/${encodeURIComponent(lesson.id)}/practice/grade`, {
                itemId: item.id,
                selectedIndex: choiceIndex,
                presentationSeed: payload.presentationSeed
              });
              fieldset.dataset.answered = 'true';
              feedback.dataset.state = result.isCorrect ? 'correct' : 'incorrect';
              feedback.textContent = formativeFeedback(result);
            } catch (error) {
              delete fieldset.dataset.submitting;
              inputs.forEach((control) => { control.disabled = false; });
              feedback.dataset.state = 'incorrect';
              feedback.textContent = `Feedback unavailable: ${error.message}. Try again.`;
              return;
            }
            delete fieldset.dataset.submitting;
          });
          label.append(input, text('span', choice));
          options.append(label);
        });
        const feedback = text('p', 'Choose one answer.', 'practice-feedback');
        feedback.setAttribute('aria-live', 'polite');
        fieldset.append(options, feedback);
        section.append(fieldset);
      });
    })
    .catch((error) => {
      status.textContent = `Practice unavailable: ${error.message}`;
      status.classList.add('error');
    });
}

function renderModuleAssessment(payload) {
  currentLesson = null;
  const article = document.createElement('article');
  article.className = 'lesson-article module-assessment';
  article.append(text('p', 'Low-stakes module checkpoint', 'eyebrow'));
  article.append(text('h2', payload.assessment.title));
  article.append(text('p', `This ${payload.assessment.totalItems}-item checkpoint is formative learning practice. The current ${Number(payload.assessment.passingScorePercent).toFixed(0)}% mastery target is a development target for feedback and remediation, not a credential cut score or certification decision.`, 'callout'));
  const progressNote = text('p', `0/${payload.assessment.totalItems} answered`, 'status');
  progressNote.setAttribute('aria-live', 'polite');
  article.append(progressNote);

  let answered = 0;
  let correct = 0;
  const updateSummary = () => {
    const total = Number(payload.assessment.totalItems ?? payload.items.length);
    if (answered < total) {
      progressNote.textContent = `${answered}/${total} answered • ${correct} correct so far`;
      return;
    }
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const target = Number(payload.assessment.passingScorePercent ?? 0);
    progressNote.textContent = `${correct}/${total} correct • ${percent}%. ${percent >= target ? 'Development mastery target met for this checkpoint.' : 'Review the missed items and aligned lessons, then try another shuffled checkpoint.'}`;
  };

  for (const [itemIndex, item] of (payload.items ?? []).entries()) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'practice-item';
    const legend = document.createElement('legend');
    legend.textContent = `${itemIndex + 1}. ${item.stem}`;
    fieldset.append(legend);
    renderRichBlocks(fieldset, item.stimulus);
    const options = document.createElement('div');
    options.className = 'practice-options';
    const name = `module-${payload.module.id}-${item.id}`;
    item.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement('label');
      label.className = 'practice-choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = String(choiceIndex);
      input.addEventListener('change', async () => {
        if (fieldset.dataset.answered === 'true' || fieldset.dataset.submitting === 'true') return;
        fieldset.dataset.submitting = 'true';
        const inputs = [...fieldset.querySelectorAll('input[type="radio"]')];
        inputs.forEach((control) => { control.disabled = true; });
        feedback.dataset.state = '';
        feedback.textContent = 'Checking response…';
        try {
          const result = await gradeFormativeResponse(`/api/modules/${encodeURIComponent(payload.module.id)}/assessment/grade`, {
            itemId: item.id,
            selectedIndex: choiceIndex,
            presentationSeed: payload.presentationSeed
          });
          fieldset.dataset.answered = 'true';
          answered += 1;
          if (result.isCorrect) correct += 1;
          feedback.dataset.state = result.isCorrect ? 'correct' : 'incorrect';
          feedback.textContent = formativeFeedback(result);
          updateSummary();
        } catch (error) {
          delete fieldset.dataset.submitting;
          inputs.forEach((control) => { control.disabled = false; });
          feedback.dataset.state = 'incorrect';
          feedback.textContent = `Feedback unavailable: ${error.message}. Try again.`;
          return;
        }
        delete fieldset.dataset.submitting;
      });
      label.append(input, text('span', choice));
      options.append(label);
    });
    const feedback = text('p', 'Choose one answer.', 'practice-feedback');
    feedback.setAttribute('aria-live', 'polite');
    fieldset.append(options, feedback);
    article.append(fieldset);
  }

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'lesson-link module-checkpoint-link';
  retry.textContent = 'Try another shuffled checkpoint';
  retry.addEventListener('click', () => openModuleAssessment(payload.module.id));
  article.append(retry);
  lessonView.replaceChildren(article);
  lessonView.focus();
  renderCatalog();
}

async function openModuleAssessment(moduleId) {
  lessonView.replaceChildren(text('p', 'Loading module checkpoint…', 'status'));
  try {
    const seed = practiceSeed();
    const response = await fetch(`/api/modules/${encodeURIComponent(moduleId)}/assessment?seed=${encodeURIComponent(seed)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Module checkpoint request failed (${response.status})`);
    renderModuleAssessment(await response.json());
  } catch (error) {
    const card = text('div', '', 'welcome-card error');
    card.append(text('h2', 'Module checkpoint unavailable'));
    card.append(text('p', error.message));
    lessonView.replaceChildren(card);
  }
}

function renderCompletionControl(article, lesson) {
  const section = document.createElement('section');
  section.className = 'completion-panel';
  const checked = progress.completedLessons.includes(lesson.id);
  const label = document.createElement('label');
  label.className = 'completion-label';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  const note = text('p', '', 'completion-note');

  function setNote() {
    if (progressMode === 'account') {
      note.textContent = checkbox.checked
        ? `Saved to your Academy account${accountSubject ? ` (${accountSubject})` : ''}. Lesson completion does not itself satisfy assessment, practical, or credential requirements.`
        : 'Account lesson progress is persisted. Lesson completion does not itself satisfy assessment, practical, or credential requirements.';
    } else {
      note.textContent = checkbox.checked
        ? 'Saved on this device as lesson progress only. Assessment, practical, and credential records are tracked separately.'
        : 'Device lesson progress is separate from official assessment, practical, and credential records.';
    }
  }
  setNote();

  checkbox.addEventListener('change', async () => {
    const requested = checkbox.checked;
    checkbox.disabled = true;
    if (progressMode === 'account') {
      try {
        await progressClient.setLesson({ lessonId: lesson.id, lessonVersion: lesson.version, complete: requested });
        progress = setLessonComplete(progress, lesson.id, requested);
      } catch (error) {
        checkbox.checked = !requested;
        note.textContent = `${error.message}. Your account lesson progress was not changed.`;
        checkbox.disabled = false;
        return;
      }
    } else {
      progress = writeProgress(setLessonComplete(progress, lesson.id, requested));
    }
    checkbox.disabled = false;
    setNote();
    renderCatalog();
  });
  label.append(checkbox, text('span', 'Mark this lesson complete'));
  section.append(label, note);
  article.append(section);
}

function renderLegacyLessonContent(article, content) {
  for (const sectionData of content.sections ?? []) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', sectionData.title));
    section.append(text('p', sectionData.body));
    article.append(section);
  }
  appendList(article, 'Worked examples', content.workedExamples);
  appendList(article, 'Common mistakes', content.commonMistakes);
  if (content.practicalApplication) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', 'Practical application'));
    section.append(text('p', content.practicalApplication, 'callout'));
    article.append(section);
  }
  if (content.summary) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', 'Summary'));
    section.append(text('p', content.summary));
    article.append(section);
  }
}

function renderLesson(lesson) {
  currentLesson = lesson;
  const article = document.createElement('article');
  article.className = 'lesson-article';
  article.append(text('p', 'THC Academy lesson', 'eyebrow'));
  article.append(text('h2', lesson.title));
  const meta = document.createElement('div');
  meta.className = 'lesson-meta';
  if (lesson.estimatedMinutes) meta.append(text('span', `${lesson.estimatedMinutes} min`, 'pill'));
  meta.append(text('span', `Version ${lesson.version}`, 'pill'));
  meta.append(text('span', progressLabel(), 'pill'));
  article.append(meta);

  const content = lesson.content ?? {};
  if (content.overview) {
    const intro = document.createElement('p');
    intro.className = 'callout';
    intro.textContent = content.overview;
    article.append(intro);
  }
  if (Array.isArray(content.vocabulary) && content.vocabulary.length) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', 'Vocabulary'));
    const grid = document.createElement('dl');
    grid.className = 'vocab-grid';
    for (const item of content.vocabulary) {
      const card = document.createElement('div');
      card.className = 'vocab-card';
      card.append(text('dt', item.term));
      card.append(text('dd', item.definition));
      grid.append(card);
    }
    section.append(grid);
    article.append(section);
  }

  // Optional governed primary visuals can be added without replacing legacy lesson content.
  const governedPrimaryVisuals = Array.isArray(content.extensions?.primaryVisuals)
    ? content.extensions.primaryVisuals.filter((block) => block.extensions?.releaseApproved === true)
    : [];
  renderRichBlocks(article, governedPrimaryVisuals);

  const renderedRich = renderRichBlocks(article, content.blocks);
  if (!renderedRich) renderLegacyLessonContent(article, content);

  if (lesson.references?.length) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', 'Evidence references'));
    section.append(text('p', lesson.references.join(', ')));
    article.append(section);
  }
  renderPracticeSection(article, lesson);
  renderCompletionControl(article, lesson);
  lessonView.replaceChildren(article);
  lessonView.focus();
  renderCatalog();
}

async function openLesson(id) {
  lessonView.replaceChildren(text('p', 'Loading lesson…', 'status'));
  try {
    const response = await fetch(`/api/lessons/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Lesson request failed (${response.status})`);
    renderLesson(await response.json());
  } catch (error) {
    currentLesson = null;
    const card = text('div', '', 'welcome-card error');
    card.append(text('h2', 'Lesson unavailable'));
    card.append(text('p', error.message));
    lessonView.replaceChildren(card);
  }
}

async function loadProgressMode() {
  try {
    const account = await progressClient.load();
    progress = account.progress;
    progressMode = 'account';
    accountSubject = account.subject;
    await loadAccountEnrollments();
  } catch {
    progress = readProgress();
    progressMode = 'local';
    accountSubject = null;
    enrollments = [];
  }
}

async function start() {
  try {
    const response = await fetch('/api/catalog', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    catalog = await response.json();
    await loadProgressMode();
    modeBadge.textContent = catalog.mode === 'staging-preview'
      ? `Development preview • ${progressLabel()}`
      : `Public learning content • ${progressLabel()}`;
    renderCatalog();
  } catch (error) {
    modeBadge.textContent = 'Unavailable';
    catalogStatus.textContent = error.message;
    catalogStatus.classList.add('error');
  }
}

searchInput.addEventListener('input', renderCatalog);
start();
