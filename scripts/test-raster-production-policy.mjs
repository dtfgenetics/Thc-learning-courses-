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
  assert.equal(registry.policy?.legacySvgCompatibilityAllowed,true,`Course ${n}: current SVG baselines must stay explicitly compatibility-only until replaced`);
  assert.equal(registry.policy?.rasterReplacementRequired,true,`Course ${n}: raster replacement must be required`);
  assert.deepEqual(registry.policy?.productionInstructionalFormats,raster,`Course ${n}: production raster format policy drift`);
  for(const asset of registry.assets??[]){
    if(path.extname(asset.sourcePath??'').toLowerCase()!=='.svg') continue;
    assert.equal(asset.assetLifecycle,'legacy-svg-compatibility-baseline',`${asset.id}: SVG lifecycle must be compatibility baseline`);
    const expectedStatus='candidate-produced-human-qa-required';
    assert.equal(asset.rasterReplacement?.status,expectedStatus,`${asset.id}: raster replacement lifecycle drift`);
    assert.deepEqual(asset.rasterReplacement?.allowedFormats,raster,`${asset.id}: raster format policy drift`);
    assert.match(asset.rasterReplacement?.releaseGate??'',/factual.*accessibility.*responsive.*public-path/i,`${asset.id}: replacement release gate incomplete`);
  }
}

const course1Registry=read('visuals/ASSET-REGISTRY.json');
const course1Svg=(course1Registry.assets??[]).filter(asset=>path.extname(asset.sourcePath??'').toLowerCase()==='.svg');
assert.equal(course1Svg.length,20,'Course 1: expected 20 unique governed SVG compatibility baselines');
for(const asset of course1Svg){
  assert.equal(asset.assetLifecycle,'legacy-svg-compatibility-baseline',`${asset.id}: Course 1 SVG lifecycle must be compatibility baseline`);
  assert.equal(asset.rasterReplacement?.status,'required-not-produced',`${asset.id}: Course 1 raster replacement must remain open until produced`);
}

const tech2=read('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
assert.equal(tech2.policy?.productionFormatPolicy?.svgReleaseAllowed,false,'Technician II: SVG release must remain prohibited');
assert.deepEqual(tech2.policy?.productionFormatPolicy?.allowedReleasedExtensions,releaseRaster);

const replacementProgram=read('registry/raster-replacement-program.json');
assert.equal(replacementProgram.summary?.totalGovernedReplacements,96,'Raster program total must reconcile to 96 governed replacements');
assert.equal(replacementProgram.summary?.technicianI,60,'Technician I raster program must reconcile to 60 replacements');
assert.equal(replacementProgram.summary?.technicianII,36,'Technician II raster program must reconcile to 36 replacements');
assert.equal(replacementProgram.summary?.releasedRasterReplacements,0,'No raster replacement may be claimed released without reviewed binaries');
assert.equal(replacementProgram.summary?.openRasterReplacements,96,'All 96 replacements remain open until reviewed binaries are released');
assert.equal(replacementProgram.summary?.producedRasterCandidates,40,'Technician I Courses 2-6 must report forty produced raster candidates');
assert.equal(replacementProgram.summary?.remainingRasterProduction,56,'Raster production remainder must reconcile after the Courses 2-6 candidate tranches');

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

console.log('Raster production policy: PASS (96 governed replacements reconciled across Technician I Courses 1-6 and Technician II).');
