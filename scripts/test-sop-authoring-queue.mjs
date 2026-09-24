import assert from 'node:assert/strict';
import fs from 'node:fs';

const q=JSON.parse(fs.readFileSync('registry/sop-authoring-queue.json','utf8'));
const ingestion=JSON.parse(fs.readFileSync('registry/sop-package-ingestion.json','utf8'));
const lessonIds=new Set(fs.readdirSync('content/lessons').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/lessons/'+n,'utf8')).id));
const moduleIds=new Set(fs.readdirSync('content/modules').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/modules/'+n,'utf8')).id));
assert.equal(q.targets.length,17);
assert.equal(q.summary.targets,17);
assert.equal(new Set(q.targets.map(x=>x.id)).size,17);
for(const row of q.targets){
  const inventory=ingestion.externalPackages.find(x=>x.externalId===row.id);
  assert.ok(inventory,`${row.id}: missing from controlled 24-target inventory`);
  assert.equal(inventory.ingestionStatus,'package-authoring-not-started',`${row.id}: queue must only contain planned package-authoring targets`);
  assert.ok(row.reuseModules.length>0);
  assert.ok(row.reuseLessons.length>0);
  assert.ok(row.newAuthoring.length>0);
  assert.ok(row.evidenceFocus.length>0);
  for(const id of row.reuseModules) assert.ok(moduleIds.has(id),`${row.id}: mapped module does not exist: ${id}`);
  for(const id of row.reuseLessons) assert.ok(lessonIds.has(id),`${row.id}: mapped lesson does not exist: ${id}`);
}
assert.equal(q.targets.find(x=>x.id==='GROW-100').newAuthoring.some(x=>/disease/i.test(x)),true);
console.log('Controlled SOP reuse-first authoring queue: PASS (17 planned targets mapped to existing instruction plus explicit new-authoring gaps).');
