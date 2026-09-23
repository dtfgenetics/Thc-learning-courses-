import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const registry = readJson('visuals/COURSE5-ASSET-REGISTRY.json');

assert.equal(registry.courseId, 'COURSE-LH-TECH1-005');
assert.equal(registry.policy?.expandable, true);
assert.equal(registry.policy?.maximumAssetCount, null);
assert.equal(registry.driveStorage?.folderId, '1_eEgzfbQphTKUHu28IS5YZmcNnU7o5Eo');

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
const embedded = produced.filter((asset) => asset.deliveryType === 'embedded-visual');
const downloads = produced.filter((asset) => asset.deliveryType === 'downloadable-practice');
assert.ok(produced.length >= 9, `Course 5 learner layer requires at least nine produced assets; found ${produced.length}`);
assert.ok(embedded.length >= 6, `Course 5 requires at least six embedded visuals; found ${embedded.length}`);
assert.ok(downloads.length >= 3, `Course 5 requires at least three downloadable practice assets; found ${downloads.length}`);
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length);
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length);

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-005-[0-9]{3}$/);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course5\/[A-Za-z0-9._-]+\.webp$/i);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course5\/[A-Za-z0-9._-]+\.webp$/i);
  assert.ok(['embedded-visual', 'downloadable-practice'].includes(asset.deliveryType), `${asset.id}: unsupported deliveryType`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0);
  assert.ok(Array.isArray(asset.objectiveIds) && asset.objectiveIds.length > 0);
  assert.ok(Array.isArray(asset.references) && asset.references.length > 0);
  assert.ok(typeof asset.title === 'string' && asset.title.trim());
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim());
  assert.ok(/^\d+\.\d+\.\d+$/.test(asset.version));
  assert.equal(asset.assetLifecycle, 'production-raster-active');
  assert.equal(asset.productionRasterDriveMirrorStatus, 'not-recorded');
  assert.ok(asset.legacySource?.sourcePath?.endsWith('.svg'), `${asset.id}: legacy SVG provenance path required`);

  const expectedDownload = `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`;
  assert.equal(asset.publicDownloadUrl, expectedDownload);
  assert.equal(asset.rasterReplacement?.releaseApproved, true, `${asset.id}: raster replacement must be owner-approved`);
  assert.equal(asset.rasterReplacement?.generatedFrom, asset.legacySource?.sourcePath, `${asset.id}: released raster must preserve SVG provenance`);
  assert.equal(asset.rasterReplacement?.candidateSourcePath, asset.sourcePath, `${asset.id}: candidate raster source must match active production sourcePath`);
  assert.equal(asset.learnerPath, `/${asset.rasterReplacement.candidateSourcePath.replace(/^apps\/web\/public\//, '')}`);
  const rasterSource = path.join(root, asset.rasterReplacement.candidateSourcePath);
  assert.ok(fs.existsSync(rasterSource), `${asset.id}: released WebP learner asset missing`);
  const rasterHeader = fs.readFileSync(rasterSource).subarray(0, 12);
  assert.equal(rasterHeader.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(rasterHeader.subarray(8, 12).toString('ascii'), 'WEBP');

  const source = path.join(root, asset.sourcePath);
  assert.ok(fs.existsSync(source), `${asset.id}: production raster asset missing`);
  const legacySource = path.join(root, asset.legacySource?.sourcePath ?? '');
  assert.ok(fs.existsSync(legacySource), `${asset.id}: legacy provenance SVG missing`);
  const svg = fs.readFileSync(legacySource, 'utf8');
  assert.match(svg, /<svg[\s>]/);
  assert.match(svg, /<title[\s>]/);
  assert.match(svg, /<desc[\s>]/);
  assert.match(svg, /viewBox=/);
}

for (const lessonNumber of ['01', '02', '03', '04']) {
  const lesson = readJson(`content/lessons/LESSON-LH-TECH1-005-${lessonNumber}.json`);
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
  assert.ok(imageCount >= 1, `${lesson.id}: every Course 5 lesson requires at least one embedded teaching visual`);
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced asset is not reachable from a canonical Course 5 lesson`);
  for (const lessonId of asset.primaryLessons) {
    assert.ok(fs.existsSync(path.join(root, 'content/lessons', `${lessonId}.json`)), `${asset.id}: primary lesson missing`);
  }
}

const course = readJson('content/courses/COURSE-LH-TECH1-005.json');
assert.equal(course.extensions?.pesticideApplicatorAuthorityConferred, false);
assert.equal(course.extensions?.treatmentSelectionAuthorityConferred, false);

console.log(`Course 5 learner-asset contract passed with raster-first WebP delivery and preserved SVG provenance.`);
