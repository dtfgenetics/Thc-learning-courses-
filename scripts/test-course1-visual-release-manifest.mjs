import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const manifest = readJson('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');
const coverage = readJson('visuals/COURSE1-VISUAL-CONCEPT-COVERAGE.json');
const registry = readJson('visuals/ASSET-REGISTRY.json');
const pngQaPath = path.join(root, 'visuals/COURSE1-PNG-QA-13-18.json');
const pngQa = fs.existsSync(pngQaPath) ? JSON.parse(fs.readFileSync(pngQaPath, 'utf8')) : null;

const courseId = 'COURSE-LH-TECH1-001';
assert.equal(manifest.courseId, courseId, 'visual release manifest must belong to Course 1');
assert.equal(coverage.courseId, courseId, 'visual coverage map must belong to Course 1');
assert.equal(registry.courseId, courseId, 'public visual registry must belong to Course 1');
assert.equal(manifest.policy?.expandable, true, 'visual release manifest must remain expandable');
assert.equal(manifest.policy?.maximumAssetCount, null, 'visual release manifest must not impose an artificial asset maximum');

const expectedCount = manifest.policy?.expectedPrimaryConceptCount;
assert.equal(expectedCount, coverage.policy?.requiredPrimaryConceptCount, 'manifest and coverage map must agree on the current primary concept count');
assert.equal(manifest.concepts?.length, expectedCount, `visual release manifest must currently cover all ${expectedCount} primary concepts`);

const manifestIds = manifest.concepts.map((concept) => concept.conceptId);
const coverageIds = coverage.concepts.map((concept) => concept.conceptId);
assert.equal(new Set(manifestIds).size, manifestIds.length, 'visual release manifest concept IDs must be unique');
assert.deepEqual([...manifestIds].sort(), [...coverageIds].sort(), 'visual release manifest must cover exactly the canonical primary concept set');

const coverageById = new Map(coverage.concepts.map((concept) => [concept.conceptId, concept]));
const registryById = new Map((registry.assets ?? []).map((asset) => [asset.id, asset]));
const manifestById = new Map(manifest.concepts.map((concept) => [concept.conceptId, concept]));
const allowedQaStatuses = new Set(['preferred-review-candidate', 'revise-before-publication', 'pending-review', 'production-master-review-candidate', 'public-approved']);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const sorted = (values) => [...values].sort();
const learnerToSourcePath = (learnerPath) => `apps/web/public/${learnerPath.replace(/^\//, '')}`;

