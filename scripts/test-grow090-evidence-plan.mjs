import assert from 'node:assert/strict';
import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync('registry/sop-evidence-plans/GROW-090.json','utf8'));
const refs=new Set(fs.readdirSync('content/references').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/references/'+n,'utf8')).id));
assert.equal(plan.id,'GROW-090');
assert.equal(plan.status,'evidence-plan-seeded');
assert.ok(plan.claims.length>=8);
assert.ok(plan.requiredNewPackageSections.length>=10);
for(const c of plan.claims){
  assert.ok(c.statement.length>45);
  assert.ok(c.boundary.length>35);
  for(const id of c.sources) assert.ok(refs.has(id),`${c.id}: missing source ${id}`);
}
assert.ok(plan.scope.excludedUntilAuthorized.some(x=>/threshold/i.test(x)));
assert.ok(plan.scope.excludedUntilAuthorized.some(x=>/pesticide product/i.test(x)));
assert.ok(plan.scope.excludedUntilAuthorized.some(x=>/off-label/i.test(x)));
console.log('GROW-090 IPM evidence plan: PASS (scouting/identification/verification supported; pesticide authority remains label- and jurisdiction-controlled).');
