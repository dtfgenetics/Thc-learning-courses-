export const COURSE1_PRIMARY_VISUAL_OVERRIDES = Object.freeze({
  'Equipment Pre-Use and Readiness Checks': {
    replaceAssetIds: ['VIS-LH-TECH1-001-010'],
    block: {
      type: 'image',
      assetId: 'VIS-LH-TECH1-001-033',
      title: 'Equipment pre-use readiness',
      src: '/assets/course1/equipment-preuse-v3.png',
      alt: 'Five-step equipment pre-use readiness model: confirm exact asset and assignment, check controlled status, inspect only assigned external readiness points, review indicators permitted by the operator procedure, and classify the result as ready, approved routine correction, hold or escalation, or emergency response.',
      caption: 'A pre-use check verifies readiness; a failed criterion does not authorize repair. Preserve controlled status and follow the site-defined out-of-service or escalation process.',
      references: ['REF-NIOSH-CANNABIS-HAZARDS-2024', 'REF-OSHA-1910-147-LOTO']
    }
  },
  'Routine Operator Care versus Skilled Maintenance': {
    replaceAssetIds: ['VIS-LH-TECH1-001-010'],
    block: {
      type: 'image',
      assetId: 'VIS-LH-TECH1-001-034',
      title: 'Operator care versus maintenance boundary',
      src: '/assets/course1/operator-vs-maintenance-v3.png',
      alt: 'Two-column decision visual separating routine operator care explicitly assigned, trained and authorized by current procedure from maintenance or servicing involving guarded access, electrical components, powered disassembly, pressure, stored energy, diagnosis, calibration or other unassigned work.',
      caption: 'The current equipment instructions and employer procedure define the boundary. If the action is not assigned to the operator, stop and clarify rather than expanding routine care into servicing.',
      references: ['REF-OSHA-1910-147-LOTO', 'REF-NIOSH-CANNABIS-HAZARDS-2024', 'REF-NIOSH-LOTO-2011-156']
    }
  },
  'Alarms, Fault Context and Maintenance Escalation': {
    replaceAssetIds: ['VIS-LH-TECH1-001-011'],
    block: {
      type: 'image',
      assetId: 'VIS-LH-TECH1-001-035',
      title: 'Fault context and escalation',
      src: '/assets/course1/fault-report-v3.png',
      alt: 'Maintenance-ready fault context model that records exact asset and location, first occurrence, exact alarm or symptom, permitted operator checks and results, recurrence, process impact, controlled status and notification while keeping verified facts separate from hypotheses.',
      caption: 'Make the condition reproducible without manufacturing certainty. Reporting timing and channel follow the applicable emergency, fault-reporting or escalation procedure.',
      references: ['REF-MHRA-GXP-DATA-INTEGRITY', 'REF-OSHA-1910-147-LOTO', 'REF-NIOSH-CANNABIS-HAZARDS-2024']
    }
  },
  'Contemporaneous Records and Data Integrity': {
    replaceAssetIds: ['VIS-LH-TECH1-001-014'],
    block: {
      type: 'image',
      assetId: 'VIS-LH-TECH1-001-036',
      title: 'Controlled record correction',
      src: '/assets/course1/record-correction-v3.png',
      alt: 'Record-correction visual showing that paper and digital changes follow the governing record system and facility procedure, preserve the original information or audit trail, retain attribution and timing, and never silently overwrite, erase, backdate or replace missing data with an invented value.',
      caption: 'Correction methods are system-controlled. A paper strike-through style is only an example when the governing procedure permits it; the universal principle is preservation of original history or audit trail.',
      references: ['REF-MHRA-GXP-DATA-INTEGRITY']
    }
  },
  'Professional Shift Handoff': {
    replaceAssetIds: ['VIS-LH-TECH1-001-012'],
    block: {
      type: 'image',
      assetId: 'VIS-LH-TECH1-001-037',
      title: 'Professional shift handoff',
      src: '/assets/course1/shift-handoff-v3.png',
      alt: 'Four-stage shift handoff model showing outgoing preparation, two-way information exchange, incoming cross-check, and explicit ownership of unresolved work, with safety and access controls, holds and identity problems, equipment status, incomplete work and time-sensitive next actions prioritized.',
      caption: 'Handoff instructions and priorities must be current, controlled and within the receiving worker’s authority. Transfer exact status, ownership and timing instead of improvised instructions.',
      references: ['REF-HSE-SHIFT-HANDOVER', 'REF-MHRA-GXP-DATA-INTEGRITY']
    }
  },
  'Integrated Technician Workflow Case': {
    replaceAssetIds: [],
    insertAt: 1,
    block: {
      type: 'image',
      assetId: 'VIS-LH-TECH1-001-038',
      title: 'Integrated Technician I workflow',
      src: '/assets/course1/integrated-workflow-v3.png',
      alt: 'Integrated workflow connecting review of assigned work and current controlled instructions, readiness and dependency checks, authorized routine execution, monitoring and response to change, truthful documentation, and communication or follow-up while keeping unresolved or unauthorized work visibly open.',
      caption: 'PLAN means reviewing assigned work, current controlled instructions, hazards, prerequisites and priorities—not independent production-planning authority. Blocked or unauthorized work remains open and is routed to the appropriate role.',
      references: ['REF-NIOSH-CANNABIS-HAZARDS-2024', 'REF-MHRA-GXP-DATA-INTEGRITY', 'REF-OSHA-1910-147-LOTO', 'REF-HSE-SHIFT-HANDOVER']
    }
  }
});

