import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read=(file)=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha256=(b)=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=read('visuals/COURSE1-VISUAL-RELEASE-MANIFEST.json');
const copyLock=read('visuals/COURSE1-VISUAL-COPY-LOCK-13-18.json');
let checked=0;
for(const concept of manifest.concepts.slice(12,18)){
  const candidate=concept.candidate;
  assert.equal(candidate.binaryState,'repository-production-master-release-approved');
  assert.equal(candidate.qaStatus,'public-approved');
  assert.equal(candidate.individualProductionMasterRequired,false);
  assert.deepEqual(candidate.pixelDimensions,{width:2400,height:3200});
  assert.equal(concept.releaseApproved,true);
  assert.match(candidate.targetPublicPath??'',/^\/assets\/course1\/.+\.png$/i);
  const bytes=fs.readFileSync(candidate.repositoryPath);
  assert.equal(bytes.subarray(1,4).toString('ascii'),'PNG');
  assert.equal(sha256(bytes),candidate.sha256);
  assert.equal(bytes.length,candidate.sizeBytes);
  const publicBytes=fs.readFileSync(path.join('apps/web/public',candidate.targetPublicPath.replace(/^\//,'')));
  assert.equal(sha256(publicBytes),candidate.sha256,`${concept.conceptId}: released public PNG must match the approved production master`);
  const locked=copyLock.assets.find((row)=>row.conceptId===concept.conceptId);
  assert.ok(locked,`${concept.conceptId}: approved copy lock missing`);
  for(const claim of [...copyLock.global.prohibitedBranding,...locked.prohibitedClaims]){
    assert.ok(!candidate.fileName.toLowerCase().includes(claim.toLowerCase()),`${concept.conceptId}: prohibited claim leaked into filename`);
  }
  checked+=1;
}
assert.equal(checked,6);
console.log('Course 1 production masters 13–18: PASS (six owner-approved 2400×3200 PNG masters match their released public binaries).');
