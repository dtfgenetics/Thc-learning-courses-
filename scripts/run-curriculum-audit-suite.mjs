import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const command = String(pkg.scripts?.test || '').trim();
if (!command) throw new Error('package.json scripts.test is missing');

const prefix = 'npm run ';
const commands = command.split(/\s*&&\s*/).map((value) => value.trim()).filter(Boolean);
for (const value of commands) {
  if (!value.startsWith(prefix)) throw new Error(`Unsupported test-suite command: ${value}`);
}

const results = [];
let failed = null;
for (const value of commands) {
  const script = value.slice(prefix.length).trim();
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const run = spawnSync('npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 8 * 1024 * 1024
  });
  const row = {
    script,
    command: value,
    startedAt,
    durationMs: Date.now() - started,
    status: run.status,
    signal: run.signal ?? null,
    stdout: String(run.stdout || '').slice(-50000),
    stderr: String(run.stderr || '').slice(-50000)
  };
  results.push(row);
  if (run.status !== 0) {
    failed = row;
    break;
  }
  console.log(`PASS ${script} (${row.durationMs} ms)`);
}

const outputDir = path.join(root, 'artifacts');
fs.mkdirSync(outputDir, { recursive: true });
const payload = {
  generatedAt: new Date().toISOString(),
  packageTestCommand: command,
  plannedScripts: commands.map((value) => value.slice(prefix.length).trim()),
  completedScripts: results.map((row) => row.script),
  passed: !failed && results.length === commands.length,
  failedScript: failed?.script ?? null,
  results
};
fs.writeFileSync(path.join(outputDir, 'curriculum-audit-results.json'), JSON.stringify(payload, null, 2));

if (failed) {
  console.error(`FAIL ${failed.script} (${failed.durationMs} ms)`);
  if (failed.stdout) console.error(failed.stdout);
  if (failed.stderr) console.error(failed.stderr);
  process.exit(failed.status || 1);
}
if (results.length !== commands.length) process.exit(2);
console.log(`Curriculum audit suite passed: ${results.length} package scripts.`);
