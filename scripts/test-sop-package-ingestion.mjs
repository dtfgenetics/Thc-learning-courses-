import assert from 'node:assert/strict';
import fs from 'node:fs';

const register=JSON.parse(fs.readFileSync('registry/sop-package-ingestion.json','utf8'));
const expectedDownloads=['DL-SOP-AUTHORING-001','DL-SOP-EXECUTION-001','DL-SOP-DEVIATION-001','DL-SOP-TRAINING-001'];
const expectedIds=['GROW-000','GROW-001','GROW-010','GROW-011','GROW-020','GROW-030','GROW-031','GROW-032','GROW-033','GROW-034','GROW-040','GROW-042','GROW-050','GROW-060','GROW-070','GROW-080','GROW-090','GROW-100','GROW-110','GROW-120','GROW-130','GROW-140','GROW-150','GROW-160'];
const repoDraftIds=['GROW-000','GROW-011','GROW-020','GROW-030','GROW-031','GROW-032','GROW-033','GROW-040','GROW-080','GROW-090','GROW-100','GROW-110','GROW-120','GROW-130','GROW-140','GROW-150','GROW-160'];

assert.equal(register.targetCount,24);
assert.equal(register.remainingUnidentifiedTargets,0);
assert.equal(register.externalPackages.length,24);
assert.deepEqual(register.externalPackages.map(x=>x.externalId),expectedIds);
assert.deepEqual(register.repositoryLearnerPack.downloadIds,expectedDownloads);
assert.equal(register.summary.identifiedTargets,24);
assert.equal(register.summary.controlledSourceOrPackageLocated,7);
assert.equal(register.summary.provenanceReconciledExactArtifactSets,4);
assert.equal(register.summary.driveRegisterOriginallySourceMappedPlannedTargets,17);
assert.equal(register.summary.sourceMappedPlannedPackages,0);
assert.equal(register.summary.remainingPackageAuthoringNotStarted,0);
assert.equal(register.summary.repositoryDraftPackagesCreated,17);
assert.equal(register.summary.releaseApprovedPackages,0);

for(const item of register.externalPackages){
  assert.match(item.externalId,/^GROW-\d{3}$/);
  assert.ok(item.title?.length>3);
  assert.equal(item.releaseState,'blocked',`${item.externalId}: inventory reconciliation or draft authoring must not imply release approval`);
  assert.ok(item.sourceState);
  assert.ok(item.ingestionStatus);
}
for(const id of repoDraftIds){
  const item=register.externalPackages.find(x=>x.externalId===id);
  assert.equal(item.ingestionStatus,'repository-draft-package-created-review-blocked');
  assert.ok(item.repositoryDraftManifest);
  assert.ok(fs.existsSync(item.repositoryDraftManifest),`${id}: draft package manifest missing`);
}
for(const id of ['GROW-042','GROW-050','GROW-060','GROW-070']){
  const item=register.externalPackages.find(x=>x.externalId===id);
  assert.equal(item.sourceState,'controlled-drive-source-located');
  assert.equal(item.ingestionStatus,'provenance-recorded-review-blocked');
  for(const key of ['scientificSop','learnerGuide','qaReview','handoff']) assert.ok(item.controlledSourceIds?.[key],`${id}: missing ${key}`);
  assert.notEqual(item.qaDisposition,'approved');
}
for(const id of expectedDownloads){
  const record=JSON.parse(fs.readFileSync(`content/downloads/${id}.json`,'utf8'));
  assert.equal(record.status,'draft');
  assert.equal(record.releaseStatus,'internal-preview');
  assert.equal(record.accessibilityStatus,'partial');
  assert.ok(record.courseMappings.includes('COURSE-PRO-SOP-001'));
  assert.deepEqual(record.resourceMappings,[]);
  assert.ok(record.limitations.some(entry=>/not|does not|alone/i.test(entry)));
  const rows=fs.readFileSync(`apps/web/public${record.path}`,'utf8').trimEnd().split(/\r?\n/);
  assert.equal(rows.length,1);
  assert.ok(rows[0].split(',').length>=20);
}
console.log('SOP controlled-target inventory: PASS (24/24 target scopes identified; 17 repository draft packages created; four exact Drive packages reconciled; release remains fail-closed).');
