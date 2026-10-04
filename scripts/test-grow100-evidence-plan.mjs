import assert from 'node:assert/strict';
import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync('registry/sop-evidence-plans/GROW-100.json','utf8'));
const refs=new Set(fs.readdirSync('content/references').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/references/'+n,'utf8')).id));
assert.equal(plan.id,'GROW-100');
assert.equal(plan.status,'evidence-plan-seeded');
assert.ok(plan.claims.length>=7);
assert.ok(plan.requiredNewPackageSections.length>=8);
for(const claim of plan.claims){
  assert.ok(claim.statement.length>40);
  assert.ok(claim.boundary.length>30);
  assert.ok(claim.sources.length>0);
  for(const id of claim.sources) assert.ok(refs.has(id),`${claim.id}: missing source ${id}`);
}
assert.ok(plan.scope.excludedUntilFacilityValidated.some(x=>/pesticide/i.test(x)));
assert.ok(plan.scope.excludedUntilFacilityValidated.some(x=>/chemical recipes/i.test(x)));
console.log('GROW-100 disease/disorder evidence plan: PASS (claims sourced; operational treatment boundaries fail-closed).');
