import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'visuals/ASSET-REGISTRY.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const richContent = fs.readFileSync(path.join(root, 'apps/web/public/rich-content.js'), 'utf8');

assert.equal(registry.courseId, 'COURSE-LH-TECH1-001');
assert.equal(registry.policy?.expandable, true, 'Course 1 visual registry must remain expandable');
assert.equal(registry.policy?.maximumAssetCount, null, 'Course 1 visual registry must not impose an artificial asset maximum');

const produced = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
assert.ok(produced.length > 0, 'Course 1 must have at least one produced learner visual');
assert.equal(new Set(produced.map((asset) => asset.id)).size, produced.length, 'produced visual ids must be unique');
assert.equal(new Set(produced.map((asset) => asset.learnerPath)).size, produced.length, 'produced learner paths must be unique');

const registryById = new Map(produced.map((asset) => [asset.id, asset]));
const usedAssetIds = new Set();
const supportedExtension = /\.(?:svg|png|jpe?g|webp)$/i;
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function verifyAssetFile(asset, absoluteSource) {
  const extension = path.extname(asset.sourcePath).toLowerCase();
  if (extension === '.svg') {
    const svg = fs.readFileSync(absoluteSource, 'utf8');
    assert.match(svg, /<svg[\s>]/, `${asset.id}: source asset must contain SVG markup`);
    assert.match(svg, /<title[\s>]/, `${asset.id}: SVG source asset must include an accessible <title>`);
    assert.match(svg, /<desc[\s>]/, `${asset.id}: SVG source asset must include an accessible <desc>`);
    return;
  }

  const buffer = fs.readFileSync(absoluteSource);
  assert.ok(buffer.length > 12, `${asset.id}: raster source asset is unexpectedly small`);
  if (extension === '.png') {
    assert.ok(buffer.subarray(0, 8).equals(pngSignature), `${asset.id}: PNG source asset has an invalid signature`);
    return;
  }
  if (extension === '.jpg' || extension === '.jpeg') {
    assert.ok(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff, `${asset.id}: JPEG source asset has an invalid signature`);
    return;
  }
  if (extension === '.webp') {
    assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${asset.id}: WebP source asset is missing RIFF signature`);
    assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${asset.id}: WebP source asset is missing WEBP signature`);
  }
}

for (const asset of produced) {
  assert.match(asset.id ?? '', /^VIS-LH-TECH1-001-[0-9]{3}$/, `${asset.id ?? '<missing>'}: invalid visual id`);
  assert.match(asset.learnerPath ?? '', /^\/assets\/course1\/[A-Za-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i, `${asset.id}: invalid learnerPath`);
  assert.match(asset.sourcePath ?? '', /^apps\/web\/public\/assets\/course1\/[A-Za-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i, `${asset.id}: invalid sourcePath`);
  assert.ok(supportedExtension.test(asset.sourcePath), `${asset.id}: unsupported learner visual format`);
  assert.ok(Array.isArray(asset.primaryLessons) && asset.primaryLessons.length > 0, `${asset.id}: primaryLessons must be non-empty`);
  assert.ok(typeof asset.title === 'string' && asset.title.trim().length > 0, `${asset.id}: title is required`);
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim().length > 0, `${asset.id}: purpose is required`);

  const expectedDownload = `https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/${asset.sourcePath}`;
  assert.equal(asset.publicDownloadUrl, expectedDownload, `${asset.id}: publicDownloadUrl must point to the canonical main-branch source asset`);

  const absoluteSource = path.join(root, asset.sourcePath);
  assert.ok(fs.existsSync(absoluteSource), `${asset.id}: source asset does not exist at ${asset.sourcePath}`);
  verifyAssetFile(asset, absoluteSource);

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

assert.match(richContent, /COURSE1_PRIMARY_VISUAL_OVERRIDES/, 'controlled Course 1 learner visual override registry must exist in the shared renderer');
const overrideBlock = richContent.match(/export const COURSE1_PRIMARY_VISUAL_OVERRIDES = Object\.freeze\(\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
assert.ok(overrideBlock, 'Course 1 visual override registry must be parseable for raster-policy QA');
assert.equal(/src:\s*['"][^'"]+\.svg['"]/i.test(overrideBlock), false, 'Course 1 learner visual overrides must not point back to retired SVG assets');
for (const requiredRaster of ['equipment-preuse-v3.png','operator-vs-maintenance-v3.png','fault-report-v3.png','record-correction-v3.png','shift-handoff-v3.png','integrated-workflow-v3.png']) {
  assert.ok(overrideBlock.includes(requiredRaster), `Course 1 learner visual override missing approved raster: ${requiredRaster}`);
}

for (const asset of produced) {
  if (!usedAssetIds.has(asset.id) && richContent.includes(`assetId: '${asset.id}'`) && richContent.includes(`src: '${asset.learnerPath}'`)) {
    usedAssetIds.add(asset.id);
  }
}

for (const asset of produced) {
  assert.ok(usedAssetIds.has(asset.id), `${asset.id}: produced learner asset is registered but not mapped into a canonical lesson or controlled learner-render override`);
  for (const lessonId of asset.primaryLessons) {
    const lessonPath = path.join(root, 'content/lessons', `${lessonId}.json`);
    assert.ok(fs.existsSync(lessonPath), `${asset.id}: primary lesson ${lessonId} does not exist`);
  }
}

console.log(`Course 1 visual delivery contract passed for ${produced.length} produced learner assets: public download metadata, source files, file-format integrity, accessibility, registry mapping, and canonical/controlled learner usage are consistent.`);

await import('./test-course1-svg-drive-provenance.mjs');
await import('./test-course1-visual-release-manifest.mjs');
