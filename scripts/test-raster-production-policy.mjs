import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const raster=['png','webp','jpeg','jpg'];
const releaseRaster=['png','webp','jpg','jpeg'];

for(let n=2;n<=6;n++){
  const registry=read(`visuals/COURSE${n}-ASSET-REGISTRY.json`);
  assert.equal(registry.policy?.svgProductionTarget,false,`Course ${n}: SVG must not be the production target`);
  assert.equal(registry.policy?.legacySvgCompatibilityAllowed,false,`Course ${n}: SVG must not remain an active learner compatibility path after raster cutover`);
  assert.equal(registry.policy?.rasterReplacementRequired,false,`Course ${n}: raster replacement is complete`);
  assert.deepEqual(registry.policy?.productionInstructionalFormats,raster,`Course ${n}: production raster format policy drift`);
  for(const asset of registry.assets??[]){
    assert.equal(path.extname(asset.sourcePath??'').toLowerCase(),'.webp',`${asset.id}: active production source must be WebP`);
    assert.equal(asset.assetLifecycle,'production-raster-active',`${asset.id}: raster lifecycle drift`);
    if(asset.nativeRaster){
      assert.equal(asset.nativeRaster.status,'owner-approved-production-release',`${asset.id}: native raster lifecycle drift`);
      assert.equal(asset.nativeRaster.releaseApproved,true,`${asset.id}: owner-approved native raster release required`);
      assert.equal(asset.nativeRaster.format,'webp',`${asset.id}: native delivery format drift`);
      assert.equal(asset.nativeRaster.sourceMasterFormat,'png',`${asset.id}: native master format drift`);
    }else{
      assert.equal(asset.rasterReplacement?.status,'owner-approved-production-release',`${asset.id}: released raster lifecycle drift`);
      assert.equal(asset.rasterReplacement?.releaseApproved,true,`${asset.id}: owner-approved academic raster release required`);
      assert.deepEqual(asset.rasterReplacement?.allowedFormats,raster,`${asset.id}: raster format policy drift`);
      assert.equal(asset.rasterReplacement?.candidateSourcePath,asset.sourcePath,`${asset.id}: active source must match released raster candidate`);
      assert.match(asset.legacySource?.sourcePath??'',new RegExp(`^apps/web/public/assets/course${n}/[A-Za-z0-9._-]+\\.svg$`,'i'),`${asset.id}: SVG provenance source required`);
      assert.equal(asset.rasterReplacement?.generatedFrom,asset.legacySource?.sourcePath,`${asset.id}: raster provenance must point to retired SVG source`);
      assert.equal(asset.rasterReplacement?.releaseGate,'owner-approved-academic-release-with-machine-integrity-controls',`${asset.id}: released machine-integrity gate drift`);
    }
  }
}

const course1Registry=read('visuals/ASSET-REGISTRY.json');
const course1Svg=(course1Registry.assets??[]).filter(asset=>path.extname(asset.sourcePath??'').toLowerCase()==='.svg');
assert.equal(course1Svg.length,20,'Course 1: expected 20 unique governed SVG compatibility baselines');
for(const asset of course1Svg){
  assert.equal(asset.assetLifecycle,'legacy-svg-compatibility-baseline',`${asset.id}: Course 1 SVG lifecycle must be compatibility baseline`);
  assert.equal(asset.status,'retired',`${asset.id}: released Course 1 SVG baseline must be retained as retired provenance`);
  assert.equal(asset.rasterReplacement?.status,'released',`${asset.id}: Course 1 raster replacement lifecycle drift`);
  assert.equal(asset.rasterReplacement?.releaseApproved,true,`${asset.id}: Course 1 governed replacement must record owner-approved release`);
  assert.match(asset.rasterReplacement?.releasedRegistryAssetId??'',/^VIS-LH-TECH1-001-[0-9]{3}$/,`${asset.id}: released replacement registry ID required`);
  assert.equal(asset.rasterReplacement?.pixelDimensions?.width,2400,`${asset.id}: Course 1 master width drift`);
  assert.equal(asset.rasterReplacement?.pixelDimensions?.height,3200,`${asset.id}: Course 1 master height drift`);
  assert.equal(asset.rasterReplacement?.encoding,'png',`${asset.id}: Course 1 master must remain PNG`);
}

