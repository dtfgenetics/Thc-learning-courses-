import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const raster=['png','webp','jpeg','jpg'];

for(let n=2;n<=6;n++){
  const registry=read(`visuals/COURSE${n}-ASSET-REGISTRY.json`);
  assert.equal(registry.policy?.svgProductionTarget,false,`Course ${n}: SVG must not be the production target`);
  assert.equal(registry.policy?.legacySvgCompatibilityAllowed,true,`Course ${n}: current SVG baselines must stay explicitly compatibility-only until replaced`);
  assert.equal(registry.policy?.rasterReplacementRequired,true,`Course ${n}: raster replacement must be required`);
  assert.deepEqual(registry.policy?.productionInstructionalFormats,raster,`Course ${n}: production raster format policy drift`);
  for(const asset of registry.assets??[]){
    if(path.extname(asset.sourcePath??'').toLowerCase()!=='.svg') continue;
    assert.equal(asset.assetLifecycle,'legacy-svg-compatibility-baseline',`${asset.id}: SVG lifecycle must be compatibility baseline`);
    assert.equal(asset.rasterReplacement?.status,'required-not-produced',`${asset.id}: raster replacement must remain open until a real replacement is produced`);
    assert.deepEqual(asset.rasterReplacement?.allowedFormats,raster,`${asset.id}: raster format policy drift`);
    assert.match(asset.rasterReplacement?.releaseGate??'',/factual.*accessibility.*responsive.*public-path/i,`${asset.id}: replacement release gate incomplete`);
  }
}

const tech2=read('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
assert.equal(tech2.policy?.productionFormatPolicy?.svgReleaseAllowed,false,'Technician II: SVG release must remain prohibited');
assert.deepEqual(tech2.policy?.productionFormatPolicy?.allowedReleasedExtensions,['png','webp','jpg','jpeg']);

console.log('Raster production policy: PASS (Technician I Courses 2-6 and Technician II remain fail-closed to raster-only production release).');
