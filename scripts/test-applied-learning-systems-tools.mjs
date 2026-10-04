import fs from 'node:fs';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const schema=JSON.parse(fs.readFileSync('schemas/applied-learning-tool.schema.json','utf8'));
const registry=JSON.parse(fs.readFileSync('registry/curriculum.json','utf8'));
const files=fs.readdirSync('content/applied-learning/tools').filter(name=>name.endsWith('.json')).sort();
assert.equal(files.length,6,'expected six remaining Applied Learning tool records');

const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
const validate=ajv.compile(schema);
const sets={
  competency:new Set(registry.competencies),
  objective:new Set(registry.learningObjectives),
  reference:new Set(registry.references),
  lesson:new Set(registry.lessons),
  claim:new Set(registry.claims),
  module:new Set(registry.modules)
};

const records=files.map(name=>JSON.parse(fs.readFileSync(`content/applied-learning/tools/${name}`,'utf8')));
const kinds=new Set(records.map(row=>row.kind));
assert.deepEqual([...kinds].sort(),['blueprint','calibration','cause-chain','flight-recorder','incident-report','timeline-atlas']);

for(const row of records){
  assert.equal(validate(row),true,`${row.id}: ${JSON.stringify(validate.errors)}`);
  assert.equal(row.review.credentialUseAuthorized,false,`${row.id}: credential use must remain false`);
  for(const id of row.competencyIds) assert.ok(sets.competency.has(id),`${row.id}: missing competency ${id}`);
  for(const id of row.objectiveIds??[]) assert.ok(sets.objective.has(id),`${row.id}: missing objective ${id}`);
  for(const id of row.referenceIds) assert.ok(sets.reference.has(id),`${row.id}: missing reference ${id}`);
  for(const id of row.canonicalSources){
    assert.ok(sets.lesson.has(id)||sets.claim.has(id)||sets.module.has(id),`${row.id}: missing canonical source ${id}`);
  }
}

const server=createAcademyWebServer({env:{NODE_ENV:'test',ACADEMY_PREVIEW_DRAFTS:'1'}});
server.listen(0,'127.0.0.1');
await once(server,'listening');
try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const catalogResponse=await fetch(`${base}/api/applied-learning/tools`);
  assert.equal(catalogResponse.status,200);
  const catalog=await catalogResponse.json();
  assert.equal(catalog.tools.length,6);
  assert.ok(catalog.tools.every(tool=>!('configuration' in tool)&&!('review' in tool)));

  const blueprintId='ALTOOL-GROW-ROOM-BLUEPRINT-001';
  const blueprint=await fetch(`${base}/api/applied-learning/tools/${blueprintId}/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({roomLengthFt:10,roomWidthFt:10,accessNotes:'Training layout'})
  });
  assert.equal(blueprint.status,200);
  assert.equal((await blueprint.json()).result.floorAreaSqFt,100);

  const badBlueprint=await fetch(`${base}/api/applied-learning/tools/${blueprintId}/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({roomLengthFt:-1,roomWidthFt:10,accessNotes:'Invalid'})
  });
  assert.equal(badBlueprint.status,400);

  const calibrationId='ALTOOL-CALIBRATION-BENCH-001';
  const calibration=await fetch(`${base}/api/applied-learning/tools/${calibrationId}/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({deviceId:'SIM-PH-1',verificationResult:'fail',notes:'Standard check out of tolerance'})
  });
  assert.equal(calibration.status,200);
  assert.match((await calibration.json()).result.decision,/recalibrate-or-service/);

  const flight=await fetch(`${base}/api/applied-learning/tools/ALTOOL-GROWER-FLIGHT-RECORDER-001/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
      subjectId:'SIM-ZONE-A',timestamp:'2026-10-03T12:00',
      eventType:'observation',eventDetail:'Uneven airflow observed',nextAction:'Compare crop-zone readings'
    })
  });
  assert.equal(flight.status,200);
  const flightBody=await flight.json();
  assert.equal(flightBody.status,'learner-draft-record');
  assert.match(flightBody.note,/does not create credential evidence/i);

  const prod=createAcademyWebServer({env:{NODE_ENV:'production',ACADEMY_PREVIEW_DRAFTS:'0'}});
  prod.listen(0,'127.0.0.1');
  await once(prod,'listening');
  try{
    const prodBase=`http://127.0.0.1:${prod.address().port}`;
    const hiddenCatalog=await fetch(`${prodBase}/api/applied-learning/tools`);
    assert.equal(hiddenCatalog.status,200);
    assert.equal((await hiddenCatalog.json()).tools.length,0,'draft tools must remain hidden in published-only mode');
    assert.equal((await fetch(`${prodBase}/api/applied-learning/tools/${blueprintId}`)).status,404);
  } finally {
    await new Promise(resolve=>prod.close(resolve));
  }
} finally {
  await new Promise(resolve=>server.close(resolve));
}

console.log('Applied-learning remaining systems tools contract OK');
