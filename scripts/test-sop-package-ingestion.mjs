import assert from 'node:assert/strict';
import fs from 'node:fs';

const register=JSON.parse(fs.readFileSync('registry/sop-package-ingestion.json','utf8'));
const expectedDownloads=['DL-SOP-AUTHORING-001','DL-SOP-EXECUTION-001','DL-SOP-DEVIATION-001','DL-SOP-TRAINING-001'];
const expectedPackages=['GROW-042','GROW-050','GROW-060','GROW-070'];

assert.equal(register.targetCount,24);
assert.equal(register.remainingUnidentifiedTargets+register.externalPackages.length,register.targetCount);
assert.deepEqual(register.repositoryLearnerPack.downloadIds,expectedDownloads);
assert.deepEqual(register.externalPackages.map(x=>x.externalId),expectedPackages);

for(const item of register.externalPackages){
  assert.match(item.externalId,/^GROW-\d{3}$/);
  assert.equal(item.sourceSystem,'controlled-google-drive');
  assert.equal(item.sourceState,'controlled-drive-source-located');
  assert.equal(item.ingestionStatus,'provenance-recorded-review-blocked');
  assert.equal(item.releaseState,'blocked');
  assert.equal(item.packageVersion,'0.1.0');
  assert.ok(item.allowedUse?.length>20);
  assert.match(item.provenanceVerifiedAt,/^\d{4}-\d{2}-\d{2}T/);
  for(const key of ['scientificSop','learnerGuide','qaReview','handoff']){
    assert.ok(item.controlledSourceIds?.[key],`${item.externalId}: missing controlled Drive source ID for ${key}`);
  }
  assert.notEqual(item.qaDisposition,'approved',`${item.externalId}: source discovery must not be converted into release approval`);
}

for(const id of expectedDownloads){
  const record=JSON.parse(fs.readFileSync(`content/downloads/${id}.json`,'utf8'));
  assert.equal(record.status,'draft');
  assert.equal(record.releaseStatus,'internal-preview');
  assert.equal(record.accessibilityStatus,'partial');
  assert.ok(record.courseMappings.includes('COURSE-PRO-SOP-001'));
  assert.deepEqual(record.resourceMappings,[],'references must not be mislabeled as RES-* resource mappings');
  assert.ok(record.limitations.some(entry=>/not|does not|alone/i.test(entry)),`${id} must state an authority limitation`);
  const rows=fs.readFileSync(`apps/web/public${record.path}`,'utf8').trimEnd().split(/\r?\n/);
  assert.equal(rows.length,1,`${id} must ship blank without example or production data`);
  assert.ok(rows[0].split(',').length>=20,`${id} needs a useful multi-field header`);
}
console.log('SOP learner pack and controlled-Drive provenance boundary: PASS.');
