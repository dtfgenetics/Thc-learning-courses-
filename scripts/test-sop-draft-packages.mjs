import assert from 'node:assert/strict';
import fs from 'node:fs';

const ids=['GROW-000','GROW-011','GROW-020','GROW-030','GROW-031','GROW-032','GROW-033','GROW-040','GROW-080','GROW-090','GROW-100','GROW-110','GROW-120','GROW-130','GROW-140','GROW-150','GROW-160'];
for(const id of ids){
 const m=JSON.parse(fs.readFileSync(`registry/sop-packages/${id}.json`,'utf8'));
 assert.equal(m.id,id);
 assert.equal(m.status,'draft-controlled-package');
 assert.equal(m.releaseState,'blocked');
 assert.equal(m.qaReviewState,'not-started');
 assert.ok(m.controlledReferences.length>=1);
 assert.ok(m.releaseGates.length>=5);
 for(const key of ['scientificSop','learnerGuide','implementationHandoff','recordsTemplate']){
  assert.ok(fs.existsSync(m[key]),`${id}: missing ${key}: ${m[key]}`);
 }
 const sop=fs.readFileSync(m.scientificSop,'utf8');
 assert.match(sop,/Release:\*\* Blocked|Release:\s*Blocked/i,`${id}: SOP must show blocked release`);
 assert.ok(sop.length>1800,`${id}: scientific SOP draft is too thin`);
 const learner=fs.readFileSync(m.learnerGuide,'utf8');
 assert.ok(learner.length>500,`${id}: learner guide draft is too thin`);
 const csv=fs.readFileSync(m.recordsTemplate,'utf8').trim();
 assert.ok(csv.split(',').length>=20,`${id}: records template needs at least 20 fields`);
}
const q=JSON.parse(fs.readFileSync('registry/sop-authoring-queue.json','utf8'));
assert.equal(q.summary.evidencePlansSeeded,17);
assert.equal(q.summary.evidencePlanCoverageComplete,true);
assert.equal(q.summary.draftControlledPackagesCreated,17);
assert.equal(q.summary.draftPackageCoverageComplete,true);
assert.equal(q.targets.filter(x=>x.status!=='draft-controlled-package-created').length,0);
console.log('Controlled SOP draft packages: PASS (17/17 planned packages contain SOP, learner guide, handoff, records template and blocked release state).');
