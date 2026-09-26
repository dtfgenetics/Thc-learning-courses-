import assert from 'node:assert/strict';
import fs from 'node:fs';
const ids=['GROW-030','GROW-031','GROW-032','GROW-033','GROW-110','GROW-120'];
const refs=new Set(fs.readdirSync('content/references').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/references/'+n,'utf8')).id));
for(const id of ids){
 const p=JSON.parse(fs.readFileSync(`registry/sop-evidence-plans/${id}.json`,'utf8'));
 assert.equal(p.status,'evidence-plan-seeded');
 assert.ok(p.claims.length>=5);
 assert.ok(p.requiredNewPackageSections.length>=10);
 for(const c of p.claims){
  assert.ok(c.statement.length>40);
  assert.ok(c.boundary.length>25);
  for(const r of c.sources) assert.ok(refs.has(r),`${c.id}: missing source ${r}`);
 }
}
const q=JSON.parse(fs.readFileSync('registry/sop-authoring-queue.json','utf8'));
assert.equal(q.summary.evidencePlansSeeded,17);
assert.equal(q.summary.evidencePlanCoverageComplete,true);
assert.equal(q.targets.filter(x=>typeof x.evidencePlan!=='string'||!x.evidencePlan.startsWith('registry/sop-evidence-plans/')).length,0);
assert.equal(q.summary.draftControlledPackagesCreated,17);
assert.equal(q.summary.draftPackageCoverageComplete,true);
assert.equal(q.targets.filter(x=>x.status!=='draft-controlled-package-created').length,0);
console.log('Remaining SOP evidence plans: PASS (17/17 planned targets now have controlled evidence plans; package authoring/review remains fail-closed).');
