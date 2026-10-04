import fs from "node:fs";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema=JSON.parse(fs.readFileSync("schemas/applied-learning-event.schema.json","utf8"));
const fixture=JSON.parse(fs.readFileSync("content/applied-learning/fixtures/environmental-replay-24h.json","utf8"));
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);
const validate=ajv.compile(schema);

assert.equal(fixture.status,"draft");
assert.ok(fixture.events.length>=8);
for(const event of fixture.events){
  assert.equal(validate(event),true,JSON.stringify(validate.errors));
}
const ids=fixture.events.map(x=>x.id);
assert.equal(new Set(ids).size,ids.length,"event IDs must be unique");
for(let i=1;i<fixture.events.length;i++){
  assert.ok(Date.parse(fixture.events[i].timestamp)>=Date.parse(fixture.events[i-1].timestamp),"events must be chronological");
}
assert.ok(fixture.events.some(x=>x.kind==="equipment"&&x.payload.state==="failed"),"fixture needs a failure event");
assert.ok(fixture.events.some(x=>x.kind==="intervention"),"fixture needs an intervention");
assert.ok(fixture.events.some(x=>x.kind==="outcome"),"fixture needs an outcome");
console.log("Applied-learning fixture contract OK");
