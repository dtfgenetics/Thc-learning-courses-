import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const mirror = readJson('visuals/COURSE1-CONTROLLED-SVG-DRIVE-MIRROR.json');
const registry = readJson('visuals/ASSET-REGISTRY.json');
const coverage = readJson('visuals/COURSE1-VISUAL-CONCEPT-COVERAGE.json');
const release = readJson('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');

assert.equal(mirror.courseId, 'COURSE-LH-TECH1-001');
assert.equal(mirror.driveFolderId, '1cRDJn8stRWOKkcmsbjD12qjvt5g031oN');
assert.match(mirror.publicBaselineCommit ?? '', /^[a-f0-9]{40}$/);
assert.equal(mirror.assets?.length, 6, 'controlled SVG Drive mirror must cover concepts 13 through 18');

const registryById = new Map(registry.assets.map((asset) => [asset.id, asset]));
const coverageById = new Map(coverage.concepts.map((concept) => [concept.conceptId, concept]));
const releaseById = new Map(release.concepts.map((concept) => [concept.conceptId, concept]));
const driveIds = new Set();
const conceptIds = new Set();

for (const asset of mirror.assets) {
  assert.match(asset.conceptId ?? '', /^VIS-LH-TECH1-001-(?:13|14|15|16|17|18)-/, `${asset.conceptId}: unexpected concept`);
  assert.ok(!conceptIds.has(asset.conceptId), `${asset.conceptId}: duplicate mirrored concept`);
  conceptIds.add(asset.conceptId);
  assert.match(asset.registryAssetId ?? '', /^VIS-LH-TECH1-001-0(?:15|16|17|18|19|20)$/);
  assert.match(asset.driveFileId ?? '', /^[A-Za-z0-9_-]{20,}$/);
  assert.ok(!driveIds.has(asset.driveFileId), `${asset.conceptId}: Drive file ID must identify one canonical SVG master`);
  driveIds.add(asset.driveFileId);
  assert.equal(asset.state, 'public-svg-baseline');

  const registered = registryById.get(asset.registryAssetId);
  assert.ok(registered, `${asset.registryAssetId}: mirrored asset missing from public registry`);
  assert.equal(registered.sourcePath, asset.repositoryPath, `${asset.registryAssetId}: repository path drifted from Drive provenance record`);
  assert.equal(registered.learnerPath, `/${asset.repositoryPath.replace(/^apps\/web\/public\//, '')}`);
  assert.equal(path.basename(asset.repositoryPath), asset.fileName);

  const absolute = path.join(root, asset.repositoryPath);
  assert.ok(fs.existsSync(absolute), `${asset.repositoryPath}: mirrored public baseline file missing`);
  const digest = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
  assert.equal(digest, asset.sha256, `${asset.registryAssetId}: repository bytes no longer match the recorded Drive-mirror digest`);

  const concept = coverageById.get(asset.conceptId);
  assert.ok(concept, `${asset.conceptId}: missing concept coverage`);
  assert.ok(typeof concept.registryAssetId === 'string' && concept.registryAssetId.trim(), `${asset.conceptId}: current concept coverage must resolve a learner asset`);
  assert.ok(typeof concept.publicAsset === 'string' && concept.publicAsset.trim(), `${asset.conceptId}: current concept coverage must resolve a learner path`);

  const releaseConcept = releaseById.get(asset.conceptId);
  assert.ok(releaseConcept, `${asset.conceptId}: missing release control record`);
  assert.equal(releaseConcept.baseline.registryAssetId, asset.registryAssetId);
  assert.equal(releaseConcept.baseline.publicAsset, registered.learnerPath);
  if (releaseConcept.releaseApproved) {
    assert.equal(releaseConcept.candidate.qaStatus, 'public-approved', `${asset.conceptId}: released replacement must be public-approved`);
    assert.match(releaseConcept.candidate.targetPublicPath ?? '', /\.png$/i, `${asset.conceptId}: released replacement must target PNG`);
    assert.notEqual(releaseConcept.candidate.repositoryPath, asset.repositoryPath, `${asset.conceptId}: released replacement must not reuse the SVG baseline file`);
  }
}

assert.deepEqual([...conceptIds].sort(), [
  'VIS-LH-TECH1-001-13-EQUIPMENT-PREUSE',
  'VIS-LH-TECH1-001-14-OPERATOR-VS-MAINTENANCE',
  'VIS-LH-TECH1-001-15-FAULT-REPORT',
  'VIS-LH-TECH1-001-16-RECORD-CORRECTION',
  'VIS-LH-TECH1-001-17-SHIFT-HANDOFF',
  'VIS-LH-TECH1-001-18-INTEGRATED-WORKFLOW'
]);

console.log('Course 1 controlled SVG Drive provenance contract passed for six public baselines with unique Drive masters and byte-level repository digests.');
