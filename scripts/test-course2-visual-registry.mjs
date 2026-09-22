import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const registry = readJson('visuals/COURSE2-ASSET-REGISTRY.json');

assert.equal(registry.courseId, 'COURSE-LH-TECH1-002');
assert.equal(registry.policy?.expandable, true);
assert.equal(registry.policy?.maximumAssetCount, null);
assert.ok(registry.driveStorage?.folderId);
assert.deepEqual(registry.policy?.productionInstructionalFormats, ['png','webp','jpeg','jpg']);
assert.equal(registry.policy?.svgProductionTarget, false);
assert.equal(registry.policy?.legacySvgCompatibilityAllowed, true);
assert.equal(registry.policy?.rasterReplacementRequired, true);

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.ok(produced.length >= 10, 'Course 2 photo-evidence practice batch requires at least ten produced learner assets');
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length);
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length);

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

function webpDimensions(buffer) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', 'WebP candidate must use a RIFF container');
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', 'WebP candidate must have a WEBP signature');
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'VP8L', 'Course 2 candidates must use lossless WebP encoding');
  assert.equal(buffer[20], 0x2f, 'Lossless WebP candidate is missing its VP8L signature byte');
  const bits = buffer.readUInt32LE(21);
  return {
    width: (bits & 0x3fff) + 1,
    height: ((bits >>> 14) & 0x3fff) + 1
  };
}

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-002-[0-9]{3}$/);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course2\/[A-Za-z0-9._-]+\.svg$/i);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course2\/[A-Za-z0-9._-]+\.svg$/i);
  assert.ok(['embedded-visual', 'downloadable-practice'].includes(asset.deliveryType), `${asset.id}: unsupported deliveryType`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0);
  assert.ok(Array.isArray(asset.objectiveIds) && asset.objectiveIds.length > 0);
  assert.ok(typeof asset.title === 'string' && asset.title.trim());
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim());
  assert.ok(/^\d+\.\d+\.\d+$/.test(asset.version));
  assert.equal(asset.driveMirrorStatus, 'mirrored', `${asset.id}: produced assets must be mirrored before merge`);
  assert.ok(asset.driveFileId && asset.driveFileUrl, `${asset.id}: mirrored asset requires Drive metadata`);
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

  const replacement = asset.rasterReplacement;
  assert.equal(replacement?.status, 'owner-approved-production-release', `${asset.id}: raster replacement must record owner-approved academic release`);
  assert.match(replacement?.candidateSourcePath ?? '', /^apps\/web\/public\/assets\/course2\/[A-Za-z0-9._-]+\.webp$/i);
  assert.equal(replacement?.generatedFrom, asset.sourcePath, `${asset.id}: raster provenance must identify its SVG baseline`);
  assert.equal(replacement?.encoding, 'lossless-webp');
  assert.equal(replacement?.releaseApproved, false, `${asset.id}: deterministic rendering is not release approval`);

  const sourceBuffer = fs.readFileSync(source);
  const candidateBuffer = fs.readFileSync(path.join(root, replacement.candidateSourcePath));
  assert.equal(sha256(sourceBuffer), replacement.sourceSha256, `${asset.id}: source digest drift`);
  assert.equal(sha256(candidateBuffer), replacement.candidateSha256, `${asset.id}: candidate digest drift`);
  assert.equal(candidateBuffer.length, replacement.bytes, `${asset.id}: candidate byte count drift`);
  const dimensions = webpDimensions(candidateBuffer);
  assert.deepEqual(dimensions, replacement.pixelDimensions, `${asset.id}: candidate dimension metadata drift`);
  assert.ok(Math.min(dimensions.width, dimensions.height) >= 1600, `${asset.id}: candidate shortest side must be at least 1600 px`);
}

for (const lessonNumber of ['01','02','03','04']) {
  const lesson = readJson(`content/lessons/LESSON-LH-TECH1-002-${lessonNumber}.json`);
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
      assert.equal(block.href, asset.learnerPath, `${lesson.id}: worksheet href must match registry learnerPath`);
      assert.ok(typeof block.body === 'string' && block.body.trim().length >= 30);
      assert.ok(typeof block.label === 'string' && block.label.trim());
      usedAssetIds.add(block.extensions.assetId);
    }
  }
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced asset is not reachable from a canonical lesson`);
  for (const lessonId of asset.primaryLessons) assert.ok(fs.existsSync(path.join(root, 'content/lessons', `${lessonId}.json`)));
}

console.log(`Course 2 learner-asset contract passed for ${produced.length} legacy SVG compatibility assets and ${produced.length} high-resolution lossless WebP candidates; learner cutover remains fail-closed pending human QA.`);
