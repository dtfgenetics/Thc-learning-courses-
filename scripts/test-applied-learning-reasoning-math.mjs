import fs from 'node:fs';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const registry=JSON.parse(fs.readFileSync('registry/curriculum.json','utf8'));
const calculator=JSON.parse(fs.readFileSync('content/applied-learning/calculators/dli-001.json','utf8'));
const differential=JSON.parse(fs.readFileSync('content/applied-learning/differentials/yellowing-001.json','utf8'));
const calculatorSchema=JSON.parse(fs.readFileSync('schemas/applied-learning-calculator.schema.json','utf8'));
const differentialSchema=JSON.parse(fs.readFileSync('schemas/applied-learning-differential.schema.json','utf8'));

const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
assert.equal(ajv.compile(calculatorSchema)(calculator),true);
assert.equal(ajv.compile(differentialSchema)(differential),true);

const sets={
  competencies:new Set(registry.competencies),
  objectives:new Set(registry.learningObjectives),
  lessons:new Set(registry.lessons),
  references:new Set(registry.references)
};
for(const id of calculator.competencyIds) assert.ok(sets.competencies.has(id),`missing calculator competency ${id}`);
for(const id of calculator.objectiveIds) assert.ok(sets.objectives.has(id),`missing calculator objective ${id}`);
for(const id of calculator.referenceIds) assert.ok(sets.references.has(id),`missing calculator reference ${id}`);
for(const id of calculator.canonicalSources) assert.ok(sets.lessons.has(id),`missing calculator lesson ${id}`);
for(const id of differential.competencyIds) assert.ok(sets.competencies.has(id),`missing differential competency ${id}`);
for(const id of differential.referenceIds) assert.ok(sets.references.has(id),`missing differential reference ${id}`);
for(const id of differential.canonicalSources) assert.ok(sets.lessons.has(id),`missing differential lesson ${id}`);
assert.equal(calculator.review.credentialUseAuthorized,false);
assert.equal(differential.review.credentialUseAuthorized,false);
assert.match(differential.boundary,/does not diagnose/i);
assert.ok(differential.hypotheses.length>=3);

const server=createAcademyWebServer({env:{NODE_ENV:'test',ACADEMY_PREVIEW_DRAFTS:'1'}});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try{
  const base=`http://127.0.0.1:${server.address().port}`;

  const metaResponse=await fetch(`${base}/api/applied-learning/calculators/ALCALC-DLI-001`);
  assert.equal(metaResponse.status,200);
  const meta=await metaResponse.json();
  assert.equal(meta.calculation,'dli-from-ppfd');
  assert.ok(!('review' in meta));

  const calcResponse=await fetch(`${base}/api/applied-learning/calculators/ALCALC-DLI-001/calculate`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({ppfdUmolM2S:500,photoperiodHours:18})
  });
  assert.equal(calcResponse.status,200);
  const calcResult=await calcResponse.json();
  assert.ok(Math.abs(calcResult.value-32.4)<1e-9);
  assert.equal(calcResult.unit,'mol/m²/day');

  const invalidResponse=await fetch(`${base}/api/applied-learning/calculators/ALCALC-DLI-001/calculate`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({ppfdUmolM2S:-1,photoperiodHours:18})
  });
  assert.equal(invalidResponse.status,400);

  const diffResponse=await fetch(`${base}/api/applied-learning/differentials/ALDIFF-YELLOWING-001`);
  assert.equal(diffResponse.status,200);
  const diff=await diffResponse.json();
  assert.equal(diff.hypotheses.length,3);
  assert.ok(!('review' in diff));
  assert.match(diff.boundary,/does not diagnose/i);

  const shellResponse=await fetch(`${base}/applied-learning`);
  assert.equal(shellResponse.status,200);
  const shell=await shellResponse.text();
  assert.match(shell,/Crop Math/);
  assert.match(shell,/Same Symptom, Different Cause/);
} finally {
  await new Promise(resolve=>server.close(resolve));
}

const prod=createAcademyWebServer({env:{NODE_ENV:'production',ACADEMY_PREVIEW_DRAFTS:'0'}});
prod.listen(0,'127.0.0.1');
await once(prod,'listening');
try{
  const base=`http://127.0.0.1:${prod.address().port}`;
  assert.equal((await fetch(`${base}/api/applied-learning/calculators/ALCALC-DLI-001`)).status,404);
  assert.equal((await fetch(`${base}/api/applied-learning/differentials/ALDIFF-YELLOWING-001`)).status,404);
} finally {
  await new Promise(resolve=>prod.close(resolve));
}

console.log('Applied-learning Crop Math and differential reasoning contracts OK');
