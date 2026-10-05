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
  const clientResponse=await fetch(`${base}/applied-learning.js`);
  assert.equal(clientResponse.status,200);
  const clientText=await clientResponse.text();
  for(const expected of [
    'Diagnostic conclusion authorized: no',
    'Regulated record created: no',
    'Root cause assigned: no',
    'Causation proven: no'
  ]) assert.equal(clientText.includes(expected),true,`client must preserve safety message: ${expected}`);
  assert.equal(catalogResponse.status,200);')));

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

  const timeline=await fetch(`${base}/api/applied-learning/tools/ALTOOL-PLANT-TIMELINE-ATLAS-001/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
      subjectId:'SIM-PLANT-7',timestamp:'2026-10-03T11:30',
      stage:'vegetative',observation:'New growth remains upright and uniformly green',
      uncertainty:'Need another time point before inferring trend'
    })
  });
  assert.equal(timeline.status,200);
  const timelineBody=await timeline.json();
  assert.equal(timelineBody.result.observationRecord.subjectId,'SIM-PLANT-7');
  assert.equal(timelineBody.result.separatesObservationFromCause,true);
  assert.equal(timelineBody.result.diagnosticConclusionAuthorized,false);

  const badTimeline=await fetch(`${base}/api/applied-learning/tools/ALTOOL-PLANT-TIMELINE-ATLAS-001/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
      subjectId:'SIM-PLANT-7',timestamp:'not-a-time',
      stage:'vegetative',observation:'Observation',uncertainty:'Unknown'
    })
  });
  assert.equal(badTimeline.status,400);

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
  assert.equal(flightBody.result.eventRecord.eventType,'observation');
  assert.equal(flightBody.result.handoffReady,true);
  assert.equal(flightBody.result.chronologyPreserved,true);
  assert.equal(flightBody.result.regulatedRecordCreated,false);
  assert.match(flightBody.note,/does not replace controlled facility records/i);

  const incident=await fetch(`${base}/api/applied-learning/tools/ALTOOL-CROP-INCIDENT-REPORT-001/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
      timestamp:'2026-10-03T12:15',location:'SIM-ROOM-2',
      facts:'Circulation fan stopped and localized leaf movement decreased',
      containment:'Paused training activity and kept clear of equipment',
      escalation:'Notified simulated supervisor',
      followUp:'Qualified person to inspect equipment'
    })
  });
  assert.equal(incident.status,200);
  const incidentBody=await incident.json();
  assert.equal(incidentBody.result.requiredSectionsComplete,true);
  assert.equal(incidentBody.result.rootCauseAssigned,false);
  assert.match(incidentBody.result.incidentRecord.facts,/fan stopped/i);

  const causeChain=await fetch(`${base}/api/applied-learning/tools/ALTOOL-CAUSE-CHAIN-001/evaluate`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
      observation:'One canopy zone shows reduced leaf movement',
      mechanism:'Reduced local air exchange could alter the boundary layer',
      hypothesis:'Local circulation is lower than adjacent zones',
      alternative:'Sensor placement or canopy density could explain the difference',
      nextEvidence:'Compare airflow indicators and environmental readings across matched zones',
      outcome:'No intervention performed in this training example'
    })
  });
  assert.equal(causeChain.status,200);
  const causeBody=await causeChain.json();
  assert.equal(causeBody.result.hasAlternativeExplanation,true);
  assert.equal(causeBody.result.hasDiscriminatingEvidencePlan,true);
  assert.equal(causeBody.result.causationProven,false);
  assert.deepEqual(causeBody.result.chain.map(row=>row.stage),['observation','mechanism','hypothesis','alternative','next-evidence','outcome']);

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
