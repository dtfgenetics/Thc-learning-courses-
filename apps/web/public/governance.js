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

const root = document.querySelector('#governance-dashboard');
if (root) loadGovernanceSummary(root);
