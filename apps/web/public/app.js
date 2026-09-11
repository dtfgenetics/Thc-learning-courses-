import { courseProgress, createServerProgressClient, readProgress, setLessonComplete, writeProgress } from './progress.js';
import { renderRichBlocks } from './rich-content.js';

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
const progressClient = createServerProgressClient();

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
  return progressMode === 'account' ? 'Account progress' : 'Device progress';
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
    if (query || courseProgress(course, progress).completed > 0) details.open = true;
    const summary = document.createElement('summary');
    summary.append(text('span', course.title));
    const courseState = courseProgress(course, progress);
    const metaParts = [];
    if (course.credentialBearing) metaParts.push('credential pathway');
    metaParts.push(`${courseState.completed}/${courseState.total} lessons • ${courseState.percent}%`);
    summary.append(text('span', metaParts.join(' • '), 'course-meta'));
    details.append(summary);

    const progressTrack = document.createElement('div');
    progressTrack.className = 'progress-track';
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-label', `${course.title} ${progressLabel().toLowerCase()}`);
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', '100');
    progressTrack.setAttribute('aria-valuenow', String(courseState.percent));
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${courseState.percent}%`;
    progressTrack.append(progressFill);
    details.append(progressTrack);

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
      details.append(section);
    }
    catalogRoot.append(details);
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
          input.addEventListener('change', () => {
            const inputs = [...fieldset.querySelectorAll('input[type="radio"]')];
            inputs.forEach((control) => { control.disabled = true; });
            const isCorrect = choiceIndex === item.correct;
            feedback.dataset.state = isCorrect ? 'correct' : 'incorrect';
            feedback.textContent = isCorrect
              ? `Correct. ${item.rationale ?? ''}`
              : `Not quite. The best answer is: ${item.choices[item.correct]}. ${item.rationale ?? ''}`;
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
        ? `Saved to your Academy account${accountSubject ? ` (${accountSubject})` : ''}. Lesson completion does not itself satisfy assessment or credential requirements.`
        : 'Account progress is persisted. Lesson completion does not itself satisfy assessment or credential requirements.';
    } else {
      note.textContent = checkbox.checked
        ? 'Saved on this device.'
        : 'Device progress is separate from official assessment and credential records.';
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
        note.textContent = `${error.message}. Your account progress was not changed.`;
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
  } catch {
    progress = readProgress();
    progressMode = 'local';
    accountSubject = null;
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
