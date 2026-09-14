import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'dist/staging-candidate');
const runtimeDir = path.join(outDir, 'runtime');
const includeRoots = ['apps', 'packages', 'content', 'registry', 'database', 'openapi'];
const includeFiles = ['package.json', 'package-lock.json'];

function git(...args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function copyTree(rel) {
  const source = path.join(root, rel);
  const target = path.join(runtimeDir, rel);
  if (!fs.existsSync(source)) throw new Error(`missing staging candidate input: ${rel}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

function walk(dir, base = dir, rows = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, rows);
    else if (entry.isFile()) rows.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return rows;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(runtimeDir, { recursive: true });
for (const rel of includeRoots) copyTree(rel);
for (const rel of includeFiles) copyTree(rel);

const sourceCommit = process.env.GITHUB_SHA || git('rev-parse', 'HEAD');
const sourceRef = process.env.GITHUB_REF_NAME || git('rev-parse', '--abbrev-ref', 'HEAD');
const eventBefore = String(process.env.GITHUB_EVENT_BEFORE || '').trim();
const zeroSha = /^0+$/;
const rollbackCommit = eventBefore && !zeroSha.test(eventBefore) ? eventBefore : git('rev-parse', 'HEAD^');
const sourceCommitTime = git('show', '-s', '--format=%cI', sourceCommit) || null;

if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) throw new Error(`unable to resolve source commit: ${sourceCommit}`);
if (rollbackCommit && !/^[0-9a-f]{40}$/i.test(rollbackCommit)) throw new Error(`invalid rollback commit: ${rollbackCommit}`);
if (rollbackCommit && rollbackCommit === sourceCommit) throw new Error('rollback commit must differ from source commit');

const files = walk(runtimeDir).map((rel) => ({
  path: rel,
  bytes: fs.statSync(path.join(runtimeDir, rel)).size,
  sha256: sha256(path.join(runtimeDir, rel))
}));
const aggregate = crypto.createHash('sha256');
for (const file of files) aggregate.update(`${file.sha256}  ${file.path}\n`);

const manifest = {
  manifestVersion: 1,
  candidateType: 'staging',
  source: {
    commit: sourceCommit,
    ref: sourceRef || null,
    commitTime: sourceCommitTime
  },
  rollback: {
    commit: rollbackCommit || null,
    strategy: 'redeploy-known-good-artifact',
    databaseWarning: 'Do not reverse database migrations unless the migration runbook explicitly marks the migration reversible.'
  },
  runtime: {
    fileCount: files.length,
    sha256: aggregate.digest('hex'),
    files
  },
  fingerprints: {
    curriculumRegistry: sha256(path.join(runtimeDir, 'registry/curriculum.json')),
    systemReadiness: sha256(path.join(runtimeDir, 'registry/system-readiness.json')),
    databaseSchema: sha256(path.join(runtimeDir, 'database/schema.sql')),
    academyOpenApi: sha256(path.join(runtimeDir, 'openapi/academy-api.yaml')),
    dependencyLock: sha256(path.join(runtimeDir, 'package-lock.json'))
  },
  boundaries: {
    containsSecrets: false,
    grantsCredentialIssuance: false,
    humanReviewRequiredForProductionCertification: true
  }
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'rollback.json'), `${JSON.stringify({
  sourceCommit,
  rollbackCommit: rollbackCommit || null,
  strategy: manifest.rollback.strategy,
  databaseWarning: manifest.rollback.databaseWarning
}, null, 2)}\n`);

console.log(JSON.stringify({
  stagingCandidateBuilt: true,
  sourceCommit,
  rollbackCommit: rollbackCommit || null,
  fileCount: files.length,
  runtimeSha256: manifest.runtime.sha256,
  output: path.relative(root, outDir)
}, null, 2));
