import assert from 'node:assert/strict';
import fs from 'node:fs';

const mappings = new Map([
  ['PRACTICAL-TECH1-A', 'DL-TECH1-CROP-INSPECTION-001'],
  ['PRACTICAL-TECH1-B', 'DL-TECH1-WATER-IRRIGATION-001'],
  ['PRACTICAL-TECH1-C', 'DL-TECH1-IPM-SCOUTING-001'],
  ['PRACTICAL-TECH1-D', 'DL-TECH1-PROPAGATION-BATCH-001'],
  ['PRACTICAL-TECH1-E', 'DL-TECH1-CANOPY-WORK-ORDER-001'],
  ['PRACTICAL-TECH1-F', 'DL-TECH1-HARVEST-HANDOFF-001'],
  ['CAPSTONE-TECH1-SHIFT-001', 'DL-TECH1-INTEGRATED-SHIFT-001']
]);

for (const [performanceId, downloadId] of mappings) {
  const performance = JSON.parse(fs.readFileSync(`content/performance-assessments/${performanceId}.json`, 'utf8'));
  const download = JSON.parse(fs.readFileSync(`content/downloads/${downloadId}.json`, 'utf8'));
  const csvPath = `apps/web/public${download.path}`;
  assert.equal(performance.extensions.credentialUseAuthorized, false, `${performanceId} must remain development-only`);
  assert.equal(download.status, 'published');
  assert.equal(download.releaseStatus, 'public');
  assert.equal(download.accessibilityStatus, 'partial');
  assert.ok(fs.existsSync(csvPath), `${downloadId} must resolve to a CSV file`);
  const [header, ...rows] = fs.readFileSync(csvPath, 'utf8').trimEnd().split(/\r?\n/);
  assert.ok(header.split(',').length >= 18, `${downloadId} needs a useful multi-field evidence header`);
  assert.equal(rows.length, 0, `${downloadId} must not ship learner or example production data`);
  assert.ok(download.courseMappings.includes('COURSE-LH-TECH1-007'), `${downloadId} must support the integrated lab`);
  assert.ok(download.instructions.length >= 4);
  assert.ok(download.limitations.length >= 2);
}

console.log('Technician I learner download pack: PASS (7 published/public academic job aids mapped to Practicals A–F and the integrated capstone).');
