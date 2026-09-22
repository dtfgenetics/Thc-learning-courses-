import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const sha256=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');

function webpDimensions(buffer){
  assert.equal(buffer.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(buffer.subarray(8,12).toString('ascii'),'WEBP');
  assert.equal(buffer.subarray(12,16).toString('ascii'),'VP8L','candidate must use lossless WebP encoding');
  assert.equal(buffer[20],0x2f);
  const bits=buffer.readUInt32LE(21);
  return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
}

const plan=read('visuals/TECH2-VISUAL-PRODUCTION-PLAN.json');
const manifest=read('visuals/TECH2-RASTER-CANDIDATE-MANIFEST.json');
assert.equal(manifest.count,36);
assert.equal(manifest.releaseApproved,false);
let checked=0;
for(const course of plan.courses){
  for(const concept of course.concepts){
    const replacement=concept.rasterReplacement;
    assert.equal(replacement?.status,'candidate-produced-human-qa-required',`${concept.conceptId}: lifecycle drift`);
    assert.equal(replacement?.generatedFrom,concept.sourcePath);
    assert.equal(replacement?.encoding,'lossless-webp');
    assert.equal(replacement?.releaseApproved,false);
    assert.match(replacement?.candidateSourcePath??'',/^apps\/web\/public\/assets\/tech2\/course[1-8]\/outcome-[0-9]{2}\.webp$/);
    const source=fs.readFileSync(path.join(root,concept.sourcePath));
    const candidate=fs.readFileSync(path.join(root,replacement.candidateSourcePath));
    assert.equal(sha256(source),replacement.sourceSha256);
    assert.equal(sha256(candidate),replacement.candidateSha256);
    assert.equal(candidate.length,replacement.bytes);
    const dimensions=webpDimensions(candidate);
    assert.deepEqual(dimensions,replacement.pixelDimensions);
    assert.ok(Math.min(dimensions.width,dimensions.height)>=1600);
    const manifestRow=manifest.candidates.find((row)=>row.conceptId===concept.conceptId);
    assert.ok(manifestRow,`${concept.conceptId}: missing manifest row`);
    assert.equal(manifestRow.candidateSha256,replacement.candidateSha256);
    checked+=1;
  }
}
assert.equal(checked,36);
console.log('Technician II raster candidates: PASS (36 lossless WebP candidates; release remains human-QA gated).');
