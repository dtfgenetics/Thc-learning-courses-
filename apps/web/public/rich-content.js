function text(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = value ?? '';
  if (className) node.className = className;
  return node;
}

function appendReferences(parent, references) {
  if (!Array.isArray(references) || references.length === 0) return;
  const note = text('p', `Evidence: ${references.join(', ')}`, 'rich-evidence');
  parent.append(note);
}

function appendImage(parent, { src, alt, caption, credit, assetId }, className = '') {
  const figure = document.createElement('figure');
  figure.className = `rich-figure${className ? ` ${className}` : ''}`;
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt ?? '';
  image.loading = 'lazy';
  image.decoding = 'async';
  figure.append(image);
  if (caption || credit || assetId) {
    const pieces = [];
    if (caption) pieces.push(caption);
    if (credit) pieces.push(`Source: ${credit}`);
    if (assetId) pieces.push(`Asset ${assetId}`);
    figure.append(text('figcaption', pieces.join(' • ')));
  }
  parent.append(figure);
}

function renderTextBlock(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-text';
  if (block.title) section.append(text('h3', block.title));
  section.append(text('p', block.body));
  appendReferences(section, block.references);
  parent.append(section);
}

function renderCallout(parent, block) {
  const section = document.createElement('aside');
  const tone = block.tone ?? 'note';
  section.className = `rich-block rich-callout rich-callout-${tone}`;
  if (block.title) section.append(text('h3', block.title));
  section.append(text('p', block.body));
  appendReferences(section, block.references);
  parent.append(section);
}

function renderImageBlock(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-image-block';
  appendImage(section, block);
  appendReferences(section, block.references);
  parent.append(section);
}

function renderSteps(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-steps';
  section.append(text('h3', block.title));
  const list = document.createElement('ol');
  list.className = 'rich-step-list';
  for (const item of block.items ?? []) {
    const li = document.createElement('li');
    if (item.title) li.append(text('strong', item.title));
    li.append(text('p', item.body));
    list.append(li);
  }
  section.append(list);
  appendReferences(section, block.references);
  parent.append(section);
}

function renderComparisonSide(side) {
  const card = document.createElement('article');
  card.className = 'rich-comparison-card';
  card.append(text('h4', side.label));
  if (side.image) {
    appendImage(card, { src: side.image, alt: side.alt ?? '', caption: null, credit: null, assetId: null }, 'rich-comparison-image');
  }
  card.append(text('p', side.body));
  return card;
}

function renderComparison(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-comparison';
  if (block.title) section.append(text('h3', block.title));
  const grid = document.createElement('div');
  grid.className = 'rich-comparison-grid';
  grid.append(renderComparisonSide(block.left), renderComparisonSide(block.right));
  section.append(grid);
  appendReferences(section, block.references);
  parent.append(section);
}

function renderTable(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-table-block';
  if (block.title) section.append(text('h3', block.title));
  const wrap = document.createElement('div');
  wrap.className = 'rich-table-wrap';
  const table = document.createElement('table');
  table.className = 'rich-table';
  if (block.caption) table.append(text('caption', block.caption));
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const column of block.columns ?? []) headerRow.append(text('th', column));
  thead.append(headerRow);
  table.append(thead);
  const tbody = document.createElement('tbody');
  for (const row of block.rows ?? []) {
    const tr = document.createElement('tr');
    for (let index = 0; index < (block.columns?.length ?? row.length); index += 1) tr.append(text('td', row[index] ?? ''));
    tbody.append(tr);
  }
  table.append(tbody);
  wrap.append(table);
  section.append(wrap);
  appendReferences(section, block.references);
  parent.append(section);
}

function renderScenario(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-scenario';
  section.append(text('p', 'Decision scenario', 'rich-kicker'));
  section.append(text('h3', block.title));
  if (block.setting) section.append(text('p', block.setting, 'rich-scenario-setting'));
  section.append(text('p', block.prompt, 'rich-scenario-prompt'));
  if (Array.isArray(block.options) && block.options.length) {
    const list = document.createElement('ol');
    list.className = 'rich-option-list';
    for (const option of block.options) list.append(text('li', option));
    section.append(list);
  }
  if (block.answer || block.feedback) {
    const details = document.createElement('details');
    details.className = 'rich-reveal';
    details.append(text('summary', 'Check reasoning'));
    if (block.answer) details.append(text('p', block.answer, 'rich-answer'));
    if (block.feedback) details.append(text('p', block.feedback));
    section.append(details);
  }
  appendReferences(section, block.references);
  parent.append(section);
}

function renderActivity(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-activity';
  section.append(text('p', 'Applied activity', 'rich-kicker'));
  section.append(text('h3', block.title));
  section.append(text('p', block.instructions));
  if (Array.isArray(block.prompts) && block.prompts.length) {
    const list = document.createElement('ol');
    list.className = 'rich-prompt-list';
    for (const prompt of block.prompts) list.append(text('li', prompt));
    section.append(list);
  }
  if (block.artifact) section.append(text('p', `Learner artifact: ${block.artifact}`, 'rich-artifact-note'));
  appendReferences(section, block.references);
  parent.append(section);
}

function renderDocument(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-document';
  section.append(text('p', 'Document example', 'rich-kicker'));
  section.append(text('h3', block.title));
  if (block.description) section.append(text('p', block.description));
  const dl = document.createElement('dl');
  dl.className = 'rich-document-grid';
  for (const field of block.fields ?? []) {
    const cell = document.createElement('div');
    cell.append(text('dt', field.label));
    cell.append(text('dd', field.value));
    dl.append(cell);
  }
  section.append(dl);
  if (block.note) section.append(text('p', block.note, 'rich-document-note'));
  appendReferences(section, block.references);
  parent.append(section);
}

function renderResource(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-resource';
  section.append(text('h3', block.title));
  if (block.body) section.append(text('p', block.body));
  if (block.href) {
    const link = document.createElement('a');
    link.href = block.href;
    link.textContent = block.label ?? 'Open resource';
    link.className = 'rich-resource-link';
    if (/^https?:\/\//i.test(block.href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    section.append(link);
  }
  appendReferences(section, block.references);
  parent.append(section);
}

function renderDivider(parent) {
  const divider = document.createElement('hr');
  divider.className = 'rich-divider';
  parent.append(divider);
}

export function renderRichBlocks(parent, blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return false;
  for (const block of blocks) {
    switch (block.type) {
      case 'text': renderTextBlock(parent, block); break;
      case 'callout': renderCallout(parent, block); break;
      case 'image': renderImageBlock(parent, block); break;
      case 'steps': renderSteps(parent, block); break;
      case 'comparison': renderComparison(parent, block); break;
      case 'table': renderTable(parent, block); break;
      case 'scenario': renderScenario(parent, block); break;
      case 'activity': renderActivity(parent, block); break;
      case 'document': renderDocument(parent, block); break;
      case 'resource': renderResource(parent, block); break;
      case 'divider': renderDivider(parent); break;
      default: {
        const warning = text('p', `Unsupported lesson block: ${block.type ?? 'unknown'}`, 'rich-block-error');
        parent.append(warning);
      }
    }
  }
  return true;
}
