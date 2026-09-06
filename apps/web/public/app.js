const catalogRoot = document.querySelector('#catalog');
const catalogStatus = document.querySelector('#catalog-status');
const searchInput = document.querySelector('#course-search');
const lessonView = document.querySelector('#lesson-view');
const modeBadge = document.querySelector('#mode-badge');

let catalog = null;

function text(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = value ?? '';
  if (className) node.className = className;
  return node;
}

function matchesQuery(course, query) {
  if (!query) return true;
  const haystack = [
    course.title,
    course.description,
    ...course.modules.flatMap((module) => [module.title, ...module.lessons.map((lesson) => lesson.title)])
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function renderCatalog() {
  catalogRoot.replaceChildren();
  const query = searchInput.value.trim();
  const courses = (catalog?.courses ?? []).filter((course) => matchesQuery(course, query));
  catalogStatus.textContent = `${courses.length} course${courses.length === 1 ? '' : 's'} shown`;

  for (const course of courses) {
    const details = document.createElement('details');
    details.className = 'course';
    if (query) details.open = true;

    const summary = document.createElement('summary');
    summary.append(text('span', course.title));
    const meta = `${course.status}${course.credentialBearing ? ' • credential pathway' : ''}`;
    summary.append(text('span', meta, 'course-meta'));
    details.append(summary);

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
        button.textContent = `${lesson.title}${lesson.estimatedMinutes ? ` · ${lesson.estimatedMinutes} min` : ''}`;
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

function renderLesson(lesson) {
  const article = document.createElement('article');
  article.className = 'lesson-article';
  article.append(text('p', 'THC Academy lesson', 'eyebrow'));
  article.append(text('h2', lesson.title));

  const meta = document.createElement('div');
  meta.className = 'lesson-meta';
  if (lesson.estimatedMinutes) meta.append(text('span', `${lesson.estimatedMinutes} min`, 'pill'));
  meta.append(text('span', `Version ${lesson.version}`, 'pill'));
  if (lesson.status !== 'published') meta.append(text('span', 'Staging preview — review pending', 'pill preview-pill'));
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
    const box = text('p', content.practicalApplication, 'callout');
    section.append(box);
    article.append(section);
  }

  if (content.summary) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', 'Summary'));
    section.append(text('p', content.summary));
    article.append(section);
  }

  if (lesson.references?.length) {
    const section = document.createElement('section');
    section.className = 'lesson-section';
    section.append(text('h3', 'Evidence references'));
    section.append(text('p', lesson.references.join(', ')));
    article.append(section);
  }

  lessonView.replaceChildren(article);
  lessonView.focus();
}

async function openLesson(id) {
  lessonView.replaceChildren(text('p', 'Loading lesson…', 'status'));
  try {
    const response = await fetch(`/api/lessons/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Lesson request failed (${response.status})`);
    renderLesson(await response.json());
  } catch (error) {
    const card = text('div', '', 'welcome-card error');
    card.append(text('h2', 'Lesson unavailable'));
    card.append(text('p', error.message));
    lessonView.replaceChildren(card);
  }
}

async function start() {
  try {
    const response = await fetch('/api/catalog', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    catalog = await response.json();
    modeBadge.textContent = catalog.mode === 'staging-preview' ? 'Staging preview' : 'Published content';
    renderCatalog();
  } catch (error) {
    modeBadge.textContent = 'Unavailable';
    catalogStatus.textContent = error.message;
    catalogStatus.classList.add('error');
  }
}

searchInput.addEventListener('input', renderCatalog);
start();
