import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const ids=['GROW-020','GROW-090','GROW-100'];
for(const id of ids){
 const m=JSON.parse(fs.readFileSync(`registry/sop-packages/${id}.json`,'utf8'));
 assert.equal(m.id,id);
 assert.equal(m.status,'draft-controlled-package');
 assert.equal(m.releaseState,'blocked');
 assert.equal(m.qaReviewState,'not-started');
 for(const key of ['scientificSop','learnerGuide','implementationHandoff','recordsTemplate']){
   assert.ok(fs.existsSync(m[key]),`${id}: missing ${key} file ${m[key]}`);
 }
 assert.ok(m.controlledReferences.length>=5);
 assert.ok(m.releaseGates.length>=5);
 const csv=fs.readFileSync(m.recordsTemplate,'utf8').trim();
 assert.ok(csv.split(',').length>=20,`${id}: records template needs at least 20 controlled fields`);
}
const q=JSON.parse(fs.readFileSync('registry/sop-authoring-queue.json','utf8'));
assert.equal(q.summary.draftControlledPackagesCreated,3);
console.log('Controlled SOP draft packages: PASS (GROW-020/090/100 complete five-part draft package set; release and QA remain fail-closed).');
