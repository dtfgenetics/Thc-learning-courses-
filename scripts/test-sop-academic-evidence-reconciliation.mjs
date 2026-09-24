import assert from 'node:assert/strict';
import fs from 'node:fs';

const queue=JSON.parse(fs.readFileSync('registry/sop-package-review-queue.json','utf8'));
const sourceIds=new Set(
  fs.readdirSync('content/references')
    .filter(n=>n.endsWith('.json'))
    .map(n=>JSON.parse(fs.readFileSync('content/references/'+n,'utf8')).id)
);

assert.equal(queue.packages.length,17);
assert.equal(queue.summary.academicEvidenceReconciliationComplete,17);

const weakStatus=[];
const failures=[];
for(const row of queue.packages){
  const manifest=JSON.parse(fs.readFileSync(row.manifest,'utf8'));
  const plan=JSON.parse(fs.readFileSync(manifest.evidencePlan,'utf8'));

  assert.equal(manifest.releaseState,'blocked');
  assert.equal(manifest.qaReviewState,'not-started');
  assert.equal(plan.status,'evidence-plan-seeded');

  const manifestRefs=new Set(manifest.controlledReferences);
  const planRefs=new Set(plan.sourceIds);
  for(const id of plan.sourceIds){
    if(!sourceIds.has(id)) failures.push(`${row.id}: evidence-plan source missing from registry: ${id}`);
    if(!manifestRefs.has(id)) failures.push(`${row.id}: evidence-plan source not carried into package manifest: ${id}`);
  }

  for(const claim of plan.claims){
    if(!claim.sources?.length) failures.push(`${row.id}/${claim.id}: claim has no sources`);
    if(!claim.boundary || claim.boundary.length<25) failures.push(`${row.id}/${claim.id}: claim boundary too weak/missing`);
    for(const id of claim.sources){
      if(!planRefs.has(id)) failures.push(`${row.id}/${claim.id}: claim source not declared in evidence plan: ${id}`);
      if(!manifestRefs.has(id)) failures.push(`${row.id}/${claim.id}: claim source not declared in package manifest: ${id}`);
      const f='content/references/'+id+'.json';
      if(fs.existsSync(f)){
        const ref=JSON.parse(fs.readFileSync(f,'utf8'));
        if(!['reviewed','reviewed-source'].includes(ref.status)) weakStatus.push(`${row.id}/${claim.id}: ${id} status=${ref.status}`);
        if(!ref.url) failures.push(`${row.id}/${claim.id}: ${id} has no source URL`);
      }
    }
  }

  const excluded=[
    ...(plan.scope?.excludedUntilValidated??[]),
    ...(plan.scope?.excludedUntilQualified??[]),
    ...(plan.scope?.excludedUntilApproved??[]),
    ...(plan.scope?.excludedUntilAuthorized??[])
  ];
  if(!excluded.length) failures.push(`${row.id}: no explicit excluded/unvalidated boundary list`);

  const sop=fs.readFileSync(manifest.scientificSop,'utf8');
  if(!/blocked/i.test(sop)) failures.push(`${row.id}: SOP does not visibly preserve blocked release`);
  if(!/boundary|not universal|not authorize|not operational|does not/i.test(sop)) failures.push(`${row.id}: SOP lacks explicit authority/generalization boundary language`);
}

if(weakStatus.length){
  console.warn('Reviewed-source status exceptions found:');
  weakStatus.forEach(x=>console.warn('- '+x));
}
if(failures.length){
  console.error('Academic evidence reconciliation failed:');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log(`Academic evidence reconciliation: PASS (17 packages; claim sources resolve, package manifests carry sources, boundaries are explicit, release remains blocked). Reviewed-status notes: ${weakStatus.length}.`);