if (pngQa) {
  assert.equal(pngQa.courseId, courseId, 'authenticated PNG QA record must belong to Course 1');
  assert.equal(pngQa.lifecycle, 'superseded-historical-predecessor-qa', 'low-resolution v3 QA record must be explicitly historical');
  assert.equal(pngQa.currentProductionAuthority, 'visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json', 'historical QA must point to the current release authority');
  assert.match(pngQa.supersessionNote ?? '', /2400x3200 production binaries/i, 'historical QA must explain that public v3 filenames now resolve to rebuilt production binaries');
  assert.ok(Array.isArray(pngQa.assets) && pngQa.assets.length > 0, 'authenticated PNG QA record must contain reviewed assets');
  assert.equal(new Set(pngQa.assets.map((asset) => asset.conceptId)).size, pngQa.assets.length, 'authenticated PNG QA concept IDs must be unique');

  for (const qaAsset of pngQa.assets) {
    const concept = manifestById.get(qaAsset.conceptId);
    assert.ok(concept, `${qaAsset.conceptId}: authenticated PNG QA record references an unknown release concept`);
    assert.equal(qaAsset.qaStatus, 'revise-before-publication', `${qaAsset.conceptId}: historical v3 QA evidence must remain rejected`);
    assert.match(qaAsset.sha256 ?? '', /^[a-f0-9]{64}$/, `${qaAsset.conceptId}: historical QA requires SHA-256`);
    assert.ok(Number.isInteger(qaAsset.width) && qaAsset.width > 0, `${qaAsset.conceptId}: historical QA width required`);
    assert.ok(Number.isInteger(qaAsset.height) && qaAsset.height > 0, `${qaAsset.conceptId}: historical QA height required`);
    assert.equal(qaAsset.productionResolutionStatus, 'insufficient-rebuild-required', `${qaAsset.conceptId}: historical low-resolution binary must remain rejected`);
    assert.equal(concept.candidate.repositoryReviewPath, qaAsset.repositoryReviewPath, `${qaAsset.conceptId}: predecessor QA path must remain recorded`);
    assert.deepEqual(concept.candidate.observedPixelDimensions, { width: qaAsset.width, height: qaAsset.height }, `${qaAsset.conceptId}: predecessor dimensions must remain recorded`);
    assert.ok(Array.isArray(qaAsset.findings) && qaAsset.findings.length > 0, `${qaAsset.conceptId}: predecessor findings must remain recorded`);

    const rebuilt =
      concept.candidate.repositoryPath !== qaAsset.repositoryReviewPath &&
      concept.candidate.sha256 !== qaAsset.sha256;
    if (concept.releaseApproved) {
      assert.equal(rebuilt, true, `${qaAsset.conceptId}: release requires a rebuilt binary distinct from rejected v3 evidence`);
      assert.equal(concept.candidate.qaStatus, 'public-approved', `${qaAsset.conceptId}: released rebuilt binary must be public-approved`);
      assert.equal(concept.candidate.productionResolutionStatus, 'meets-production-target', `${qaAsset.conceptId}: rebuilt released binary must meet production target`);
      assert.ok(Number(concept.candidate.pixelDimensions?.width ?? 0) >= Number(pngQa.productionMasterTarget?.minimumWidth ?? 2400), `${qaAsset.conceptId}: rebuilt width below production target`);
      assert.ok(Number(concept.candidate.pixelDimensions?.height ?? 0) >= Number(pngQa.productionMasterTarget?.minimumHeight ?? 3200), `${qaAsset.conceptId}: rebuilt height below production target`);
    } else if (!rebuilt) {
      assert.notEqual(concept.candidate.qaStatus, 'public-approved', `${qaAsset.conceptId}: rejected predecessor cannot be public-approved`);
    }
  }
}

const referenceBoardIndex = readJson('visuals/COURSE1-RASTER-REFERENCE-BOARD-INDEX.json');
assert.equal(referenceBoardIndex.courseId, courseId, 'reference-board index must belong to Course 1');
assert.equal(referenceBoardIndex.boards?.length, 3, 'Course 1 reference-board index must record the three controlled source boards');
const referenceBoardIds = new Set(referenceBoardIndex.boards.map((row) => row.driveFileId));
for (const concept of manifest.concepts.slice(0, 12)) {
  assert.equal(concept.candidate?.sourceType, 'repository-built-copy-locked-production-master', `${concept.conceptId}: concepts 1-12 must now resolve to individual repository production masters`);
  assert.equal(concept.candidate?.individualProductionMasterRequired, false, `${concept.conceptId}: individual production master requirement should be satisfied`);
  assert.ok(typeof concept.candidate?.repositoryPath === 'string' && concept.candidate.repositoryPath.endsWith('.png'), `${concept.conceptId}: repository production master path required`);
  assert.ok(fs.existsSync(path.join(root, concept.candidate.repositoryPath)), `${concept.conceptId}: repository production master is missing`);
  assert.equal(concept.candidate?.pixelDimensions?.width, 2400, `${concept.conceptId}: production master width must remain 2400`);
  assert.equal(concept.candidate?.pixelDimensions?.height, 3200, `${concept.conceptId}: production master height must remain 3200`);
  assert.ok(referenceBoardIds.has(concept.candidate?.predecessorDriveFileId), `${concept.conceptId}: predecessor Drive reference must resolve through the controlled reference-board index`);
  assert.equal(concept.candidate?.predecessorReferenceBoard?.repositoryImportStatus, 'deferred-large-review-board', `${concept.conceptId}: predecessor board must remain reference-only provenance`);
  if (concept.releaseApproved) {
    assert.equal(concept.candidate.qaStatus, 'public-approved', `${concept.conceptId}: released production master must be public-approved`);
    assert.match(concept.candidate.targetPublicPath ?? '', /\.png$/i, `${concept.conceptId}: released production master must target PNG`);
    assert.ok(typeof concept.candidate.registryAssetId === 'string' && concept.candidate.registryAssetId.trim(), `${concept.conceptId}: released production master requires registry ID`);
  } else {
    assert.notEqual(concept.candidate.qaStatus, 'public-approved', `${concept.conceptId}: unreleased production master cannot be public-approved`);
  }
}

