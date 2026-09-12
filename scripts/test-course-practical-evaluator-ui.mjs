import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const jsPath = 'apps/web/public/assessor.js';
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync('apps/web/public/assessor.css', 'utf8');
const webServer = fs.readFileSync('apps/web/server.mjs', 'utf8');

const syntax = spawnSync(process.execPath, ['--check', jsPath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

assert.match(html, /id="tab-assessor"[^>]*hidden/, 'assessor tab must be hidden until evaluator capability succeeds');
assert.ok(html.includes('href="/assessor.css"'), 'Academy must load assessor styles');
assert.ok(html.includes('src="/assessor.js"'), 'Academy must load assessor client');

for (const marker of [
  '/api/v1/evaluator/capabilities',
  '/api/v1/evaluator/courses/${COURSE_ID}/practical-evaluation',
  "input.dataset.domain = domain.name",
  "input.dataset.criticalIndex = String(index)",
  "evaluatorNotes",
  "learnerFeedback",
  "Save in-progress evaluation",
  "Finalize evaluation",
  "I confirm the domain scores and critical-error findings reflect the evaluated practical evidence.",
  "Server result is authoritative."
]) assert.ok(js.includes(marker), `assessor UI missing contract: ${marker}`);

assert.ok(js.includes("credentials: 'same-origin'"), 'assessor requests must use the authenticated same-origin session');
assert.ok(js.includes('practical.scoring.domains'), 'domain controls must be generated from the server-provided practical definition');
assert.ok(js.includes('practical.criticalErrors'), 'critical-error controls must be generated from the server-provided canonical list');
assert.equal(js.includes('.innerHTML'), false, 'assessor UI must construct DOM safely rather than use innerHTML');
assert.equal(js.includes('evaluatorId:'), false, 'browser must not choose or submit evaluator identity');
assert.equal(js.includes('status: \'passed\''), false, 'browser must not set the authoritative pass result');

for (const marker of [
  '.assessor-domain-grid',
  '.assessor-critical',
  '.assessor-confirm',
  'min-height: 44px',
  '@media (max-width: 620px)',
  ':focus-visible'
]) assert.ok(css.includes(marker), `assessor CSS missing ${marker}`);

assert.ok(webServer.includes("['/assessor.js', ['assessor.js', 'text/javascript; charset=utf-8']]"), 'Academy web server must serve assessor JS');
assert.ok(webServer.includes("['/assessor.css', ['assessor.css', 'text/css; charset=utf-8']]"), 'Academy web server must serve assessor CSS');

console.log('Course 1 assessor role-gating, canonical dynamic controls, safe DOM, responsive, accessibility, and static-serving contracts passed.');
