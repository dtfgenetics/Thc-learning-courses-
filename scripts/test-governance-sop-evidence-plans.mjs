import assert from 'node:assert/strict';
import fs from 'node:fs';
const refs=new Set(fs.readdirSync('content/references').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/references/'+n,'utf8')).id));
for(const id of ['GROW-000','GROW-150','GROW-160']){
  const p=JSON.parse(fs.readFileSync(`registry/sop-evidence-plans/${id}.json`,'utf8'));
  assert.equal(p.id,id);
  assert.equal(p.status,'evidence-plan-seeded');
  assert.ok(p.claims.length>=6);
  assert.ok(p.requiredNewPackageSections.length>=10);
  for(const c of p.claims){
    assert.ok(c.statement.length>45);
    assert.ok(c.boundary.length>30);
    for(const ref of c.sources) assert.ok(refs.has(ref),`${c.id}: missing source ${ref}`);
  }
}
const g0=JSON.parse(fs.readFileSync('registry/sop-evidence-plans/GROW-000.json','utf8'));
assert.ok(g0.scope.excludedUntilApproved.some(x=>/retroactive/i.test(x)));
const g150=JSON.parse(fs.readFileSync('registry/sop-evidence-plans/GROW-150.json','utf8'));
assert.ok(g150.scope.excludedUntilValidated.some(x=>/CAPA/i.test(x)));
const g160=JSON.parse(fs.readFileSync('registry/sop-evidence-plans/GROW-160.json','utf8'));
assert.ok(g160.scope.excludedUntilValidated.some(x=>/shadow logs/i.test(x)));
console.log('GROW-000/150/160 governance evidence plans: PASS (document control, QA/CAPA and records architecture sourced; legal/operational limits remain fail-closed).');
