import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest=JSON.parse(fs.readFileSync('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json','utf8'));
const assets=(manifest.concepts??[]).filter(x=>x.releaseApproved===true&&typeof x.candidate?.targetPublicPath==='string');
assert.equal(assets.length,23,'Course 1 must expose exactly 23 release-approved raster paths for deployment verification');
assert.equal(new Set(assets.map(x=>x.candidate.targetPublicPath)).size,23,'Course 1 raster paths must be unique');
for(const x of assets){
  assert.match(x.candidate.targetPublicPath,/^\/assets\/course1\/.+\.(png|webp|jpe?g)$/i,`${x.conceptId}: invalid public raster path`);
  assert.match(x.candidate.sha256??'',/^[0-9a-f]{64}$/i,`${x.conceptId}: missing SHA-256`);
  assert.equal(x.candidate.qaStatus,'public-approved',`${x.conceptId}: not public-approved`);
}
console.log('Course 1 raster deployment verification contract: PASS (23 unique approved raster paths).');
