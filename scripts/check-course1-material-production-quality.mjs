import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const policy = readJson('visuals/COURSE1-PRODUCTION-QUALITY-POLICY.json');
const registry = readJson('visuals/ASSET-REGISTRY.json');
const release = readJson('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');
const qaPath = path.join(root, 'visuals/COURSE1-PNG-QA-13-18.json');
const authenticatedQa = fs.existsSync(qaPath) ? JSON.parse(fs.readFileSync(qaPath, 'utf8')) : null;

assert.equal(policy.courseId, 'COURSE-LH-TECH1-001');
assert.equal(registry.courseId, policy.courseId);
assert.equal(release.courseId, policy.courseId);
assert.equal(policy.rules?.technicalDeliveryIsNotProductionApproval, true);
assert.equal(policy.rules?.generatedImageTextIsNotAuthoritativeCopy, true);
assert.ok(Number.isInteger(policy.primaryInstructionalRaster?.minimumShortSidePx));
assert.ok(policy.primaryInstructionalRaster.minimumShortSidePx >= 1200);

const lessonDir = path.join(root, 'content/lessons');
const lessonFiles = fs.readdirSync(lessonDir).filter((name) => /^LESSON-LH-TECH1-001-.*\.json$/.test(name));
assert.ok(lessonFiles.length >= 18, 'Course 1 must retain the current canonical lesson set; expansion is allowed');

const placeholderPattern = /\b(?:TODO|TBD|lorem ipsum|placeholder copy|insert image here|coming soon)\b/i;
const appliedTypes = new Set(['scenario', 'activity', 'comparison', 'table', 'steps', 'document', 'image']);
let imagePlacements = 0;

for (const file of lessonFiles) {
  const lesson = JSON.parse(fs.readFileSync(path.join(lessonDir, file), 'utf8'));
  assert.equal(lesson.status, 'published', `${lesson.id}: Course 1 canonical learner lesson must remain published`);
  assert.ok(Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0, `${lesson.id}: controlled learning objective is required`);
  assert.ok(Array.isArray(lesson.references) && lesson.references.length > 0, `${lesson.id}: at least one controlled reference is required`);
  assert.ok(typeof lesson.content?.overview === 'string' && lesson.content.overview.trim().length >= 40, `${lesson.id}: meaningful learner overview is required`);
  assert.ok(!placeholderPattern.test(JSON.stringify(lesson)), `${lesson.id}: learner material contains placeholder/development copy`);

  const blocks = lesson.content?.blocks ?? [];
  assert.ok(blocks.length >= 3, `${lesson.id}: published lesson needs a substantive structured learner block set`);
  assert.ok(new Set(blocks.map((block) => block.type)).size >= 2, `${lesson.id}: published lesson must not be a single-format content dump`);
  assert.ok(blocks.some((block) => appliedTypes.has(block.type)), `${lesson.id}: at least one applied/visual learning mechanism is required`);

  for (const block of blocks) {
    if (block.type !== 'image') continue;
    imagePlacements += 1;
    assert.ok(typeof block.assetId === 'string' && block.assetId.trim(), `${lesson.id}: instructional image must have an asset ID`);
    assert.ok(typeof block.alt === 'string' && block.alt.trim().length >= 40, `${lesson.id}: instructional image needs meaningful alt text`);
    assert.ok(typeof block.caption === 'string' && block.caption.trim().length >= 20, `${lesson.id}: instructional image needs an explanatory caption`);
    assert.ok(!block.caption.includes(block.assetId), `${lesson.id}: learner caption must not expose internal asset bookkeeping`);
  }
}

assert.ok(imagePlacements > 0, 'Course 1 must contain mapped instructional visuals');

const registryIds = new Set();
for (const asset of registry.assets ?? []) {
  assert.ok(!registryIds.has(asset.id), `${asset.id}: duplicate public registry ID`);
  registryIds.add(asset.id);
  if (asset.status !== 'produced') continue;
  assert.ok(typeof asset.title === 'string' && asset.title.trim().length > 0, `${asset.id}: title required`);
  assert.ok(typeof asset.purpose === 'string' && asset.purpose.trim().length >= 30, `${asset.id}: learner purpose must be explicit`);
  assert.ok(fs.existsSync(path.join(root, asset.sourcePath)), `${asset.id}: public baseline source is missing`);
}

const approvedSourceKeys = new Set();
const releaseByConcept = new Map(release.concepts.map((concept) => [concept.conceptId, concept]));
const boardLikeName = /(?:board|sheet|montage|contact[-_ ]?sheet|grid)/i;

function pngDimensions(buffer) {
  assert.ok(buffer.length >= 24, 'PNG is too small to contain an IHDR header');
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buffer.subarray(0, 8).equals(signature), 'Invalid PNG signature');
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG must begin with IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

