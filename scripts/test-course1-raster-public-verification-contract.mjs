import fs from 'node:fs';
import assert from 'node:assert/strict';

const registry=JSON.parse(fs.readFileSync('visuals/ASSET-REGISTRY.json','utf8'));
const assets=(registry.assets??[])
  .filter(x=>x.status==='produced'&&typeof x.learnerPath==='string'&&/\.(?:png|webp|jpe?g)$/i.test(x.learnerPath));

assert.equal(assets.length,23,'Course 1 must expose exactly 23 produced raster learner assets');
assert.equal(new Set(assets.map(x=>x.learnerPath)).size,23,'Course 1 raster paths must be unique');
for(const x of assets){
  assert.match(x.id,/^VIS-LH-TECH1-001-\d{3}$/,`${x.id}: invalid registry asset id`);
  assert.match(x.learnerPath,/^\/assets\/course1\/.+\.(png|webp|jpe?g)$/i,`${x.id}: invalid public raster path`);
  assert.equal(x.status,'produced',`${x.id}: raster is not produced`);
}
console.log('Course 1 raster deployment verification contract: PASS (23 unique produced raster paths).');
