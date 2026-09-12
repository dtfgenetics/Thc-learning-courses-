import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const rel = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFileSync(rel(...parts), 'utf8');
const exists = (...parts) => fs.existsSync(rel(...parts));

const base = ['docs', 'learning-hub', 'tech1', 'course-001', 'student', 'job-aids'];
const aids = [
  { file: '01-HAZARD-RESPONSE-GUIDE.md', runtimeId: 'FR-LH-TECH1-001-HAZARD', moduleId: 'MOD-LH-TECH1-001-SAFETY', objectives: ['LO-LH-TECH1-001-01', 'LO-LH-TECH1-001-02'], workbook: ['Activities 1, 8 and 9'] },
  { file: '02-BIOSECURITY-SANITATION-GUIDE.md', runtimeId: 'FR-LH-TECH1-001-BIOSEC', moduleId: 'MOD-LH-TECH1-001-BIOSEC', objectives: ['LO-LH-TECH1-001-03', 'LO-LH-TECH1-001-04'], workbook: ['Activities 2, 8 and 9'] },
  { file: '03-CONTROLLED-WORK-INSTRUCTION-CHECKLIST.md', runtimeId: 'FR-LH-TECH1-001-SOP', moduleId: 'MOD-LH-TECH1-001-WORKFLOW', objectives: ['LO-LH-TECH1-001-05'], workbook: ['Activities 3 and 8'] },
  { file: '04-TRACEABILITY-RECONCILIATION-GUIDE.md', runtimeId: 'FR-LH-TECH1-001-TRACE', moduleId: 'MOD-LH-TECH1-001-TRACEABILITY', objectives: ['LO-LH-TECH1-001-06', 'LO-LH-TECH1-001-07', 'LO-LH-TECH1-001-08'], workbook: ['Activities 4, 8 and 10'] },
  { file: '05-EQUIPMENT-READINESS-FAULT-GUIDE.md', runtimeId: 'FR-LH-TECH1-001-EQUIP', moduleId: 'MOD-LH-TECH1-001-EQUIPMENT', objectives: ['LO-LH-TECH1-001-09', 'LO-LH-TECH1-001-10'], workbook: ['Activities 5, 8 and 11'] },
  { file: '06-DATA-INTEGRITY-HANDOFF-GUIDE.md', runtimeId: 'FR-LH-TECH1-001-RECORDS', moduleId: 'MOD-LH-TECH1-001-RECORDS', objectives: ['LO-LH-TECH1-001-11', 'LO-LH-TECH1-001-12'], workbook: ['Activities 6, 7, 8 and 12'] }
];

const failures = [];
const requireText = (label, content, needle) => { if (!content.includes(needle)) failures.push(`${label}: missing required text '${needle}'`); };

for (const aid of aids) {
  if (!exists(...base, aid.file)) { failures.push(`${aid.file}: field reference is missing`); continue; }
  const content = read(...base, aid.file);
  for (const marker of ['# Job Aid', '**Course objective', '**Workbook practice:**', '## Strong vs weak', '## Documentation formula', '## Pocket use']) requireText(aid.file, content, marker);
  for (const objective of aid.objectives) requireText(aid.file, content, objective);
  for (const marker of aid.workbook) requireText(aid.file, content, marker);
}

const indexFile = 'FIELD-REFERENCE-INDEX.md';
if (!exists(...base, indexFile)) failures.push(`${indexFile}: missing field-reference index`);
else {
  const index = read(...base, indexFile);
  for (const aid of aids) requireText(indexFile, index, aid.file);
  requireText(indexFile, index, 'Editable reference policy');
}

const specFile = 'FIELD-REFERENCE-PRODUCTION-SPEC.md';
if (!exists(...base, specFile)) failures.push(`${specFile}: missing production specification`);
else {
  const spec = read(...base, specFile);
  for (const required of ['Mobile-first requirements', 'Print requirements', 'Accessibility requirements', 'not a maximum']) requireText(specFile, spec, required);
}

const workbookPath = ['docs', 'learning-hub', 'tech1', 'course-001', 'student', 'STUDENT-WORKBOOK.md'];
if (!exists(...workbookPath)) failures.push('STUDENT-WORKBOOK.md: missing learner workbook');
else requireText('STUDENT-WORKBOOK.md', read(...workbookPath), 'job-aids/FIELD-REFERENCE-INDEX.md');

const manifestPath = ['docs', 'learning-hub', 'tech1', 'course-001', 'COURSE-PACKAGE-MANIFEST.md'];
if (!exists(...manifestPath)) failures.push('COURSE-PACKAGE-MANIFEST.md: missing package manifest');
else {
  const manifest = read(...manifestPath);
  requireText('COURSE-PACKAGE-MANIFEST.md', manifest, '6 expanded field-ready operational job aids');
  requireText('COURSE-PACKAGE-MANIFEST.md', manifest, 'field-reference production specification');
  requireText('COURSE-PACKAGE-MANIFEST.md', manifest, 'not maximums');
}

const runtimePath = rel('apps', 'web', 'public', 'governance.js');
const indexHtml = read('apps', 'web', 'public', 'index.html');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const portalCss = read('apps', 'web', 'public', 'portal.css');

const syntax = spawnSync(process.execPath, ['--check', runtimePath], { encoding: 'utf8' });
if (syntax.status !== 0) failures.push(`governance.js: JavaScript syntax check failed: ${(syntax.stderr || syntax.stdout).trim()}`);

requireText('index.html', indexHtml, 'id="tab-field-references"');
requireText('index.html', indexHtml, '>Field References<');
for (const aid of aids) {
  requireText('governance.js', runtime, aid.runtimeId);
  requireText('governance.js', runtime, aid.moduleId);
  for (const objective of aid.objectives) requireText('governance.js', runtime, objective);
}
for (const runtimeContract of ['renderFieldReferenceLibrary', 'renderFieldReferenceDetail', 'injectCatalogReferenceLinks', 'injectLessonReferenceLink', 'injectPracticeRemediation', 'practice-feedback[data-state="incorrect"]', 'window.print()', 'MutationObserver']) requireText('governance.js', runtime, runtimeContract);
if (runtime.includes('.innerHTML')) failures.push('governance.js: field-reference runtime must use DOM construction rather than innerHTML');

for (const cssContract of ['.field-reference-grid', '.lesson-field-reference', '.field-reference-remediation', '.field-reference-comparison', '@media print', 'min-height: 44px', '.catalog-panel', '.field-reference-detail']) requireText('portal.css', portalCss, cssContract);

if (failures.length) {
  console.error(`Course 1 field-reference contract failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Course 1 field-reference contract passed for ${aids.length} field aids plus index, production spec, workbook integration, learner runtime navigation/remediation, JavaScript syntax, responsive styling, print behavior, and package manifest.`);
