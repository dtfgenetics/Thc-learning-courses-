import fs from 'node:fs';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema=JSON.parse(fs.readFileSync('schemas/applied-learning-measurement.schema.json','utf8'));
const activity=JSON.parse(fs.readFileSync('content/applied-learning/measurements/sensor-placement-001.json','utf8'));
const registry=JSON.parse(fs.readFileSync('registry/curriculum.json','utf8'));
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
const validate=ajv.compile(schema);
assert.equal(validate(activity),true,JSON.stringify(validate.errors));

const sets={
  competencies:new Set(registry.competencies),
  objectives:new Set(registry.learningObjectives),
  references:new Set(registry.references),
  lessons:new Set(registry.lessons),
  claims:new Set(registry.claims)
};
for(const id of activity.competencyIds) assert.ok(sets.competencies.has(id),`missing competency ${id}`);
for(const id of activity.objectiveIds) assert.ok(sets.objectives.has(id),`missing objective ${id}`);
for(const id of activity.referenceIds) assert.ok(sets.references.has(id),`missing reference ${id}`);
for(const id of activity.canonicalSources){
  assert.ok(sets.lessons.has(id)||sets.claims.has(id),`missing canonical source ${id}`);
}
assert.equal(activity.review.credentialUseAuthorized,false);
assert.match(activity.safetyBoundary,/does not authorize/i);
assert.ok(activity.steps.length>=4);
assert.ok(activity.evidenceFields.some(x=>x.id==='sensorLocation'));

console.log('Applied-learning Measurement School activity contract OK');
