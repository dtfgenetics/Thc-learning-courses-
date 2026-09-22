import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/resource-reconciliation.schema.json')));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry/legacy-420-resource-reconciliation.json')));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(registry)) {
  for (const issue of validate.errors ?? []) console.error(`${issue.instancePath || '/'} ${issue.message}`);
  process.exit(1);
}

const ids = registry.records.map((record) => record.legacyId);
if (new Set(ids).size !== 420) throw new Error('Legacy IDs must be unique.');
for (let index = 0; index < 420; index += 1) {
  const expected = `THC-C${String(index + 1).padStart(3, '0')}`;
  if (ids[index] !== expected) throw new Error(`Expected ${expected} at record ${index + 1}, found ${ids[index]}.`);
}

if (registry.architecture.certificationDependencyAllowed !== false) {
  throw new Error('The standalone 420-lesson system must never be a certification dependency.');
}

const counts = registry.records.reduce((result, record) => {
  result[record.classification] = (result[record.classification] ?? 0) + 1;
  if (record.classification === 'reuse' && record.match?.status !== 'confirmed') {
    throw new Error(`${record.legacyId} is reuse without a confirmed match.`);
  }
  if (record.match?.status === 'confirmed' && !['exact-title', 'content-review'].includes(record.match.method)) {
    throw new Error(`${record.legacyId} has a confirmed match without exact-title or content-review evidence.`);
  }
  return result;
}, {});

const expectedSummary = {
  total: registry.records.length,
  confirmedReuse: counts.reuse ?? 0,
  confirmedUpgrade: counts.upgrade ?? 0,
  candidateReview: counts['manual-review'] ?? 0,
  unmatched: registry.records.filter((record) => record.match === null).length,
  createRequired: counts.create ?? 0
};
for (const [key, value] of Object.entries(expectedSummary)) {
  if (registry.summary[key] !== value) throw new Error(`Summary ${key}=${registry.summary[key]} but calculated ${value}.`);
}

for (const record of registry.records) {
  const match = record.match;
  if (!match) continue;
  if (match.repository !== 'dtfgenetics/Thc' || match.objectType !== 'encyclopedia-entry' || !/^THC-ENC-[0-9]{3}$/.test(match.objectId)) {
    throw new Error(`${record.legacyId} crosses the 420-lesson boundary into non-encyclopedia content.`);
  }
  if (/LESSON-LH-|COURSE-LH-|ASSESS-LH-|PRACTICAL-LH-|CRED/.test(JSON.stringify(match))) {
    throw new Error(`${record.legacyId} illegally references certification-course material.`);
  }
}

const repositoryRoots = new Map([
  ['dtfgenetics/Thc-learning-courses-', root],
  ['dtfgenetics/Thc', path.resolve(root, '..', 'thc-repo')]
]);

for (const record of registry.records) {
  const match = record.match;
  const repositoryRoot = match ? repositoryRoots.get(match.repository) : null;
  if (!match || !repositoryRoot) continue;

  // The encyclopedia repository is optional in isolated CI checkouts. When it is
  // available beside this repository, validate cross-repository targets with the
  // same rigor as local targets.
  if (match.repository === 'dtfgenetics/Thc' && !fs.existsSync(repositoryRoot)) continue;

  const target = path.resolve(repositoryRoot, match.path);
  if (!target.startsWith(`${repositoryRoot}${path.sep}`) || !fs.existsSync(target)) {
    throw new Error(`${record.legacyId} points to missing ${match.repository} object ${match.path}.`);
  }
  const document = JSON.parse(fs.readFileSync(target));
  const object = document.id === match.objectId
    ? document
    : document.lessons?.find((lesson) => lesson.id === match.objectId);
  if (!object) throw new Error(`${record.legacyId} target ${match.objectId} is absent from ${match.path}.`);
  if (object.id !== match.objectId) throw new Error(`${record.legacyId} target ID differs from ${match.objectId}.`);
  if (object.title !== match.title) throw new Error(`${record.legacyId} target title differs from ${match.title}.`);
}
console.log(`Standalone 420-lesson reconciliation passed: ${expectedSummary.total} records; ${expectedSummary.confirmedReuse} confirmed reuse; ${expectedSummary.confirmedUpgrade} confirmed upgrade; ${expectedSummary.candidateReview} manual review; ${expectedSummary.unmatched} unmatched.`);