const tech2=read('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
assert.equal(tech2.policy?.productionFormatPolicy?.svgReleaseAllowed,false,'Technician II: SVG release must remain prohibited');
assert.deepEqual(tech2.policy?.productionFormatPolicy?.allowedReleasedExtensions,releaseRaster);
for(const course of tech2.courses??[]){
  for(const concept of course.concepts??[]){
    assert.equal(concept.rasterReplacement?.status,'owner-approved-production-release',`${concept.conceptId}: Technician II released lifecycle drift`);
    assert.equal(concept.rasterReplacement?.releaseApproved,true,`${concept.conceptId}: owner-approved academic raster release required`);
    assert.equal(concept.qaApproved,true,`${concept.conceptId}: released concept must record QA approval`);
    assert.match(concept.targetPublicPath??'',/^\/assets\/tech2\/.+\.webp$/i,`${concept.conceptId}: released learner target must be WebP`);
    assert.match(concept.sourcePath??'',/^apps\/web\/public\/assets\/tech2\/.+\.webp$/i,`${concept.conceptId}: released source path must be WebP`);
  }
}

const replacementProgram=read('registry/raster-replacement-program.json');
assert.equal(replacementProgram.summary?.totalGovernedReplacements,96,'Raster program total must reconcile to 96 governed replacements');
assert.equal(replacementProgram.summary?.technicianI,60,'Technician I raster program must reconcile to 60 replacements');
assert.equal(replacementProgram.summary?.technicianII,36,'Technician II raster program must reconcile to 36 replacements');
assert.equal(replacementProgram.summary?.releasedRasterReplacements,96,'All 96 governed raster replacements must record owner-approved academic release');
assert.equal(replacementProgram.summary?.openRasterReplacements,0,'No governed raster replacement may remain open after owner-approved cutover');
assert.equal(replacementProgram.summary?.producedRasterCandidates,96,'All governed raster replacement candidates must be machine-produced');
assert.equal(replacementProgram.summary?.remainingRasterProduction,0,'Raster production backlog must be zero once all governed binaries exist');


const course1Build=read('visuals/COURSE1-RASTER-BUILD-MANIFEST-001-014.json');
assert.equal(course1Build.releaseApproved,false,'Course 1 build manifest cannot imply release approval');
assert.equal(course1Build.governedReplacementCount,14,'Course 1 build must contain fourteen governed legacy replacements');
assert.equal(course1Build.supplementalPrimaryConceptCount,3,'Course 1 build must contain three supplemental primary concept masters');
assert.equal(course1Build.totalCandidateCount,17,'Course 1 completion build must contain seventeen new candidates');
assert.equal(course1Build.assets?.length,17,'Course 1 build manifest row count drift');

const pngDimensions=(file)=>{
  const bytes=fs.readFileSync(path.join(root,file));
  assert.ok(bytes.length>=24,`${file}: PNG too small to contain IHDR`);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${file}: invalid PNG signature`);
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};
};

for(const row of course1Build.assets??[]){
  assert.equal(row.encoding,'png',`${row.recordId}: completion candidate must be PNG`);
  assert.equal(row.releaseApproved,false,`${row.recordId}: candidate production cannot imply approval`);
  assert.equal(row.pixelDimensions?.width,2400,`${row.recordId}: manifest width drift`);
  assert.equal(row.pixelDimensions?.height,3200,`${row.recordId}: manifest height drift`);
  const actual=pngDimensions(row.file);
  assert.equal(actual.width,2400,`${row.recordId}: binary width drift`);
  assert.equal(actual.height,3200,`${row.recordId}: binary height drift`);
  assert.equal(actual.bytes,row.bytes,`${row.recordId}: binary byte count drift`);
}

const course1Release=read('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');
assert.equal(course1Release.policy?.expectedPrimaryConceptCount,18,'Course 1 primary visual concept count must remain 18');
assert.equal(course1Release.concepts?.length,18,'Course 1 release manifest must contain 18 primary concepts');
assert.equal(course1Release.supportingReplacements?.length,5,'Course 1 release manifest must contain five supporting legacy replacements');
assert.equal(course1Release.productionMasterProgress?.produced,18,'All Course 1 primary production masters must exist');
assert.equal(course1Release.productionMasterProgress?.remaining,0,'No primary Course 1 production master may remain unbuilt');
assert.equal(course1Release.productionMasterProgress?.supportingProduced,5,'All five supporting Course 1 raster replacements must exist');
assert.equal(course1Release.productionMasterProgress?.supportingRemaining,0,'No supporting Course 1 raster production may remain open');
assert.equal(course1Release.productionMasterProgress?.releaseApproved,18,'All 18 primary Course 1 rasters must record owner-approved release');
assert.equal(course1Release.productionMasterProgress?.supportingReleaseApproved,5,'All five supporting Course 1 rasters must record owner-approved release');

for(const row of [...(course1Release.concepts??[]),...(course1Release.supportingReplacements??[])]){
  assert.equal(row.releaseApproved,true,`${row.conceptId??row.assetId}: owner-approved Course 1 release must be recorded`);
  assert.equal(row.candidate?.qaStatus,'public-approved',`${row.conceptId??row.assetId}: released raster must be public-approved`);
  assert.match(row.candidate?.registryAssetId??'',/^VIS-LH-TECH1-001-[0-9]{3}$/,`${row.conceptId??row.assetId}: released raster registry ID required`);
  assert.match(row.candidate?.repositoryPath??'',/^visuals\/review-candidates\/course1\/production-masters\/.+\.png$/i,`${row.conceptId??row.assetId}: governed repository candidate path missing`);
  assert.match(row.candidate?.targetPublicPath??'',/^\/assets\/course1\/.+\.(png|webp|jpe?g)$/i,`${row.conceptId??row.assetId}: governed public raster target missing`);
  assert.equal(row.candidate?.pixelDimensions?.width,2400,`${row.conceptId??row.assetId}: release candidate width drift`);
  assert.equal(row.candidate?.pixelDimensions?.height,3200,`${row.conceptId??row.assetId}: release candidate height drift`);
}

const course1Staging=read('visuals/COURSE1-PNG-DEPLOYMENT-STAGING.json');
assert.equal(course1Staging.candidates?.length,23,'Course 1 staging registry must enumerate 18 primary + 5 supporting candidates');
assert.equal(new Set(course1Staging.candidates.map(row=>row.assetId)).size,23,'Course 1 staging candidate IDs must be unique');
for(const row of course1Staging.candidates??[]){
  const expectedLock=/^VIS-LH-TECH1-001-1[3-8]-/.test(row.assetId)
    ? 'visuals/COURSE1-VISUAL-COPY-LOCK-13-18.json'
    : 'visuals/COURSE1-RASTER-COPY-LOCK-001-014.json';
  assert.equal(row.copyLock,expectedLock,`${row.assetId}: copy-lock attribution drift`);
}

const deployWorkflow=fs.readFileSync(path.join(root,'.github/workflows/course1-png-deploy.yml'),'utf8');
assert.match(deployWorkflow,/supportingReplacements/,'Course 1 deployment workflow must include supporting replacements');
assert.match(deployWorkflow,/releaseApproved === true/,'Course 1 deployment workflow must stay explicitly approval-gated');
assert.doesNotMatch(deployWorkflow,/drive\.usercontent\.google\.com/i,'Course 1 deployment workflow must not reintroduce direct Drive candidate downloads');

const expectedTech1Counts=new Map([[1,20],[2,10],[3,6],[4,7],[5,9],[6,8]]);
for(const row of replacementProgram.technicianI??[]){
  const n=Number(row.courseId?.slice(-3));
  assert.equal(row.count,expectedTech1Counts.get(n),`${row.courseId}: raster queue count drift`);
}
const expectedTech2Counts=new Map([[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,8]]);
for(const row of replacementProgram.technicianII??[]){
  const n=Number(row.courseId?.slice(-3));
  assert.equal(row.count,expectedTech2Counts.get(n),`${row.courseId}: raster queue count drift`);
}

console.log('Raster production policy: PASS (96/96 governed candidates produced and owner-approved for academic raster release; professional credential issuance remains separately controlled).');
