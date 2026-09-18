import fs from 'node:fs';

const lockPath = new URL('../visuals/COURSE1-VISUAL-COPY-LOCK-13-18.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

const errors = [];
if (data.courseId !== 'COURSE-LH-TECH1-001') errors.push('Unexpected courseId.');
if (!Array.isArray(data.assets) || data.assets.length !== 6) errors.push('Expected six governed assets (13-18).');

const expected = new Map([
  ['VIS-LH-TECH1-001-13-EQUIPMENT-PREUSE', 5],
  ['VIS-LH-TECH1-001-14-OPERATOR-VS-MAINTENANCE', 5],
  ['VIS-LH-TECH1-001-15-FAULT-REPORT', 5],
  ['VIS-LH-TECH1-001-16-RECORD-CORRECTION', 6],
  ['VIS-LH-TECH1-001-17-SHIFT-HANDOFF', 6],
  ['VIS-LH-TECH1-001-18-INTEGRATED-WORKFLOW', 6]
]);

const prohibitedBranding = data.global?.prohibitedBranding || [];
for (const asset of data.assets || []) {
  const wantedModule = expected.get(asset.conceptId);
  if (!wantedModule) {
    errors.push(`Unexpected conceptId: ${asset.conceptId}`);
    continue;
  }
  if (asset.moduleNumber !== wantedModule) errors.push(`${asset.conceptId}: moduleNumber must be ${wantedModule}.`);
  if (!String(asset.header || '').includes(`Module ${wantedModule}`)) errors.push(`${asset.conceptId}: header must contain Module ${wantedModule}.`);
  const serialized = JSON.stringify(asset).toLowerCase();
  for (const phrase of prohibitedBranding) {
    if (serialized.includes(String(phrase).toLowerCase())) errors.push(`${asset.conceptId}: prohibited credential branding appears: "${phrase}".`);
  }
  if (!asset.boundary || String(asset.boundary).length < 40) errors.push(`${asset.conceptId}: missing substantive authority/process boundary.`);
  if (!Array.isArray(asset.prohibitedClaims) || asset.prohibitedClaims.length < 2) errors.push(`${asset.conceptId}: prohibitedClaims must contain at least two checks.`);
}

if (errors.length) {
  console.error('Course 1 visual copy lock failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Course 1 visual copy lock: PASS (assets 13-18).');
