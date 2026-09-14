import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const practical = JSON.parse(fs.readFileSync('content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json', 'utf8'));
const jsPath = 'apps/web/public/course-assessment.js';
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync('apps/web/public/course-assessment.css', 'utf8');

const syntax = spawnSync(process.execPath, ['--check', jsPath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

const sync = spawnSync(process.execPath, ['scripts/sync-course1-practical-public.mjs'], { encoding: 'utf8' });
assert.equal(sync.status, 0, sync.stderr || sync.stdout);

assert.equal(practical.status, 'published', 'Course 1 practical must remain published as academic content');
assert.equal(practical.extensions?.publicAcademicViewing, true, 'Course 1 practical must remain public academic content');
assert.equal(practical.extensions?.operationalUseBlockedUntilCalibration, true, 'Course 1 certification-use practical must remain blocked until calibration evidence exists');
assert.equal(practical.extensions?.certificationUseStatus, 'validation-pending', 'Course 1 must distinguish academic publication from certification-use approval');
assert.ok(practical.extensions?.learnerWorkflow?.overview, 'public practical needs an academic overview');
assert.ok(practical.extensions?.learnerWorkflow?.academicUse, 'public practical needs an academic-use statement');
assert.ok(practical.extensions?.learnerWorkflow?.boundary, 'public practical needs a course/credential boundary statement');
assert.ok(practical.evidenceOutputs.length > 0, 'current practical must expose its controlled evidence-output list without a fixed count ceiling');
assert.ok(Number(practical.scoring?.totalPoints) > 0, 'current practical must expose a positive controlled scoring total without freezing the point model permanently');
assert.equal(practical.scoring.domains.reduce((sum, domain) => sum + Number(domain.points), 0), Number(practical.scoring.totalPoints), 'current domain maximums must reconcile to the controlled scoring total');

for (const marker of [
  'COURSE1_PRACTICAL_PUBLIC_DATA_START',
  'COURSE1_PRACTICAL_PUBLIC_DATA_END',
  'Study course practical',
  'Course 1 public academic practical',
  'scoring model',
  'required evidence outputs',
  'Critical-error boundaries',
  'Print practical',
  'The practical is public academic content.',
  'Personal assessor results remain private learner records.',
  'provisional academic development threshold',
  'pending pilot evidence and documented standard setting',
  'not a Technician I credential cut score',
  'window.print()'
]) assert.ok(js.includes(marker), `public practical UI missing contract: ${marker}`);

const enhanceStart = js.indexOf('async function enhanceEvidencePanel');
const enhanceEnd = js.indexOf('function observeEvidencePanel', enhanceStart);
assert.ok(enhanceStart >= 0 && enhanceEnd > enhanceStart, 'evidence-panel enhancer must exist');
const enhance = js.slice(enhanceStart, enhanceEnd);
const practicalActionIndex = enhance.indexOf('Study course practical');
const loadedFinalIndex = enhance.indexOf("if (result.state === 'loaded')", practicalActionIndex);
assert.ok(practicalActionIndex >= 0, 'public practical action must be added to the Course 1 card');
assert.ok(loadedFinalIndex > practicalActionIndex, 'public practical action must be created before authenticated final-assessment actions');

const publicDataStart = js.indexOf('/* COURSE1_PRACTICAL_PUBLIC_DATA_START */');
const publicDataEnd = js.indexOf('/* COURSE1_PRACTICAL_PUBLIC_DATA_END */');
const publicProjection = js.slice(publicDataStart, publicDataEnd);
for (const assessorOnly of ['criteria', 'fullCredit', 'partialCredit', 'noCredit', 'scoringAnchorPolicy', 'observedEvidence', 'promptNote']) {
  assert.equal(publicProjection.includes(assessorOnly), false, `learner practical projection must not expose assessor-only rubric field ${assessorOnly}`);
}
for (const privateField of ['evaluatorId', 'evaluator_id', 'evidenceJson', 'evidence_json']) {
  assert.equal(js.includes(privateField), false, `public practical runtime must not expose ${privateField}`);
}
assert.equal(js.includes('.innerHTML'), false, 'public practical UI must use DOM construction instead of innerHTML');
assert.equal(/restricted Technician I/i.test(js), false, 'learner-facing runtime should describe the credential exam as separate, not label Course 1 content restricted');

for (const marker of [
  '.course-practical-panel',
  '.course-practical-stage-grid',
  '.course-practical-score-grid',
  '.course-practical-critical',
  '.course-practical-page-actions',
  '@media (max-width: 620px)',
  '@media print'
]) assert.ok(css.includes(marker), `public practical CSS missing ${marker}`);

assert.ok(css.includes('min-height: 44px'), 'public practical actions must retain accessible touch-target sizing');
assert.ok(css.includes('.course-practical-personal-status'), 'private result status needs a distinct visual region');

console.log('Course 1 public academic practical learner UI, privacy, synchronization, extensibility, provisional-threshold, responsive, certification-boundary, and print contracts passed.');