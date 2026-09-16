import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const registry = readJson('visuals/COURSE6-ASSET-REGISTRY.json');

assert.equal(registry.courseId, 'COURSE-LH-TECH1-006');
assert.equal(registry.policy?.expandable, true);
assert.equal(registry.policy?.maximumAssetCount, null);
assert.equal(registry.driveStorage?.folderId, '1XeNnrsbbKU7pCslrxKKXmkxgb3vkF8Wq');
assert.equal(registry.driveStorage?.mirrorStatus, 'folder-created-assets-pending');

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
const embedded = produced.filter((asset) => asset.deliveryType === 'embedded-visual');
const downloads = produced.filter((asset) => asset.deliveryType === 'downloadable-practice');
assert.equal(produced.length, 8, `Course 6 learner layer requires eight produced assets; found ${produced.length}`);
assert.equal(embedded.length, 5, `Course 6 requires five embedded visuals; found ${embedded.length}`);
assert.equal(downloads.length, 3, `Course 6 requires three downloadable practice assets; found ${downloads.length}`);
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length);
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length);

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-006-[0-9]{3}$/);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course6\/[A-Za-z0-9._-]+\.svg$/i);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course6\/[A-Za-z0-9._-]+\.svg$/i);
  assert.ok(['embedded-visual', 'downloadable-practice'].includes(asset.deliveryType), `${asset.id}: unsupported deliveryType`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0);
  assert.ok(Array.isArray(asset.objectiveIds) && asset.objectiveIds.length > 0);
  assert.ok(Array.isArray(asset.references) && asset.references.length > 0);
  assert.ok(typeof asset.title === 'string' && asset.title.trim());
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim());
  assert.ok(/^\d+\.\d+\.\d+$/.test(asset.version));
  assert.equal(asset.driveMirrorStatus, 'pending', `${asset.id}: Drive mirror must remain truthful until the file upload is verified`);

  const expectedDownload = `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`;
  assert.equal(asset.publicDownloadUrl, expectedDownload);
  assert.equal(asset.learnerPath, `/${asset.sourcePath.replace(/^apps\/web\/public\//, '')}`);

  const source = path.join(root, asset.sourcePath);
  assert.ok(fs.existsSync(source), `${asset.id}: public source asset missing`);
  const svg = fs.readFileSync(source, 'utf8');
  assert.match(svg, /<svg[\s>]/);
  assert.match(svg, /<title[\s>]/);
  assert.match(svg, /<desc[\s>]/);
  assert.match(svg, /viewBox=/);
}

for (const lessonNumber of ['01', '02', '03', '04']) {
  const lesson = readJson(`content/lessons/LESSON-LH-TECH1-006-${lessonNumber}.json`);
  let imageCount = 0;
  for (const block of lesson.content?.blocks ?? []) {
    if (block.type === 'image' && block.assetId) {
      const asset = registryById.get(block.assetId);
      assert.ok(asset, `${lesson.id}: missing image asset ${block.assetId}`);
      assert.equal(asset.deliveryType, 'embedded-visual');
      assert.equal(block.src, asset.learnerPath);
      assert.ok(typeof block.alt === 'string' && block.alt.trim().length >= 30);
      assert.ok(typeof block.caption === 'string' && block.caption.trim());
      usedAssetIds.add(block.assetId);
      imageCount++;
    }
    if (block.type === 'resource' && block.extensions?.assetId) {
      const asset = registryById.get(block.extensions.assetId);
      assert.ok(asset, `${lesson.id}: missing downloadable asset ${block.extensions.assetId}`);
      assert.equal(asset.deliveryType, 'downloadable-practice');
      assert.equal(block.href, asset.learnerPath);
      assert.ok(typeof block.body === 'string' && block.body.trim().length >= 30);
      assert.ok(typeof block.label === 'string' && block.label.trim());
      usedAssetIds.add(block.extensions.assetId);
    }
  }
  assert.ok(imageCount >= 1, `${lesson.id}: every Course 6 lesson requires at least one embedded teaching visual`);
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced asset is not reachable from a canonical Course 6 lesson`);
  for (const lessonId of asset.primaryLessons) {
    assert.ok(fs.existsSync(path.join(root, 'content/lessons', `${lessonId}.json`)), `${asset.id}: primary lesson missing`);
  }
}

const course = readJson('content/courses/COURSE-LH-TECH1-006.json');
assert.equal(course.extensions?.learnerAssetLayerBuilt, true);
assert.equal(course.extensions?.visualRegistry, 'visuals/COURSE6-ASSET-REGISTRY.json');
assert.equal(course.extensions?.producedVisualCount, 5);
assert.equal(course.extensions?.downloadablePracticeAssetCount, 3);
assert.equal(course.extensions?.totalLearnerAssetCount, 8);
assert.equal(course.extensions?.independentProductReleaseAuthorityConferred, false);

console.log('Course 6 learner-asset contract passed for eight public, accessible and lesson-reachable assets. The controlled Drive folder exists; individual file mirroring remains explicitly pending until verified.');
