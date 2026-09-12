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
  'course-assessment.js'
]) assert.ok(html.includes(marker), `index must load ${marker}`);

for (const marker of [
  '/api/v1/me/courses/${COURSE_ID}/assessment-attempts',
  '/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/responses',
  '/api/v1/me/assessment-attempts/${encodeURIComponent(currentAttempt.attempt.id)}/submit',
  'Responses save to your learner record as you answer.',
  'Post-attempt feedback is domain-level; answer keys are not displayed.',
  'This is the public Course 1 final, not the restricted Technician I certification examination.',
  'Course 1 knowledge evidence only',
  'Open Field References'
]) assert.ok(js.includes(marker), `assessment UI missing contract: ${marker}`);

assert.ok(js.includes("credentials: 'same-origin'"), 'assessment requests must use same-origin authentication');
assert.ok(js.includes("input.type = 'radio'"), 'single-choice assessment items need radio controls');
assert.ok(js.includes("input.type = 'checkbox'"), 'multiple-response assessment items need checkbox controls');
assert.ok(js.includes("input.type = 'number'"), 'numeric assessment items need numeric controls');
assert.ok(js.includes('renderRichBlocks(fieldset, item.stimulus)'), 'assessment evidence stimuli must use the accessible rich renderer');
assert.ok(js.includes('pendingSaves'), 'submission must account for in-flight autosaves');
assert.ok(js.includes("submit.disabled = answered !== total || pendingSaves.size > 0"), 'submit must stay disabled until every item is answered and saved');
assert.equal(js.includes('.innerHTML'), false, 'assessment UI must use DOM construction rather than innerHTML');
assert.equal(/\bcorrect\b/.test(js), false, 'learner assessment UI must not depend on a correct-answer field');
assert.equal(/\brationale\b/.test(js), false, 'learner assessment UI must not depend on rationale data');

for (const marker of [
  '.course-assessment-toolbar',
  '.course-assessment-choice',
  'min-height: 44px',
  '@media (max-width: 620px)',
  '.course-assessment-domain-grid'
]) assert.ok(css.includes(marker), `assessment CSS missing ${marker}`);

assert.ok(server.includes("['/course-assessment.js', ['course-assessment.js', 'text/javascript; charset=utf-8']]"), 'web server must serve assessment JS');
assert.ok(server.includes("['/course-assessment.css', ['course-assessment.css', 'text/css; charset=utf-8']]"), 'web server must serve assessment CSS');

console.log('Course 1 final learner UI autosave, accessibility, non-disclosure, responsive, and static-serving contracts passed.');