assert.equal(manifest.supportingReplacements?.length, 5, 'Course 1 release manifest must track five supporting legacy raster replacements');
for (const support of manifest.supportingReplacements ?? []) {
  assert.match(support.assetId ?? '', /^VIS-LH-TECH1-001-[0-9]{3}$/, `${support.assetId ?? '<missing>'}: invalid supporting asset ID`);
  assert.equal(typeof support.releaseApproved, 'boolean', `${support.assetId}: supporting releaseApproved must be explicit`);
  if (support.releaseApproved) {
    assert.equal(support.candidate?.qaStatus, 'public-approved', `${support.assetId}: released supporting replacement must be public-approved`);
    assert.match(support.candidate?.registryAssetId ?? '', /^VIS-LH-TECH1-001-[0-9]{3}$/, `${support.assetId}: released supporting replacement requires a registry ID`);
    assert.notEqual(support.candidate?.registryAssetId, support.assetId, `${support.assetId}: released supporting PNG must use a distinct registry ID from the retired SVG baseline`);
    const supportingReplacement = registryById.get(support.candidate.registryAssetId);
    assert.ok(supportingReplacement, `${support.assetId}: released supporting replacement is absent from the public registry`);
    assert.equal(supportingReplacement.status, 'produced', `${support.assetId}: released supporting replacement must be produced`);
    assert.equal(supportingReplacement.learnerPath, support.candidate.targetPublicPath, `${support.assetId}: supporting learner path drift`);
  } else {
    assert.notEqual(support.candidate?.qaStatus, 'public-approved', `${support.assetId}: unreleased supporting replacement cannot be public-approved`);
  }
  assert.equal(support.candidate?.sourceType, 'repository-built-copy-locked-production-master', `${support.assetId}: supporting replacement must use a repository production master`);
  assert.ok(typeof support.candidate?.repositoryPath === 'string' && support.candidate.repositoryPath.endsWith('.png'), `${support.assetId}: supporting repository path required`);
  assert.ok(fs.existsSync(path.join(root, support.candidate.repositoryPath)), `${support.assetId}: supporting production master is missing`);
  assert.equal(support.candidate?.pixelDimensions?.width, 2400, `${support.assetId}: supporting master width must remain 2400`);
  assert.equal(support.candidate?.pixelDimensions?.height, 3200, `${support.assetId}: supporting master height must remain 3200`);
  assert.match(support.candidate?.targetPublicPath ?? '', /^\/assets\/course1\/.+\.png$/, `${support.assetId}: supporting target public path required`);
}

