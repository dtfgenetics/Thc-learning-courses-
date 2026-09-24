import assert from 'node:assert/strict';
import fs from 'node:fs';

const plan=JSON.parse(fs.readFileSync('registry/sop-evidence-plans/GROW-140.json','utf8'));
const refs=new Set(fs.readdirSync('content/references').filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync('content/references/'+n,'utf8')).id));
assert.equal(plan.id,'GROW-140');
assert.equal(plan.status,'evidence-plan-seeded');
assert.ok(plan.claims.length>=8);
assert.ok(plan.requiredNewPackageSections.length>=10);
for(const claim of plan.claims){
  assert.ok(claim.statement.length>50);
  assert.ok(claim.boundary.length>35);
  assert.ok(claim.sources.length>0);
  for(const id of claim.sources) assert.ok(refs.has(id),`${claim.id}: missing source ${id}`);
}
assert.ok(plan.scope.excludedUntilValidated.some(x=>/drying days/i.test(x)));
assert.ok(plan.scope.excludedUntilValidated.some(x=>/water-activity/i.test(x)));
assert.ok(plan.scope.excludedUntilValidated.some(x=>/shelf-life/i.test(x)));
console.log('GROW-140 postharvest evidence plan: PASS (quality, microbial, water-state and stability claims sourced; universal recipes fail-closed).');
