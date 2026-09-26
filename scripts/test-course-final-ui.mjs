import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const jsPath = 'apps/web/public/course-assessment.js';
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync('apps/web/public/course-assessment.css', 'utf8');
const server = fs.readFileSync('apps/web/server.mjs', 'utf8');

const syntax = spawnSync(process.execPath, ['--check', jsPath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

for (const marker of [
  'course-assessment.css',
  'course-assessment.js',
  'Course 1 academic threshold notice:',
  'pending pilot evidence and documented standard setting'
]) assert.ok(html.includes(marker), `index must expose final-assessment asset/boundary contract: ${marker}`);

for (const marker of [
  '/api/v1/me/courses/${encodeURIComponent(courseId)}/assessment-attempts',
  '/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/responses',
  '/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/submit',
  'Responses save to your learner record as you answer.',
  'course-assessment-timer',
  'Time expired — submitting',
  'submitAssessment(panel, { force: true, timedOut: true })',
  'Post-attempt feedback is domain-level; answer keys are not displayed.',
  'Authenticated summative assessment',
  'It is recorded to your learner account and remains separate from professional credential issuance.',
  'Current academic development threshold:',
  'Practical/performance evidence and professional credential issuance remain separate decisions.',
  'Open Field References',
  'course-assessment-navigator',
  'Assessment question navigator',
  'updateQuestionNavigator(panel)'
]) assert.ok(js.includes(marker), `assessment UI missing contract: ${marker}`);

assert.ok(js.includes("credentials: 'same-origin'"), 'assessment requests must use same-origin authentication');
assert.ok(js.includes("input.type = 'radio'"), 'single-choice assessment items need radio controls');
assert.ok(js.includes("input.type = 'checkbox'"), 'multiple-response assessment items need checkbox controls');
assert.ok(js.includes("input.type = 'number'"), 'numeric assessment items need numeric controls');
assert.ok(js.includes('renderRichBlocks(fieldset, item.stimulus)'), 'assessment evidence stimuli must use the accessible rich renderer');
for (const identityMarker of ['Learner: ', 'Application: ', 'Certificate name: ', 'Attempt: ']) {
  assert.ok(js.includes(identityMarker), `assessment UI must retain learner/exam identity marker: ${identityMarker}`);
}
assert.ok(js.includes('result.learner?.certificateName'), 'scored assessment result must retain the certificate name linked to the attempt');
assert.ok(js.includes('pendingSaves'), 'submission must account for in-flight autosaves');
assert.ok(js.includes('saveChains'), 'rapid updates for one item must be serialized');
assert.ok(js.includes("fieldset.dataset.saved = 'false'"), 'changed responses must become unsaved until persistence succeeds');
assert.ok(js.includes("fieldset.dataset.saved = 'true'"), 'successful autosave must mark the item saved');
assert.ok(js.includes('submit.disabled = !allAnsweredAndSaved(panel) || pendingSaves.size > 0'), 'submit must stay disabled until every item is answered and saved');
assert.equal(js.includes('.innerHTML'), false, 'assessment UI must use DOM construction rather than innerHTML');
assert.equal(/\bcorrect\b/.test(js), false, 'learner assessment UI must not depend on a correct-answer field');
assert.equal(/\brationale\b/.test(js), false, 'learner assessment UI must not depend on rationale data');

for (const marker of [
  '.course-assessment-toolbar',
  '.course-assessment-timer',
  '.course-assessment-choice',
  'min-height: 44px',
  '@media (max-width: 620px)',
  '.course-assessment-domain-grid',
  '.course-assessment-navigator',
  '.course-assessment-nav-button',
  'scroll-margin-top: 10rem',
  'min-height: 52px'
]) assert.ok(css.includes(marker), `assessment CSS missing ${marker}`);

assert.ok(server.includes("['/course-assessment.js', ['course-assessment.js', 'text/javascript; charset=utf-8']]"), 'web server must serve assessment JS');
assert.ok(server.includes("['/course-assessment.css', ['course-assessment.css', 'text/css; charset=utf-8']]"), 'web server must serve assessment CSS');

const app = fs.readFileSync('apps/web/public/app.js', 'utf8');
assert.ok(app.includes("import { launchCourseAssessment } from './course-assessment.js'"), 'catalog must import the shared final launcher');
assert.ok(app.includes('Take graded course final'), 'catalog must expose a graded final launch action for published summative finals');
assert.ok(app.includes('launchCourseAssessment(course.id, launch)'), 'catalog final action must launch the selected course, not a hard-coded Course 1 assessment');
assert.ok(app.includes("academyParams.get('course')"), 'Academy must accept a course deep link from the public course site');
assert.ok(app.includes("academyParams.get('view')"), 'Academy must accept a final-view deep link');
assert.ok(app.includes('data-course-final-for') || app.includes('dataset.courseFinalFor'), 'Academy must mark course-specific final controls for deep linking');

console.log('Academy final learner UI autosave, accessibility, non-disclosure, identity linkage, generic course launching, responsive, and static-serving contracts passed.');