for (const concept of manifest.concepts) {
  assert.match(concept.conceptId ?? '', /^VIS-LH-TECH1-001-[0-9]{2}-[A-Z0-9-]+$/, `${concept.conceptId ?? '<missing>'}: invalid concept ID`);

  const canonical = coverageById.get(concept.conceptId);
  assert.ok(canonical, `${concept.conceptId}: missing canonical concept coverage record`);
  assert.deepEqual(sorted(concept.lessonIds ?? []), sorted(canonical.lessonIds ?? []), `${concept.conceptId}: lesson mapping drifted from canonical concept coverage`);

  const baseline = registryById.get(concept.baseline.registryAssetId);
  assert.ok(baseline, `${concept.conceptId}: baseline registry asset ${concept.baseline.registryAssetId} is missing`);
  assert.equal(baseline.learnerPath, concept.baseline.publicAsset, `${concept.conceptId}: baseline registry learner path drifted`);
  assert.ok(fs.existsSync(path.join(root, baseline.sourcePath)), `${concept.conceptId}: baseline source file is missing`);

  if (concept.releaseApproved) {
    assert.equal(canonical.registryAssetId, concept.candidate.registryAssetId, `${concept.conceptId}: released canonical coverage must point to replacement registry asset`);
    assert.equal(canonical.publicAsset, concept.candidate.targetPublicPath, `${concept.conceptId}: released canonical coverage must point to replacement learner path`);
    assert.equal(baseline.status, 'retired', `${concept.conceptId}: superseded SVG baseline must be retained as retired provenance after cutover`);
  } else {
    assert.equal(concept.baseline?.registryAssetId, canonical.registryAssetId, `${concept.conceptId}: unreleased baseline registry asset must match canonical coverage`);
    assert.equal(concept.baseline?.publicAsset, canonical.publicAsset, `${concept.conceptId}: unreleased baseline learner path must match canonical coverage`);
    assert.equal(baseline.status, 'produced', `${concept.conceptId}: unreleased baseline must remain produced`);
  }

  assert.ok(Array.isArray(concept.lessonIds) && concept.lessonIds.length > 0, `${concept.conceptId}: at least one canonical lesson is required`);
  const resolvedObjectives = new Set();
  const resolvedReferences = new Set();
  for (const lessonId of concept.lessonIds) {
    const lessonPath = path.join(root, 'content/lessons', `${lessonId}.json`);
    assert.ok(fs.existsSync(lessonPath), `${concept.conceptId}: canonical lesson ${lessonId} is missing`);
    const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
    assert.equal(lesson.id, lessonId, `${concept.conceptId}: lesson file ID mismatch for ${lessonId}`);
    assert.ok(Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0, `${concept.conceptId}: ${lessonId} must resolve at least one controlled learning objective`);
    assert.ok(Array.isArray(lesson.references) && lesson.references.length > 0, `${concept.conceptId}: ${lessonId} must resolve at least one reference`);
    lesson.learningObjectives.forEach((id) => resolvedObjectives.add(id));
    lesson.references.forEach((id) => resolvedReferences.add(id));
  }
  assert.ok(resolvedObjectives.size > 0, `${concept.conceptId}: objective resolution failed`);
  assert.ok(resolvedReferences.size > 0, `${concept.conceptId}: reference resolution failed`);

  assert.ok(concept.candidate && typeof concept.candidate === 'object', `${concept.conceptId}: candidate metadata is required`);
  assert.ok(typeof concept.candidate.sourceType === 'string' && concept.candidate.sourceType.trim(), `${concept.conceptId}: candidate sourceType is required`);
  if(concept.candidate.sourceType==='repository-built-copy-locked-production-master'){
    assert.ok(typeof concept.candidate.repositoryPath==='string'&&concept.candidate.repositoryPath.endsWith('.png'),`${concept.conceptId}: repository production master path is required`);
    assert.ok(fs.existsSync(path.join(root,concept.candidate.repositoryPath)),`${concept.conceptId}: repository production master is missing`);
    assert.match(concept.candidate.sha256??'',/^[a-f0-9]{64}$/,`${concept.conceptId}: repository production master digest is required`);
  }else{
    assert.ok(typeof concept.candidate.sourceDriveFileId === 'string' && concept.candidate.sourceDriveFileId.trim(), `${concept.conceptId}: controlled Drive provenance is required`);
  }
  assert.ok(typeof concept.candidate.binaryState === 'string' && concept.candidate.binaryState.trim(), `${concept.conceptId}: binaryState is required`);
  assert.ok(allowedQaStatuses.has(concept.candidate.qaStatus), `${concept.conceptId}: unsupported QA status ${concept.candidate.qaStatus}`);

  assert.ok(typeof concept.accessibility?.caption === 'string' && concept.accessibility.caption.trim().length >= 30, `${concept.conceptId}: meaningful external caption is required`);
  assert.ok(typeof concept.accessibility?.learnerTextAlternative === 'string' && concept.accessibility.learnerTextAlternative.trim().length >= 60, `${concept.conceptId}: meaningful learner text alternative is required`);
  assert.notEqual(concept.accessibility.caption.trim(), concept.accessibility.learnerTextAlternative.trim(), `${concept.conceptId}: caption and text alternative must serve distinct purposes`);

  assert.equal(typeof concept.releaseApproved, 'boolean', `${concept.conceptId}: releaseApproved must be explicit`);

  if (!concept.releaseApproved) {
    assert.notEqual(concept.candidate.qaStatus, 'public-approved', `${concept.conceptId}: public-approved QA state requires releaseApproved=true`);
    continue;
  }

  assert.equal(concept.candidate.qaStatus, 'public-approved', `${concept.conceptId}: release approval requires public-approved QA status`);
  assert.match(concept.candidate.targetPublicPath ?? '', /^\/assets\/course1\/[A-Za-z0-9._-]+\.png$/, `${concept.conceptId}: approved replacement must declare a PNG learner path`);
  assert.ok(typeof concept.candidate.registryAssetId === 'string' && concept.candidate.registryAssetId.trim(), `${concept.conceptId}: approved replacement must declare its public registry asset ID`);

  const replacement = registryById.get(concept.candidate.registryAssetId);
  assert.ok(replacement, `${concept.conceptId}: approved replacement is absent from visuals/ASSET-REGISTRY.json`);
  assert.equal(replacement.status, 'produced', `${concept.conceptId}: approved replacement registry entry must be produced`);
  assert.equal(replacement.learnerPath, concept.candidate.targetPublicPath, `${concept.conceptId}: approved replacement learner path does not match the public registry`);

  const expectedSourcePath = learnerToSourcePath(concept.candidate.targetPublicPath);
  assert.equal(replacement.sourcePath, expectedSourcePath, `${concept.conceptId}: approved replacement source path does not match learner path`);
  const absoluteReplacement = path.join(root, expectedSourcePath);
  assert.ok(fs.existsSync(absoluteReplacement), `${concept.conceptId}: approved replacement binary is missing from the repository`);
  const signature = fs.readFileSync(absoluteReplacement).subarray(0, 8);
  assert.ok(signature.equals(pngSignature), `${concept.conceptId}: approved replacement is not a valid PNG binary`);

  let mappedInEveryPrimaryLesson = true;
  for (const lessonId of concept.lessonIds) {
    const lesson = readJson(`content/lessons/${lessonId}.json`);
    const matchingBlock = (lesson.content?.blocks ?? []).find((block) => block.type === 'image' && block.assetId === concept.candidate.registryAssetId);
    if (!matchingBlock || matchingBlock.src !== concept.candidate.targetPublicPath || typeof matchingBlock.alt !== 'string' || !matchingBlock.alt.trim()) {
      mappedInEveryPrimaryLesson = false;
      break;
    }
  }
  assert.ok(mappedInEveryPrimaryLesson, `${concept.conceptId}: approved replacement must be mapped with alt text in every primary canonical lesson before baseline retirement`);
}

const approvedCount = manifest.concepts.filter((concept) => concept.releaseApproved).length;
const authenticatedRejectedCount = pngQa?.assets?.length ?? 0;
console.log(`Course 1 visual release gate passed for ${manifest.concepts.length} primary concepts; ${approvedCount} replacement candidate(s) are approved, ${authenticatedRejectedCount} historical predecessor PNG candidate(s) remain explicitly rejected while rebuilt production binaries are governed separately, and all remaining candidates fail closed behind the verified SVG baseline.`);
