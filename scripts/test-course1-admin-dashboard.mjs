import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const runtimePath = 'apps/web/public/progress.js';
const runtime = fs.readFileSync(runtimePath, 'utf8');

const syntax = spawnSync(process.execPath, ['--check', runtimePath], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

assert.match(html, /id="tab-admin"[^>]*hidden/, 'Admin tab must remain hidden until admin authorization succeeds');
assert.equal(html.includes('/admin.js'), false, 'Admin dashboard must not depend on an unserved standalone asset');
assert.equal(html.includes('/admin.css'), false, 'Admin dashboard must not depend on an unserved standalone stylesheet');

for (const marker of [
  'initializeAdminDashboard',
  '/api/v1/admin/diagnostics',
  '/api/v1/admin/courses/${ADMIN_COURSE_ID}/practical-report',
  '/api/v1/admin/courses/${ADMIN_COURSE_ID}/practical-assignment',
  'Course 1 Operations Dashboard',
  'Export CSV',
  'Refresh report',
  'Follow-up open',
  'Unassigned',
  'Any open follow-up',
  'Assigned evaluator for ${row.learnerSubject}',
  "credentials: 'same-origin'",
  'course-1-practical-report.csv',
  'aria-live',
  'min-height:44px',
  '@media(max-width:620px)',
  '@media print'
]) assert.ok(runtime.includes(marker), `Admin dashboard runtime missing contract: ${marker}`);

assert.equal(runtime.includes('.innerHTML'), false, 'Admin dashboard must build DOM safely rather than use innerHTML');
assert.ok(runtime.includes("if (typeof document !== 'undefined') initializeAdminDashboard()"), 'Node-imported progress helpers must guard browser-only admin initialization');
assert.ok(runtime.includes("link.href = `/api/v1/admin/courses/${ADMIN_COURSE_ID}/practical-report?format=csv`"), 'CSV export must use the privacy-bounded admin report endpoint');
assert.ok(runtime.includes("body: JSON.stringify({ learnerSubject: row.learnerSubject, evaluatorId })"), 'Admin assignment mutation must submit only learner/evaluator identity inputs; server remains authoritative');
assert.equal(runtime.includes('evaluatorNotes'), false, 'Admin dashboard must not request or render private evaluator notes');
assert.equal(runtime.includes('evidenceOutputs'), false, 'Admin dashboard must not request or render detailed learner evidence references');

console.log('Course 1 role-gated admin dashboard, privacy-bounded reporting, reassignment, CSV, responsive and safe-DOM contracts passed.');
