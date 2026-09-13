import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const jsPath = 'apps/web/public/course-assessment.js';
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync('apps/web/public/course-assessment.css', 'utf8');
const portalCss = fs.readFileSync('apps/web/public/portal.css', 'utf8');

const syntax = spawnSync(process.execPath, ['--check', jsPath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, `${jsPath} must pass node --check: ${syntax.stderr || syntax.stdout}`);

assert.match(html, /id="tab-course-guide"[^>]*class="portal-tab"[^>]*aria-pressed="false"[^>]*>Course Guide<\/button>/, 'Academy must expose Course Guide as a first-class learner tab');
assert.ok(js.includes("document.querySelector('#tab-course-guide')?.addEventListener('click', renderCourseGuide)"), 'Course Guide tab must open the guide runtime');
assert.ok(js.includes('const COURSE_GUIDE = {'), 'Course Guide must use a structured learner model');
assert.ok(js.includes('function renderCourseGuide()'), 'Course Guide renderer is required');
assert.ok(js.includes("setPortalTabActive('tab-course-guide')"), 'Course Guide must participate in the shared tab active-state model');
assert.equal(js.includes('.innerHTML'), false, 'Course Guide must construct DOM safely without innerHTML');

for (let index = 1; index <= 12; index += 1) {
  const id = `LO-LH-TECH1-001-${String(index).padStart(2, '0')}`;
  assert.ok(js.includes(id), `Course Guide must expose learning objective ${id}`);
}

for (const moduleTitle of [
  'Module 1 — Applied Cultivation Workplace Safety',
  'Module 2 — Sanitation, Biosecurity & Controlled Movement',
  'Module 3 — SOPs, Work Orders, Authority & Escalation',
  'Module 4 — Traceability, Material Movement, Inventory & Waste',
  'Module 5 — Equipment Readiness, Operator Care & Fault Reporting',
  'Module 6 — Records, Shift Handoff & Integrated Workflow'
]) assert.ok(js.includes(moduleTitle), `Course Guide must expose ${moduleTitle}`);

for (const [competency, minimum] of [
  ['Cultivation Workplace Safety', 70],
  ['Cultivation Biosecurity', 60],
  ['SOP and Work Instruction Execution', 60],
  ['Professional Quality and Documentation', 65],
  ['Cultivation Traceability and Inventory', 65],
  ['Cultivation Equipment Readiness and Operator Care', 60]
]) {
  assert.ok(js.includes(`['${competency}', ${minimum}]`), `Course Guide must expose ${competency} floor ${minimum}%`);
}

for (const marker of [
  '18 lessons • 945 minutes / 15.75 hours',
  'at least 80% overall plus every configured competency floor',
  'The integrated practical is 100 points across eight domains.',
  'every practical domain minimum',
  'zero critical errors',
  'all required evidence reviewed',
  'all required evidence verified',
  'Strong, Competent, Developing, and Insufficient',
  'no artificial lifetime attempt maximum',
  'Academic integrity',
  'Accessibility, technology, and learner support',
  'Evidence and source policy',
  'Passing Course 1 creates academic course evidence only.',
  'does not automatically award THC Cultivation Technician I',
  'Print Course Guide',
  'Open Course 1 curriculum'
]) assert.ok(js.includes(marker), `Course Guide missing learner-facing contract: ${marker}`);

for (const source of ['OSHA', 'NIOSH', 'EPA Worker Protection Standard', 'GS1', 'HSE', 'MHRA']) {
  assert.ok(js.includes(source), `Course Guide must expose source family ${source}`);
}

assert.ok(js.includes("className = 'course-practical-list'"), 'Course Guide must reuse accessible list presentation');
assert.ok(js.includes("'course-practical-stage-grid'"), 'Course Guide must reuse responsive module-card layout');
assert.ok(js.includes("'course-practical-page-actions'"), 'Course Guide must use established action layout');
assert.ok(js.includes("print.addEventListener('click', () => window.print())"), 'Course Guide must support print');
assert.match(portalCss, /\.portal-tab\s*\{[^}]*min-height:\s*44px/is, 'Course Guide tab inherits a 44px touch target');
assert.ok(css.includes('@media (max-width: 620px)'), 'Course Guide reused assessment/practical surfaces must have compact-layout support');

assert.equal(/academic\s+credit\s+hours?/i.test(js), false, 'Course Guide must not claim academic credit hours');
assert.equal(/guaranteed\s+credential/i.test(js), false, 'Course Guide must not guarantee credential issuance');

console.log('Course 1 Course Guide UI passed: first-class navigation, 12 outcomes, six modules, grading/completion rules, learner policies, source boundaries, safe DOM, print, responsive and accessibility contracts are protected.');
