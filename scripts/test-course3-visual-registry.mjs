import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const registry = readJson('visuals/COURSE3-ASSET-REGISTRY.json');

assert.equal(registry.courseId, 'COURSE-LH-TECH1-003');
assert.equal(registry.policy?.expandable, true);
assert.equal(registry.policy?.maximumAssetCount, null);
assert.equal(registry.driveStorage?.folderId, '1U5aTbJBIYEJMzlp_vMYnWu5SYdlHWPqU');

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.ok(produced.length >= 6, 'Course 3 complete learner-asset layer requires at least six produced learner assets');
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length);
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length);
assert.ok(produced.filter((asset) => asset.deliveryType === 'embedded-visual').length >= 4, 'Course 3 requires visual support in all four lessons');
assert.ok(produced.filter((asset) => asset.deliveryType === 'downloadable-practice').length >= 2, 'Course 3 requires at least two downloadable practice assets');

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-003-[0-9]{3}$/);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course3\/[A-Za-z0-9._-]+\.webp$/i);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course3\/[A-Za-z0-9._-]+\.webp$/i);
  assert.ok(['embedded-visual', 'downloadable-practice'].includes(asset.deliveryType), `${asset.id}: unsupported deliveryType`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0);
  assert.ok(Array.isArray(asset.objectiveIds) && asset.objectiveIds.length > 0);
  assert.ok(Array.isArray(asset.references) && asset.references.length > 0);
  assert.ok(typeof asset.title === 'string' && asset.title.trim());
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim());
  assert.ok(/^\d+\.\d+\.\d+$/.test(asset.version));
  assert.equal(asset.assetLifecycle, 'production-raster-active');
  assert.ok(['not-recorded', 'mirrored'].includes(asset.productionRasterDriveMirrorStatus), `${asset.id}: unsupported Drive mirror state`);

  const expectedDownload = `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`;
  assert.equal(asset.publicDownloadUrl, expectedDownload);

  const rasterSource = path.join(root, asset.sourcePath);
  assert.ok(fs.existsSync(rasterSource), `${asset.id}: production WebP learner asset missing`);
  const rasterHeader = fs.readFileSync(rasterSource).subarray(0, 12);
  assert.equal(rasterHeader.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(rasterHeader.subarray(8, 12).toString('ascii'), 'WEBP');

  if (asset.nativeRaster) {
    assert.equal(asset.nativeRaster.releaseApproved, true, `${asset.id}: native raster must be owner-approved`);
    assert.equal(asset.nativeRaster.format, 'webp', `${asset.id}: native raster delivery must be WebP`);
    assert.equal(asset.nativeRaster.sourceMasterFormat, 'png', `${asset.id}: native raster master must be PNG`);
    assert.ok(Number(asset.nativeRaster.bytes) > 0, `${asset.id}: native raster byte size required`);
    assert.ok(Number(asset.nativeRaster.pixelWidth) >= 1200, `${asset.id}: native raster width is too small`);
    assert.ok(typeof asset.nativeRaster.driveFileId === 'string' && asset.nativeRaster.driveFileId, `${asset.id}: Drive web-raster mirror required`);
    assert.ok(typeof asset.nativeRaster.driveMasterFileId === 'string' && asset.nativeRaster.driveMasterFileId, `${asset.id}: Drive PNG master mirror required`);
  } else {
    assert.ok(asset.legacySource?.sourcePath?.endsWith('.svg'), `${asset.id}: legacy SVG provenance path required for converted assets`);
    assert.equal(asset.rasterReplacement?.releaseApproved, true, `${asset.id}: raster replacement must be owner-approved`);
    assert.equal(asset.rasterReplacement?.generatedFrom, asset.legacySource?.sourcePath, `${asset.id}: released raster must preserve SVG provenance`);
    assert.equal(asset.rasterReplacement?.candidateSourcePath, asset.sourcePath, `${asset.id}: candidate raster source must match active production sourcePath`);
    assert.equal(asset.learnerPath, `/${asset.rasterReplacement.candidateSourcePath.replace(/^apps\/web\/public\//, '')}`);
    const legacySource = path.join(root, asset.legacySource?.sourcePath ?? '');
    assert.ok(fs.existsSync(legacySource), `${asset.id}: legacy provenance SVG missing`);
    const svg = fs.readFileSync(legacySource, 'utf8');
    assert.match(svg, /<svg[\s>]/);
    assert.match(svg, /<title[\s>]/);
    assert.match(svg, /<desc[\s>]/);
    assert.match(svg, /viewBox=/);
  }
}

for (const lessonNumber of ['01', '02', '03', '04']) {
  const lesson = readJson(`content/lessons/LESSON-LH-TECH1-003-${lessonNumber}.json`);
  const lessonImages = (lesson.content?.blocks ?? []).filter((block) => block.type === 'image' && block.assetId);
  assert.ok(lessonImages.length >= 1, `${lesson.id}: every Course 3 lesson requires embedded visual support`);
  for (const block of lesson.content?.blocks ?? []) {
    if (block.type === 'image' && block.assetId) {
      const asset = registryById.get(block.assetId);
      assert.ok(asset, `${lesson.id}: missing image asset ${block.assetId}`);
      assert.equal(asset.deliveryType, 'embedded-visual');
      assert.equal(block.src, asset.learnerPath);
      assert.ok(typeof block.alt === 'string' && block.alt.trim().length >= 30);
      assert.ok(typeof block.caption === 'string' && block.caption.trim());
      usedAssetIds.add(block.assetId);
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
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced asset is not reachable from a canonical Course 3 lesson`);
  for (const lessonId of asset.primaryLessons) {
    assert.ok(fs.existsSync(path.join(root, 'content/lessons', `${lessonId}.json`)), `${asset.id}: primary lesson missing`);
  }
}

console.log(`Course 3 learner-asset contract passed with raster-first WebP delivery and native-raster support and preserved legacy provenance.`);