function lessonTitleFromParent(parent) {
  if (!(parent instanceof Element)) return '';
  if (!parent.classList.contains('lesson-article')) return '';
  return parent.querySelector(':scope > h2')?.textContent?.trim() ?? '';
}

export function applyCourse1PrimaryVisualOverride(parent, blocks) {
  if (!Array.isArray(blocks)) return blocks;
  const override = COURSE1_PRIMARY_VISUAL_OVERRIDES[lessonTitleFromParent(parent)];
  if (!override) return blocks;

  const next = blocks.map((block) => ({ ...block }));
  const replacementIndex = next.findIndex((block) => block.type === 'image' && override.replaceAssetIds.includes(block.assetId));
  if (replacementIndex >= 0) {
    next[replacementIndex] = { ...override.block };
    return next;
  }

  if (next.some((block) => block.type === 'image' && block.assetId === override.block.assetId)) return next;
  const insertAt = Math.max(0, Math.min(Number.isInteger(override.insertAt) ? override.insertAt : next.length, next.length));
  next.splice(insertAt, 0, { ...override.block });
  return next;
}

function text(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = value ?? '';
  if (className) node.className = className;
  return node;
}

function appendReferences(parent, references) {
  if (!Array.isArray(references) || references.length === 0) return;
  const details = document.createElement('details');
  details.className = 'rich-evidence';
  details.append(text('summary', 'Sources & evidence'));
  const list = document.createElement('ul');
  list.className = 'rich-evidence-list';
  for (const reference of references) list.append(text('li', reference));
  details.append(list);
  parent.append(details);
}

function appendImage(parent, { src, alt, caption, credit, assetId }, className = '') {
  const figure = document.createElement('figure');
  figure.className = `rich-figure${className ? ` ${className}` : ''}`;
  if (assetId) figure.dataset.assetId = assetId;

  const image = document.createElement('img');
  image.src = src;
  image.alt = alt ?? '';
  image.loading = 'lazy';
  image.decoding = 'async';
  figure.append(image);

  const footer = document.createElement('figcaption');
  const pieces = [];
  if (caption) pieces.push(caption);
  if (credit) pieces.push(`Source: ${credit}`);
  if (pieces.length) footer.append(text('span', pieces.join(' • '), 'rich-figure-caption-text'));

  if (src) {
    const fullSize = document.createElement('a');
    fullSize.href = src;
    fullSize.textContent = 'Open full-size visual';
    fullSize.className = 'rich-figure-fullsize';
    fullSize.target = '_blank';
    fullSize.rel = 'noopener noreferrer';
    footer.append(fullSize);
  }

  if (footer.childNodes.length) figure.append(footer);
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
  if (block.title) section.append(text('h3', block.title));
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
  for (const item of block.items ?? block.steps ?? []) {
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

function renderExtension(parent, block) {
  const section = document.createElement('section');
  section.className = 'lesson-section rich-block rich-extension';
  section.dataset.extensionNamespace = block.namespace;
  if (block.renderer) section.dataset.extensionRenderer = block.renderer;
  section.append(text('p', 'Extended learning block', 'rich-kicker'));
  if (block.title) section.append(text('h3', block.title));
  section.append(text('p', block.body));
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
  const renderBlocks = applyCourse1PrimaryVisualOverride(parent, blocks);
  for (const block of renderBlocks) {
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
      case 'extension': renderExtension(parent, block); break;
      case 'divider': renderDivider(parent); break;
      default: {
        const warning = text('p', `Unsupported lesson block: ${block.type ?? 'unknown'}`, 'rich-block-error');
        parent.append(warning);
      }
    }
  }
  return true;
}
