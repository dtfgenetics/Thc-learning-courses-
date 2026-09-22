import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync('visuals/COURSE1-REFERENCE-BOARD-PROVENANCE.json','utf8'));
assert.equal(registry.courseId,'COURSE-LH-TECH1-001');
assert.equal(registry.boards.length,3);
assert.equal(registry.productionRule?.compositeBoardReleaseAllowed,false);
assert.equal(registry.productionRule?.finalIndividualRasterRequired,true);
assert.deepEqual(registry.productionRule?.allowedFormats,['png','webp','jpg','jpeg']);
assert.equal(registry.productionRule?.minimumMasterPixels?.width,2400);
assert.equal(registry.productionRule?.minimumMasterPixels?.height,3200);
assert.equal(registry.state,'individual-raster-rebuild-required');
for(const board of registry.boards){
  assert.equal(board.mimeType,'image/png');
  assert.equal(board.repositoryBinaryImported,false);
  assert.equal(board.releaseEligible,false);
  assert.ok(board.driveFileId);
  assert.ok(board.title.endsWith('.png'));
  assert.ok(Array.isArray(board.concepts)&&board.concepts.length>0);
}
const conceptIds=new Set(registry.boards.flatMap(b=>b.concepts));
assert.deepEqual([...conceptIds].sort(),['01','02','03','04','05','06','07','08','09','10','11','12']);
console.log('Course 1 reference-board provenance: PASS (12 concepts remain fail-closed behind individual raster rebuilds).');
