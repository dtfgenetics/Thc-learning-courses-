const COURSE_ID = 'COURSE-LH-TECH1-001';
const lessonView = document.querySelector('#lesson-view');
let lastKey = '';

function el(tag, value = '', className = '') {
  const node = document.createElement(tag);
  if (value !== '') node.textContent = value;
  if (className) node.className = className;
  return node;
}

async function loadFeedback() {
  const host = lessonView?.querySelector('.course-practical-personal-status');
  if (!host || host.querySelector('.course-practical-evaluator-feedback')) return;
  try {
    const response = await fetch(`/api/v1/me/courses/${COURSE_ID}/evidence`, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (!response.ok) return;
    const body = await response.json();
    const practical = body.performanceAssessment ?? {};
    const feedback = String(practical.remediationSummary ?? '').trim();
    if (!feedback) return;
    const key = `${practical.updatedAt ?? ''}:${feedback}`;
    if (key === lastKey && host.querySelector('.course-practical-evaluator-feedback')) return;
    lastKey = key;
    const card = el('aside', '', 'course-practical-evaluator-feedback');
    card.setAttribute('aria-label', 'Assessor feedback and remediation');
    card.append(el('strong', 'Assessor feedback / remediation'), el('p', feedback));
    host.append(card);
  } catch {
    // Public practical remains available if private learner evidence is unavailable.
  }
}

if (lessonView) {
  new MutationObserver(() => loadFeedback()).observe(lessonView, { childList: true, subtree: true });
  loadFeedback();
}
