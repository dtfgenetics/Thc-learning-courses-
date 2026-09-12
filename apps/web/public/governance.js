function el(tag, text = '', className = '') { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
function metric(label, value) { const card = el('div', '', 'governance-metric'); card.append(el('strong', String(value))); card.append(el('span', label)); return card; }

export function renderGovernanceSummary(root, summary) {
  root.replaceChildren();
  const header = el('div', '', 'governance-header');
  header.append(el('div', 'Staging governance', 'eyebrow'));
  header.append(el('h2', summary.readiness.productionReady ? 'Production-ready' : 'Production gates still open'));
  root.append(header);

  const grid = el('div', '', 'governance-grid');
  grid.append(metric('Lessons', summary.inventory.lessons));
  grid.append(metric('Assessments', summary.inventory.assessments));
  grid.append(metric('Questions', summary.inventory.questions));
  grid.append(metric('Approved reviews', summary.reviews.approvedRecords));
  grid.append(metric('Pilot records', summary.pilot.records));
  grid.append(metric('Complete pilot evidence', summary.pilot.itemsWithCompleteEvidence));
  grid.append(metric('Assessment-approved items', summary.pilot.itemsWithApprovedAssessmentReview));
  grid.append(metric('Activation evidence complete', summary.pilot.itemsWithActivationEvidenceComplete));
  grid.append(metric('Active credential items', summary.pilot.activeItems));
  grid.append(metric('Open production gates', summary.readiness.productionBlockerCount));
  root.append(grid);

  const pilotNote = el('p', `${summary.pilot.itemsWithActivationEvidenceComplete}/${summary.pilot.credentialItems} credential-purpose items currently have both complete pilot evidence and approved assessment review.`, 'status');
  root.append(pilotNote);

  const details = document.createElement('details');
  details.className = 'governance-blockers';
  const label = document.createElement('summary');
  label.textContent = 'Show production blockers';
  details.append(label);
  const list = document.createElement('ul');
  for (const blocker of summary.readiness.productionBlockers) list.append(el('li', blocker));
  details.append(list);
  root.append(details);
}

export async function loadGovernanceSummary(root) {
  try {
    const response = await fetch('/api/staging/governance', { headers: { accept: 'application/json' } });
    if (response.status === 404) { root.hidden = true; return; }
    if (!response.ok) throw new Error(`Governance request failed (${response.status})`);
    renderGovernanceSummary(root, await response.json());
  } catch (error) { root.replaceChildren(el('p', error.message, 'error')); }
}

const FIELD_REFERENCES = [
  {
    id: 'FR-LH-TECH1-001-HAZARD', moduleId: 'MOD-LH-TECH1-001-SAFETY', title: 'Hazard Response, PPE & HazCom', shortTitle: 'Hazard response',
    objectives: ['LO-LH-TECH1-001-01', 'LO-LH-TECH1-001-02'], activities: [1, 8, 9],
    summary: 'Use before or during assigned work to decide whether a condition can be controlled routinely, requires stopping or escalation, or needs additional authorization.',
    keywords: ['hazard','ppe','hazcom','sds','label','alarm','restricted entry','electrical','stop work'],
    sequence: ['Identify the task, area, material or asset, and current work status.', 'Check hazards, required controls, PPE, labels/SDS, alarms, and access restrictions.', 'Ask whether the condition is inside your assigned authority.', 'Use only an approved routine control when it is clearly permitted.', 'Stop, isolate where authorized, and escalate when the condition remains unsafe, restricted, unknown, or outside your authority.', 'Reassess when conditions change; a safe start does not guarantee a safe finish.'],
    triggers: ['Damaged electrical equipment near moisture', 'Unknown life-safety alarm or active restricted-entry control', 'Required PPE or chemical identity unavailable', 'Missing guard, protected access, or servicing beyond assigned operator care'],
    weak: '“I can probably finish quickly if I am careful.”', strong: '“The condition changes the risk and is outside my routine control. I am stopping the affected task, preventing exposure where authorized, and escalating with the exact condition and task status.”',
    record: 'What was observed → routine control used → unresolved condition → who was notified → task status.'
  },
  {
    id: 'FR-LH-TECH1-001-BIOSEC', moduleId: 'MOD-LH-TECH1-001-BIOSEC', title: 'Biosecurity, Sanitation & Status Controls', shortTitle: 'Biosecurity & status controls',
    objectives: ['LO-LH-TECH1-001-03', 'LO-LH-TECH1-001-04'], activities: [2, 8, 9],
    summary: 'Map contamination pathways, verify sanitation sequence, and keep quarantine, holds, restricted-entry controls, and equipment status from being confused.',
    keywords: ['biosecurity','sanitation','disinfection','quarantine','hold','rei','movement','contamination','status'],
    sequence: ['Verify the status of the room, material, tool, cart, or equipment before movement.', 'Reconstruct source → route → receiving zone for possible contamination.', 'Clean before disinfection when the approved procedure requires removal of debris or organic matter.', 'Use the current product label/SOP for concentration, contact time, compatibility, and PPE.', 'Treat quarantine, quality hold, pesticide REI, sanitation state, and equipment out-of-service as separate controls.', 'Clear only the specific status for which the authorized release evidence exists.'],
    triggers: ['Dirty tool or cart crosses a controlled boundary', 'A product substitution is proposed without approved instruction', 'One status expires while another hold remains active', 'A learner assumes “no visible symptoms” means no pathway risk'],
    weak: '“The REI ended, so everything in the area is released.”', strong: '“The REI is one control. I will verify whether the plant-health hold, quarantine, sanitation, or equipment status is still active before entry, movement, use, or release.”',
    record: 'Source → route → receiving zone → control applied → status still active → authorized release/escalation.'
  },
  {
    id: 'FR-LH-TECH1-001-SOP', moduleId: 'MOD-LH-TECH1-001-WORKFLOW', title: 'Controlled Work, SOPs & Authority', shortTitle: 'Controlled work & authority',
    objectives: ['LO-LH-TECH1-001-05'], activities: [3, 8],
    summary: 'Reconcile the current work order and controlled instruction with physical reality, then stop or escalate when instructions conflict or authority is unclear.',
    keywords: ['sop','work order','revision','controlled document','authority','deviation','acceptance criteria','escalation'],
    sequence: ['Confirm work-order identity, room/material/asset identity, revision and effective status.', 'Check prerequisites, PPE/controls, sequence, measurements, acceptance criteria, records, and stop conditions.', 'Compare the instruction with physical reality before starting.', 'If controlled documents or identifiers conflict, preserve the conflict instead of blending instructions.', 'Use the authorized clarification/deviation path; do not create your own permanent workaround.', 'Close out with physical result, required record, deviations/open conditions, identity/location, and handoff needs.'],
    triggers: ['Two revisions appear current', 'Work-order identity does not match the physical tag or room', 'The normal supervisor is unavailable and approval authority is unclear', 'A “simple” fix crosses into protected servicing or another role'],
    weak: '“I used the newer-looking copy and adjusted the step to fit the room.”', strong: '“The controlled instruction and physical situation do not reconcile. I am stopping at the conflict and using the authorized clarification or deviation process without changing the record to make it fit.”',
    record: 'Instruction/revision → physical identifier check → conflict or exception → authorized resolution path → final status.'
  },
  {
    id: 'FR-LH-TECH1-001-TRACE', moduleId: 'MOD-LH-TECH1-001-TRACEABILITY', title: 'Traceability, Movement & Reconciliation', shortTitle: 'Traceability & reconciliation',
    objectives: ['LO-LH-TECH1-001-06', 'LO-LH-TECH1-001-07', 'LO-LH-TECH1-001-08'], activities: [4, 8, 10],
    summary: 'Preserve identity and genealogy through movements, splits, merges, discrepancies, downtime, and disposition without forcing physical and recorded states to agree.',
    keywords: ['traceability','genealogy','movement','inventory','reconciliation','waste','disposition','split','merge','downtime'],
    sequence: ['Identify the traceable object and source state.', 'Record the event: what, where, when, why/process, who/system, and quantity when relevant.', 'Link new output identifiers to their source inputs through splits, merges, samples, harvests, or waste events.', 'Compare physical and recorded state before affected movement or disposition.', 'Preserve discrepancies and distinguish confirmed facts from hypotheses.', 'Use the controlled correction/downtime process and escalate unresolved differences.'],
    triggers: ['Physical tag and record disagree', 'A split or merge creates new identifiers without a source link', 'Digital tracking is unavailable', 'Waste or disposition would erase evidence needed to resolve a discrepancy'],
    weak: '“The plant looks right, so I corrected the tag to match the system.”', strong: '“Physical identity and the record disagree. I will stop the affected movement, preserve both states, perform only permitted checks, and escalate without forcing reconciliation.”',
    record: 'Object ID → source → event → output/destination → time → quantity → recorder → discrepancy/correction/escalation.'
  },
  {
    id: 'FR-LH-TECH1-001-EQUIP', moduleId: 'MOD-LH-TECH1-001-EQUIPMENT', title: 'Equipment Readiness & Fault Escalation', shortTitle: 'Equipment readiness & faults',
    objectives: ['LO-LH-TECH1-001-09', 'LO-LH-TECH1-001-10'], activities: [5, 8, 11],
    summary: 'Classify readiness findings, stay inside operator-care boundaries, recognize stored-energy or servicing crossover, and create a maintenance-ready fault timeline.',
    keywords: ['equipment','readiness','fault','alarm','maintenance','servicing','stored energy','guard','operator care'],
    sequence: ['Verify asset identity and the assigned pre-use/readiness criteria.', 'Classify the finding: acceptable, routine operator correction, out of service/maintenance escalation, or emergency hazard.', 'Perform only checks explicitly permitted by the operator procedure.', 'Stop at guard removal, protected electrical access, hazardous motion, pressure, stored energy, or disassembly beyond your role.', 'For recurring alarms, build a time-ordered record of symptom → permitted check → result → impact → status → notification.', 'Hand off observations separately from any unconfirmed diagnosis.'],
    triggers: ['Guard is missing or protected access is required', 'Alarm persists after the permitted external check', 'Stored energy or hazardous motion may be exposed', 'The same fault recurs across a shift without a clear maintenance handoff'],
    weak: '“The pump probably failed, so I opened the cover to check.”', strong: '“The low-flow alarm remained after the permitted external check. Opening the protected cover is servicing outside my authority, so the asset remains in the controlled status and I am escalating the fault timeline.”',
    record: 'Asset/location → time → exact alarm/observation → readings → permitted checks → results → impact → safe action/status → ticket/contact.'
  },
  {
    id: 'FR-LH-TECH1-001-RECORDS', moduleId: 'MOD-LH-TECH1-001-RECORDS', title: 'Data Integrity & Shift Handoff', shortTitle: 'Records & shift handoff',
    objectives: ['LO-LH-TECH1-001-11', 'LO-LH-TECH1-001-12'], activities: [6, 7, 8, 12],
    summary: 'Create reconstructable records, preserve correction history, distinguish observation time from entry time, and complete a closed-loop handoff of unresolved conditions.',
    keywords: ['data integrity','record','correction','late entry','handoff','read back','alcoa','shift','documentation'],
    sequence: ['Record what happened, to what/where, when, by whom, and with what result.', 'Keep observation time separate from later entry time when a permitted late-entry process is used.', 'Use the approved correction method and preserve original history and attribution.', 'Prioritize unresolved safety, identity, status, and equipment conditions in handoff.', 'Use two-way exchange: incoming questions, source cross-check, and read-back of critical open conditions.', 'Correct an incomplete read-back before handoff is considered closed.'],
    triggers: ['A required observation was recorded later than it occurred', 'An error correction would overwrite or hide the original entry', 'Incoming shift omits an active hold, restriction, or equipment status during read-back', 'A prior-shift task is incomplete but paperwork suggests completion'],
    weak: '“Fixed the time and told night shift there was an issue.”', strong: '“The observation occurred at 13:55 and was entered at 14:40 under the permitted late-entry process. The original history remains visible. During handoff I will require read-back of the active hold, equipment ticket, and unfinished work before closing the transfer.”',
    record: 'Observation/result → object/location → observation time → entry time if different → attribution/correction history → unresolved condition → next action/owner → incoming cross-check.'
  }
];

const fieldReferenceById = new Map(FIELD_REFERENCES.map((reference) => [reference.id, reference]));
const lessonModuleByTitle = new Map();
const moduleTitleById = new Map();
let catalogIndexPromise;

function loadCatalogIndex() {
  if (!catalogIndexPromise) {
    catalogIndexPromise = fetch('/api/catalog', { headers: { accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('catalog unavailable')))
      .then((catalog) => {
        for (const course of catalog.courses ?? []) {
          for (const module of course.modules ?? []) {
            moduleTitleById.set(module.id, module.title);
            for (const lesson of module.lessons ?? []) lessonModuleByTitle.set(lesson.title, module.id);
          }
        }
      })
      .catch(() => {});
  }
  return catalogIndexPromise;
}

function setFieldReferenceTabActive() {
  for (const tab of document.querySelectorAll('.portal-tab')) {
    const active = tab.id === 'tab-field-references';
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function referenceButton(reference, label = `Open ${reference.shortTitle}`) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'field-reference-button';
  button.textContent = label;
  button.addEventListener('click', () => renderFieldReferenceDetail(reference.id));
  return button;
}

function compactTags(reference) {
  const tags = document.createElement('div');
  tags.className = 'field-reference-tags';
  for (const objective of reference.objectives) tags.append(el('span', objective, 'field-reference-tag'));
  for (const activity of reference.activities) tags.append(el('span', `Workbook ${activity}`, 'field-reference-tag'));
  return tags;
}

function renderFieldReferenceLibrary() {
  setFieldReferenceTabActive();
  const target = document.querySelector('#lesson-view');
  if (!target) return;
  const panel = el('div', '', 'portal-panel field-reference-library');
  panel.append(el('p', 'Course 1 quick-reference library', 'eyebrow'));
  panel.append(el('h2', 'Field References'));
  panel.append(el('p', 'Search the Course 1 decision aids used during lessons, workbook practice, and remediation. These aids summarize course rules; current workplace procedures, labels, authorization, and jurisdiction-specific requirements still control real work.', 'lede'));
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'search field-reference-search';
  search.placeholder = 'Search hazards, quarantine, traceability, equipment, handoff…';
  search.setAttribute('aria-label', 'Search field references');
  const status = el('p', '', 'status');
  const grid = el('div', '', 'field-reference-grid');
  panel.append(search, status, grid);

  function draw() {
    const query = search.value.trim().toLowerCase();
    grid.replaceChildren();
    const matches = FIELD_REFERENCES.filter((reference) => !query || [reference.title, reference.summary, ...reference.keywords, ...reference.objectives].join(' ').toLowerCase().includes(query));
    status.textContent = `${matches.length} field reference${matches.length === 1 ? '' : 's'} shown`;
    for (const reference of matches) {
      const card = el('article', '', 'field-reference-card');
      card.append(el('p', moduleTitleById.get(reference.moduleId) ?? 'Course 1', 'field-reference-module'));
      card.append(el('h3', reference.title));
      card.append(el('p', reference.summary, 'field-reference-summary'));
      card.append(compactTags(reference));
      card.append(referenceButton(reference, 'Open reference'));
      grid.append(card);
    }
    if (!matches.length) grid.append(el('p', 'No field references match that search.', 'status'));
  }
  search.addEventListener('input', draw);
  draw();
  target.replaceChildren(panel);
  target.focus();
}

function renderStringList(parent, title, items) {
  const section = el('section', '', 'field-reference-section');
  section.append(el('h3', title));
  const list = document.createElement('ol');
  for (const item of items) list.append(el('li', item));
  section.append(list);
  parent.append(section);
}

function renderFieldReferenceDetail(id) {
  const reference = fieldReferenceById.get(id);
  const target = document.querySelector('#lesson-view');
  if (!reference || !target) return;
  setFieldReferenceTabActive();
  const article = el('article', '', 'portal-panel field-reference-detail');
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'field-reference-back'; back.textContent = '← All field references'; back.addEventListener('click', renderFieldReferenceLibrary);
  article.append(back, el('p', moduleTitleById.get(reference.moduleId) ?? 'Course 1', 'eyebrow'), el('h2', reference.title), el('p', reference.summary, 'lede'), compactTags(reference));
  const actions = el('div', '', 'field-reference-actions');
  const print = document.createElement('button');
  print.type = 'button'; print.className = 'field-reference-print'; print.textContent = 'Print / save reference'; print.addEventListener('click', () => window.print());
  actions.append(print);
  article.append(actions);
  renderStringList(article, 'Pocket decision sequence', reference.sequence);
  const triggers = el('section', '', 'field-reference-section field-reference-stop');
  triggers.append(el('h3', 'Stop / escalate triggers'));
  const triggerList = document.createElement('ul');
  for (const trigger of reference.triggers) triggerList.append(el('li', trigger));
  triggers.append(triggerList);
  article.append(triggers);
  const compare = el('section', '', 'field-reference-section');
  compare.append(el('h3', 'Weak vs. stronger response'));
  const comparison = el('div', '', 'field-reference-comparison');
  const weak = el('div', '', 'field-reference-example weak'); weak.append(el('strong', 'Weak'), el('p', reference.weak));
  const strong = el('div', '', 'field-reference-example strong'); strong.append(el('strong', 'Stronger'), el('p', reference.strong));
  comparison.append(weak, strong); compare.append(comparison); article.append(compare);
  const record = el('section', '', 'field-reference-section'); record.append(el('h3', 'Record / handoff formula'), el('p', reference.record, 'field-reference-formula')); article.append(record);
  const boundary = el('aside', '', 'field-reference-boundary');
  boundary.append(el('strong', 'Workplace boundary'), el('p', 'Use this as a Course 1 learning and field-reference aid. Current employer procedures, product labels, equipment instructions, emergency plans, authorization, and applicable law control actual workplace actions.'));
  article.append(boundary);
  target.replaceChildren(article);
  target.focus();
}

async function injectCatalogReferenceLinks() {
  await loadCatalogIndex();
  for (const moduleSection of document.querySelectorAll('#catalog .module')) {
    if (moduleSection.querySelector('.field-reference-quick')) continue;
    const title = moduleSection.querySelector('.module-title')?.textContent?.trim();
    const moduleId = [...moduleTitleById.entries()].find(([, moduleTitle]) => moduleTitle === title)?.[0];
    const reference = FIELD_REFERENCES.find((item) => item.moduleId === moduleId);
    if (!reference) continue;
    const wrap = el('div', '', 'field-reference-quick');
    wrap.append(referenceButton(reference, `Field reference: ${reference.shortTitle}`));
    moduleSection.append(wrap);
  }
}

async function injectLessonReferenceLink() {
  await loadCatalogIndex();
  const article = document.querySelector('#lesson-view .lesson-article');
  if (!article || article.querySelector('.lesson-field-reference')) return;
  const lessonTitle = article.querySelector('h2')?.textContent?.trim();
  const moduleId = lessonModuleByTitle.get(lessonTitle);
  const reference = FIELD_REFERENCES.find((item) => item.moduleId === moduleId);
  if (!reference) return;
  const callout = el('aside', '', 'lesson-field-reference');
  callout.append(el('strong', 'Field reference'), el('span', reference.summary), referenceButton(reference, `Open ${reference.shortTitle}`));
  const meta = article.querySelector('.lesson-meta');
  if (meta) meta.insertAdjacentElement('afterend', callout); else article.prepend(callout);
}

function injectPracticeRemediation(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'radio' || !input.closest('.practice-item')) return;
  queueMicrotask(async () => {
    await loadCatalogIndex();
    const fieldset = input.closest('.practice-item');
    const feedback = fieldset?.querySelector('.practice-feedback[data-state="incorrect"]');
    if (!feedback || fieldset.querySelector('.field-reference-remediation')) return;
    const lessonTitle = document.querySelector('#lesson-view .lesson-article h2')?.textContent?.trim();
    const moduleId = lessonModuleByTitle.get(lessonTitle);
    const reference = FIELD_REFERENCES.find((item) => item.moduleId === moduleId);
    if (!reference) return;
    const wrap = el('div', '', 'field-reference-remediation');
    wrap.append(el('span', 'Targeted review:'), referenceButton(reference, reference.shortTitle));
    fieldset.append(wrap);
  });
}

const governanceRoot = document.querySelector('#governance-dashboard');
if (governanceRoot) loadGovernanceSummary(governanceRoot);

loadCatalogIndex().then(() => { injectCatalogReferenceLinks(); injectLessonReferenceLink(); });
document.querySelector('#tab-field-references')?.addEventListener('click', renderFieldReferenceLibrary);
document.addEventListener('change', injectPracticeRemediation);

const catalogRoot = document.querySelector('#catalog');
if (catalogRoot) new MutationObserver(injectCatalogReferenceLinks).observe(catalogRoot, { childList: true, subtree: true });
const lessonRoot = document.querySelector('#lesson-view');
if (lessonRoot) new MutationObserver(injectLessonReferenceLink).observe(lessonRoot, { childList: true, subtree: true });
