import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'visuals/ASSET-REGISTRY.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

assert.equal(registry.courseId, 'COURSE-LH-TECH1-001');
assert.equal(registry.policy?.expandable, true, 'Course 1 visual registry must remain expandable');
assert.equal(registry.policy?.maximumAssetCount, null, 'Course 1 visual registry must not impose an artificial asset maximum');

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.ok(produced.length > 0, 'Course 1 must have at least one produced learner visual');
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length, 'produced visual ids must be unique');
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length, 'produced learner paths must be unique');

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-001-[0-9]{3}$/, `${asset.id ?? '<missing>'}: invalid visual id`);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course1\/[A-Za-z0-9._-]+\.svg$/, `${asset.id}: invalid learnerPath`);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course1\/[A-Za-z0-9._-]+\.svg$/, `${asset.id}: invalid sourcePath`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0, `${asset.id}: primaryLessons must be non-empty`);
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim().length > 0, `${asset.id}: purpose is required`);

  const expectedDownload = `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`;
  assert.equal(asset.publicDownloadUrl, expectedDownload, `${asset.id}: publicDownloadUrl must point to the canonical main-branch source asset`);

  const absoluteSource = path.join(root, asset.sourcePath);
  assert.ok(fs.existsSync(absoluteSource), `${asset.id}: source asset does not exist at ${asset.sourcePath}`);
  const svg = fs.readFileSync(absoluteSource, 'utf8');
  assert.match(svg, /<svg[\s>]/, `${asset.id}: source asset must contain SVG markup`);
  assert.match(svg, /<title[\s>]/, `${asset.id}: source asset must include an accessible <title>`);
  assert.match(svg, /<desc[\s>]/, `${asset.id}: source asset must include an accessible <desc>`);

  assert.equal(asset.learnerPath, `/${asset.sourcePath.replace(/^apps\/web\/public\//, '')}`, `${asset.id}: learnerPath and sourcePath must resolve to the same public asset`);
}

const lessonDir = path.join(root, 'content/lessons');
for (const file of fs.readdirSync(lessonDir).filter((name) => /^LESSON-LH-TECH1-001-.*\.json$/.test(name))) {
  const lesson = JSON.parse(fs.readFileSync(path.join(lessonDir, file), 'utf8'));
  for (const block of lesson.content?.blocks ?? []) {
    if (block.type !== 'image' || !block.assetId) continue;
    const asset = registryById.get(block.assetId);
    assert.ok(asset, `${lesson.id}: image block references missing/unproduced asset ${block.assetId}`);
    assert.equal(block.src, asset.learnerPath, `${lesson.id}: ${block.assetId} src must match the registry learnerPath`);
    assert.ok(typeof block.alt === 'string' && block.alt.trim().length > 0, `${lesson.id}: ${block.assetId} must include learner-facing alt text`);
    usedAssetIds.add(block.assetId);
  }
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced learner asset is registered but not mapped into a canonical Course 1 lesson`);
  for (const lessonId of asset.primaryLessons) {
    const lessonPath = path.join(root, 'content/lessons', `${lessonId}.json`);
    assert.ok(fs.existsSync(lessonPath), `${asset.id}: primary lesson ${lessonId} does not exist`);
  }
}

console.log(`Course 1 visual delivery contract passed for ${produced.length} produced learner assets: public download metadata, source files, SVG accessibility, registry mapping, and canonical lesson usage are consistent.`);
