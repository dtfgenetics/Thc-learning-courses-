import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const sha256=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');
const expectedCounts=new Map([[2,10],[3,6],[4,7],[5,9],[6,8]]);

function webpDimensions(buffer){
  assert.equal(buffer.subarray(0,4).toString('ascii'),'RIFF','candidate must use a RIFF container');
  assert.equal(buffer.subarray(8,12).toString('ascii'),'WEBP','candidate must have a WEBP signature');
  assert.equal(buffer.subarray(12,16).toString('ascii'),'VP8L','candidate must use lossless WebP encoding');
  assert.equal(buffer[20],0x2f,'candidate is missing the VP8L signature byte');
  const bits=buffer.readUInt32LE(21);
  return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
}

let checked=0;
for(const [courseNumber,expected] of expectedCounts){
  const registry=JSON.parse(fs.readFileSync(path.join(root,`visuals/COURSE${courseNumber}-ASSET-REGISTRY.json`),'utf8'));
  assert.equal(registry.assets?.length,expected,`Course ${courseNumber}: candidate inventory drift`);
  for(const asset of registry.assets){
    const replacement=asset.rasterReplacement;
    assert.equal(replacement?.status,'owner-approved-production-release',`${asset.id}: candidate lifecycle drift`);
    assert.equal(replacement?.generatedFrom,asset.legacySource?.sourcePath,`${asset.id}: source provenance drift`);
    assert.equal(replacement?.candidateSourcePath,asset.sourcePath,`${asset.id}: active raster source drift`);
    assert.equal(replacement?.encoding,'lossless-webp');
    assert.equal(replacement?.releaseApproved,true,`${asset.id}: candidate production cannot imply release approval`);
    assert.match(replacement?.candidateSourcePath??'',new RegExp(`^apps/web/public/assets/course${courseNumber}/[A-Za-z0-9._-]+\\.webp$`,'i'));

    const source=fs.readFileSync(path.join(root,asset.legacySource.sourcePath));
    const sourceText=source.toString('utf8');
    assert.doesNotMatch(sourceText,/&(?!amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9A-Fa-f]+;)/,`${asset.id}: SVG baseline contains an unescaped XML entity`);
    const candidate=fs.readFileSync(path.join(root,replacement.candidateSourcePath));
    assert.equal(sha256(source),replacement.sourceSha256,`${asset.id}: source digest drift`);
    assert.equal(sha256(candidate),replacement.candidateSha256,`${asset.id}: candidate digest drift`);
    assert.equal(candidate.length,replacement.bytes,`${asset.id}: byte count drift`);
    const dimensions=webpDimensions(candidate);
    assert.deepEqual(dimensions,replacement.pixelDimensions,`${asset.id}: dimension metadata drift`);
    assert.ok(Math.min(dimensions.width,dimensions.height)>=1600,`${asset.id}: shortest side must be at least 1600 px`);
    checked+=1;
  }
}

assert.equal(checked,40,'Technician I Courses 2-6 must expose 40 governed raster candidates');
console.log(`Technician I raster candidates: PASS (${checked} lossless WebP candidates; release remains human-QA gated).`);
