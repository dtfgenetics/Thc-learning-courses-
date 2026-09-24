import assert from 'node:assert/strict';
import fs from 'node:fs';
const map=JSON.parse(fs.readFileSync('registry/sop-course-integration-map.json','utf8'));
const lessons=new Set(fs.readdirSync('content/lessons').filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync('content/lessons/'+x,'utf8')).id));
const modules=new Set(fs.readdirSync('content/modules').filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync('content/modules/'+x,'utf8')).id));
assert.equal(map.summary.sopPackages,17);
assert.equal(map.summary.operationallyReleased,0);
assert.equal(map.summary.internalAlignmentOnly,17);
for(const row of map.mappings){
  assert.equal(row.packageReleaseState,'blocked');
  assert.equal(row.integrationState,'internal-review-and-course-alignment-only');
  assert.ok(fs.existsSync(row.packageManifest),`${row.sopId}: manifest missing`);
  assert.ok(row.reusedModules.length>0);
  assert.ok(row.reusedLessons.length>0);
  for(const id of row.reusedModules) assert.ok(modules.has(id),`${row.sopId}: module missing: ${id}`);
  for(const id of row.reusedLessons) assert.ok(lessons.has(id),`${row.sopId}: lesson missing: ${id}`);
}
console.log('SOP-course integration map: PASS (17/17 mapped to existing curriculum; no draft SOP exposed as released operational content).');
