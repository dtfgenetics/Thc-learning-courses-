import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const run = (script, args = []) => spawnSync(process.execPath, [script, ...args], {
  cwd: process.cwd(),
  encoding: 'utf8'
});

const coverage = run('scripts/report-specialist-final-coverage.mjs', ['--check']);
assert.equal(coverage.status, 0, coverage.stderr || coverage.stdout);
const report = JSON.parse(coverage.stdout);
assert.equal(
  report.assessments.some((row) => row.assessment === 'ASSESS-CRED-TECH1-001'),
  false,
  'contract-only private credential assessments must not be treated as public specialist finals'
);

const readiness = run('scripts/report-specialist-credential-readiness.mjs');
assert.equal(readiness.status, 0, readiness.stderr || readiness.stdout);
assert.match(
  readiness.stdout,
  /ASSESS-CRED-TECH1-001: private operational pool required; public items intentionally absent/,
  'readiness should report the fail-closed private-bank boundary without a structural error'
);

console.log('Private credential assessment boundary checks passed.');