let approvedReplacements = 0;
for (const concept of release.concepts ?? []) {
  assert.ok(concept.candidate && typeof concept.candidate === 'object', `${concept.conceptId}: candidate metadata required`);
  const candidate = concept.candidate;
  let canonicalSourceKey;
  if (candidate.sourceType === 'repository-built-copy-locked-production-master') {
    assert.ok(typeof candidate.repositoryPath === 'string' && candidate.repositoryPath.endsWith('.png'), `${concept.conceptId}: repository-built master path required`);
    const predecessorDriveFileId = candidate.predecessorDriveFileId ?? candidate.predecessorDriveReferenceFileId;
    assert.ok(typeof predecessorDriveFileId === 'string' && predecessorDriveFileId.trim(), `${concept.conceptId}: rejected Drive predecessor ID required for provenance`);
    assert.match(candidate.sha256 ?? '', /^[a-f0-9]{64}$/, `${concept.conceptId}: repository-built master SHA-256 required`);
    const repositoryFile = path.join(root, candidate.repositoryPath);
    assert.ok(fs.existsSync(repositoryFile), `${concept.conceptId}: repository-built master is missing`);
    const actualSha256 = crypto.createHash('sha256').update(fs.readFileSync(repositoryFile)).digest('hex');
    assert.equal(actualSha256, candidate.sha256, `${concept.conceptId}: repository-built master SHA-256 mismatch`);
    canonicalSourceKey = `repository:${candidate.repositoryPath}`;
  } else {
    assert.ok(typeof candidate.sourceDriveFileId === 'string' && candidate.sourceDriveFileId.trim(), `${concept.conceptId}: canonical Drive source ID required`);
    canonicalSourceKey = `drive:${candidate.sourceDriveFileId}`;
  }
  assert.equal(typeof concept.releaseApproved, 'boolean', `${concept.conceptId}: releaseApproved must be explicit`);

  if (!concept.releaseApproved) {
    assert.notEqual(concept.candidate.qaStatus, 'public-approved', `${concept.conceptId}: public-approved QA requires release approval`);
    continue;
  }

  approvedReplacements += 1;
  assert.equal(concept.candidate.qaStatus, 'public-approved', `${concept.conceptId}: production approval requires public-approved QA`);
  assert.ok(typeof concept.candidate.fileName === 'string' && concept.candidate.fileName.trim(), `${concept.conceptId}: approved asset needs an individual file name`);
  assert.ok(!boardLikeName.test(concept.candidate.fileName), `${concept.conceptId}: generation boards/contact sheets cannot be production learner assets`);
  assert.ok(!approvedSourceKeys.has(canonicalSourceKey), `${concept.conceptId}: approved version must have one canonical source, not a reused multi-concept master`);
  approvedSourceKeys.add(canonicalSourceKey);
  assert.ok(typeof concept.candidate.targetPublicPath === 'string' && concept.candidate.targetPublicPath.startsWith('/assets/course1/'), `${concept.conceptId}: approved learner path is required`);

  const publicFile = path.join(root, 'apps/web/public', concept.candidate.targetPublicPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(publicFile), `${concept.conceptId}: approved replacement binary is missing from public assets`);

  if (/\.png$/i.test(publicFile)) {
    const { width, height } = pngDimensions(fs.readFileSync(publicFile));
    const shortSide = Math.min(width, height);
    assert.ok(shortSide >= policy.primaryInstructionalRaster.minimumShortSidePx, `${concept.conceptId}: ${width}x${height} is review resolution; primary instructional raster shortest side must be at least ${policy.primaryInstructionalRaster.minimumShortSidePx}px`);
  }
}

if (authenticatedQa) {
  assert.equal(authenticatedQa.courseId, policy.courseId);
  for (const qaAsset of authenticatedQa.assets ?? []) {
    const concept = releaseByConcept.get(qaAsset.conceptId);
    assert.ok(concept, `${qaAsset.conceptId}: authenticated QA references unknown concept`);
    const rejectedBinaryStillActive =
      concept.candidate.repositoryPath === qaAsset.repositoryReviewPath ||
      concept.candidate.sha256 === qaAsset.sha256;
    if (qaAsset.qaStatus !== 'public-approved' && rejectedBinaryStillActive) {
      assert.equal(concept.releaseApproved, false, `${qaAsset.conceptId}: rejected/revise-before-publication binary cannot be release-approved`);
    }
    const shortSide = Math.min(Number(qaAsset.width ?? 0), Number(qaAsset.height ?? 0));
    if (shortSide > 0 && shortSide < policy.primaryInstructionalRaster.minimumShortSidePx && rejectedBinaryStillActive) {
      assert.equal(concept.releaseApproved, false, `${qaAsset.conceptId}: low-resolution authenticated binary must remain quarantined`);
    }
    if (concept.releaseApproved && !rejectedBinaryStillActive) {
      assert.equal(concept.candidate.qaStatus, 'public-approved', `${qaAsset.conceptId}: released replacement must be public-approved`);
      assert.ok(
        Math.min(Number(concept.candidate.pixelDimensions?.width ?? 0), Number(concept.candidate.pixelDimensions?.height ?? 0)) >= policy.primaryInstructionalRaster.minimumShortSidePx,
        `${qaAsset.conceptId}: released replacement must meet production raster size`
      );
    }
  }
}

const richContent = readText('apps/web/public/rich-content.js');
assert.ok(!richContent.includes('pieces.push(`Asset ${assetId}`)'), 'Learner figure captions must not expose internal asset IDs');
assert.match(richContent, /dataset\.assetId/, 'Internal asset ID should remain available as non-visible DOM metadata');
assert.match(richContent, /Sources & evidence/, 'Raw reference IDs must be moved behind an expandable Sources & evidence control');
assert.match(richContent, /Open full-size visual/, 'Learners need a clear full-size visual path');

console.log(`Course 1 material production-quality gate passed: ${lessonFiles.length} published lessons, ${imagePlacements} instructional image placements, ${approvedReplacements} production-approved replacement visual(s). Public baseline assets remain distinct from production approval.`);
