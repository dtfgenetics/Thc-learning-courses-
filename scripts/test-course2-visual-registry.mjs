import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const registry = readJson('visuals/COURSE2-ASSET-REGISTRY.json');

assert.equal(registry.courseId, 'COURSE-LH-TECH1-002');
assert.equal(registry.policy?.expandable, true, 'Course 2 visual registry must remain expandable');
assert.equal(registry.policy?.maximumAssetCount, null, 'Course 2 visual registry must not impose an artificial asset maximum');

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.ok(produced.length >= 3, 'Course 2 visual learning batch 1 requires at least three produced learner assets');
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length, 'Course 2 produced visual ids must be unique');
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length, 'Course 2 produced learner paths must be unique');

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-002-[0-9]{3}$/, `${asset.id ?? '<missing>'}: invalid Course 2 visual id`);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course2\/[A-Za-z0-9._-]+\.svg$/i, `${asset.id}: invalid Course 2 learnerPath`);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course2\/[A-Za-z0-9._-]+\.svg$/i, `${asset.id}: invalid Course 2 sourcePath`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0, `${asset.id}: primaryLessons must be non-empty`);
  assert.ok(Array.isArray(asset.objectiveIds) && asset.objectiveIds.length > 0, `${asset.id}: objectiveIds must be non-empty`);
  assert.ok(typeof asset.title === 'string' && asset.title.trim(), `${asset.id}: title is required`);
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim(), `${asset.id}: purpose is required`);
  assert.ok(typeof asset.version === 'string' && /^\d+\.\d+\.\d+$/.test(asset.version), `${asset.id}: semantic version is required`);

  const expectedDownload = `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`;
  assert.equal(asset.publicDownloadUrl, expectedDownload, `${asset.id}: publicDownloadUrl must use the canonical main-branch raw path`);
  assert.equal(asset.learnerPath, `/${asset.sourcePath.replace(/^apps\/web\/public\//, '')}`, `${asset.id}: public learner path must match source path`);

  const source = path.join(root, asset.sourcePath);
  assert.ok(fs.existsSync(source), `${asset.id}: public source asset is missing`);
  const svg = fs.readFileSync(source, 'utf8');
  assert.match(svg, /<svg[\s>]/, `${asset.id}: source must contain SVG markup`);
  assert.match(svg, /<title[\s>]/, `${asset.id}: SVG must include an accessible <title>`);
  assert.match(svg, /<desc[\s>]/, `${asset.id}: SVG must include an accessible <desc>`);
  assert.match(svg, /viewBox=/, `${asset.id}: SVG must use a viewBox for responsive rendering`);
}

for (const lessonNumber of ['01', '02', '03', '04']) {
  const lesson = readJson(`content/lessons/LESSON-LH-TECH1-002-${lessonNumber}.json`);
  for (const block of lesson.content?.blocks ?? []) {
    if (block.type !== 'image' || !block.assetId) continue;
    const asset = registryById.get(block.assetId);
    assert.ok(asset, `${lesson.id}: image block references missing/unproduced Course 2 asset ${block.assetId}`);
    assert.equal(block.src, asset.learnerPath, `${lesson.id}: ${block.assetId} src must match registry learnerPath`);
    assert.ok(typeof block.alt === 'string' && block.alt.trim().length >= 30, `${lesson.id}: ${block.assetId} needs meaningful learner-facing alt text`);
    assert.ok(typeof block.caption === 'string' && block.caption.trim(), `${lesson.id}: ${block.assetId} needs a learner-facing caption`);
    usedAssetIds.add(block.assetId);
  }
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced Course 2 asset is registered but not mapped into a canonical lesson`);
  for (const lessonId of asset.primaryLessons) {
    const lessonPath = path.join(root, 'content/lessons', `${lessonId}.json`);
    assert.ok(fs.existsSync(lessonPath), `${asset.id}: primary lesson ${lessonId} does not exist`);
  }
}

console.log(`Course 2 visual delivery contract passed for ${produced.length} produced learner assets: accessibility, responsive SVG structure, public paths, registry metadata and lesson usage are consistent.`);
