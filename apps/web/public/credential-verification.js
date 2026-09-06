function text(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = value ?? '';
  if (className) node.className = className;
  return node;
}

function verificationIdFromCard(card) {
  for (const row of card.querySelectorAll('dl > div')) {
    if (row.querySelector('dt')?.textContent?.trim() === 'Verification ID') return row.querySelector('dd')?.textContent?.trim() ?? null;
  }
  return null;
}

function lifecycleLabel(lifecycle) {
  if (!lifecycle) return 'Lifecycle policy not published';
  if (lifecycle.validityType === 'indefinite') return lifecycle.renewalRequired ? 'Indefinite validity • renewal policy applies' : 'Indefinite validity • no renewal required';
  const parts = ['Fixed-term validity'];
  if (lifecycle.expiresAt) parts.push(`expires ${new Date(lifecycle.expiresAt).toLocaleDateString()}`);
  if (lifecycle.renewalRequired) {
    parts.push(lifecycle.renewalWindowOpen ? 'renewal window open' : 'renewal required');
    if (lifecycle.renewalMethod && lifecycle.renewalMethod !== 'none') parts.push(lifecycle.renewalMethod.replaceAll('-', ' '));
  }
  return parts.join(' • ');
}

async function enhanceCredentialCard(card) {
  if (card.dataset.lifecycleEnhanced === 'true') return;
  const verificationId = verificationIdFromCard(card);
  if (!verificationId) return;
  card.dataset.lifecycleEnhanced = 'true';
  try {
    const response = await fetch(`/api/v1/credentials/${encodeURIComponent(verificationId)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Verification detail request failed (${response.status}).`);
    const record = await response.json();

    const version = document.createElement('section');
    version.className = 'portal-verification-section';
    version.append(text('h4', 'Version & validity'));
    const versionList = document.createElement('dl');
    const versionRows = [
      ['Issued credential version', record.credential?.version],
      ['Current definition version', record.credential?.currentDefinitionVersion],
      ['Validity policy', lifecycleLabel(record.lifecycle)],
      ['Supersession policy', record.lifecycle?.supersessionPolicy?.replaceAll('-', ' ')]
    ];
    for (const [label, value] of versionRows) {
      if (!value) continue;
      const row = document.createElement('div');
      row.append(text('dt', label), text('dd', value));
      versionList.append(row);
    }
    version.append(versionList);
    card.append(version);

    if ((record.statusHistory ?? []).length) {
      const history = document.createElement('section');
      history.className = 'portal-verification-section';
      history.append(text('h4', 'Credential status history'));
      const list = document.createElement('ol');
      list.className = 'portal-status-history';
      for (const event of record.statusHistory) {
        const when = event.createdAt ? new Date(event.createdAt).toLocaleString() : 'time not recorded';
        list.append(text('li', `${String(event.status ?? 'unknown').replaceAll('-', ' ')} — ${when}`));
      }
      history.append(list);
      card.append(history);
    }

    if ((record.limitations ?? []).length) {
      const limitations = document.createElement('section');
      limitations.className = 'portal-verification-section';
      limitations.append(text('h4', 'Credential limitations'));
      const list = document.createElement('ul');
      for (const item of record.limitations) list.append(text('li', item));
      limitations.append(list);
      card.append(limitations);
    }
  } catch (error) {
    card.append(text('p', `Additional lifecycle details unavailable: ${error.message}`, 'portal-result-note'));
  }
}

const verificationObserver = new MutationObserver(() => {
  const card = document.querySelector('.portal-credential-card');
  if (card) enhanceCredentialCard(card);
});
verificationObserver.observe(document.documentElement, { childList: true, subtree: true });
