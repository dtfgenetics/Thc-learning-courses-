import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const outDir = path.join(root, 'dist/staging-candidate');
const runtimeDir = path.join(outDir, 'runtime');
const manifestPath = path.join(outDir, 'manifest.json');
const rollbackPath = path.join(outDir, 'rollback.json');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

if (!fs.existsSync(manifestPath)) throw new Error('staging candidate manifest missing');
if (!fs.existsSync(rollbackPath)) throw new Error('staging candidate rollback metadata missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rollback = JSON.parse(fs.readFileSync(rollbackPath, 'utf8'));

if (manifest.manifestVersion !== 1) throw new Error('unsupported staging candidate manifest version');
if (manifest.candidateType !== 'staging') throw new Error('candidate type must be staging');
if (!/^[0-9a-f]{40}$/i.test(manifest.source?.commit ?? '')) throw new Error('invalid source commit');
if (manifest.rollback?.commit && !/^[0-9a-f]{40}$/i.test(manifest.rollback.commit)) throw new Error('invalid rollback commit');
if (manifest.rollback?.commit === manifest.source.commit) throw new Error('rollback commit cannot equal source commit');
if (manifest.boundaries?.containsSecrets !== false) throw new Error('staging candidate must declare containsSecrets=false');
if (manifest.boundaries?.grantsCredentialIssuance !== false) throw new Error('staging candidate must not grant credential issuance');
if (manifest.boundaries?.humanReviewRequiredForProductionCertification !== true) throw new Error('human review production boundary must remain explicit');

const aggregate = crypto.createHash('sha256');
for (const file of manifest.runtime?.files ?? []) {
  const full = path.join(runtimeDir, file.path);
  if (!fs.existsSync(full)) throw new Error(`candidate file missing: ${file.path}`);
  const actualBytes = fs.statSync(full).size;
  const actualHash = sha256(full);
  if (actualBytes !== file.bytes) throw new Error(`candidate byte-size mismatch: ${file.path}`);
  if (actualHash !== file.sha256) throw new Error(`candidate hash mismatch: ${file.path}`);
  aggregate.update(`${actualHash}  ${file.path}\n`);
}

if ((manifest.runtime?.files ?? []).length !== manifest.runtime?.fileCount) throw new Error('candidate file count mismatch');
if (aggregate.digest('hex') !== manifest.runtime?.sha256) throw new Error('aggregate runtime hash mismatch');

const expectedFingerprints = {
  curriculumRegistry: 'registry/curriculum.json',
  systemReadiness: 'registry/system-readiness.json',
  databaseSchema: 'database/schema.sql',
  academyOpenApi: 'openapi/academy-api.yaml',
  dependencyLock: 'package-lock.json'
};
for (const [name, rel] of Object.entries(expectedFingerprints)) {
  const actual = sha256(path.join(runtimeDir, rel));
  if (manifest.fingerprints?.[name] !== actual) throw new Error(`fingerprint mismatch: ${name}`);
}

if (rollback.sourceCommit !== manifest.source.commit) throw new Error('rollback metadata source commit mismatch');
if ((rollback.rollbackCommit ?? null) !== (manifest.rollback?.commit ?? null)) throw new Error('rollback metadata commit mismatch');

console.log(JSON.stringify({
  stagingCandidateVerified: true,
  sourceCommit: manifest.source.commit,
  rollbackCommit: manifest.rollback?.commit ?? null,
  fileCount: manifest.runtime.fileCount,
  runtimeSha256: manifest.runtime.sha256
}, null, 2));
