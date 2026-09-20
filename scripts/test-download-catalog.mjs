import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { createAcademyWebServer } from '../apps/web/server.mjs';

const expectedIds = [
  'DL-DAILY-CULTIVATION-LOG-001',
  'DL-ENVIRONMENT-LOG-001',
  'DL-IRRIGATION-ROOTZONE-LOG-001',
  'DL-SCOUTING-ESCALATION-LOG-001',
  'DL-SOP-AUTHORING-001',
  'DL-SOP-DEVIATION-001',
  'DL-SOP-EXECUTION-001',
  'DL-SOP-TRAINING-001',
  'DL-TECH1-CANOPY-WORK-ORDER-001',
  'DL-TECH1-CROP-INSPECTION-001',
  'DL-TECH1-HARVEST-HANDOFF-001',
  'DL-TECH1-INTEGRATED-SHIFT-001',
  'DL-TECH1-IPM-SCOUTING-001',
  'DL-TECH1-PROPAGATION-BATCH-001',
  'DL-TECH1-WATER-IRRIGATION-001',
  'DL-TECH2-DIAGNOSTIC-WORKUP-001',
  'DL-TECH2-EQUIPMENT-VERIFICATION-001',
  'DL-TECH2-FERTIGATION-ROOTZONE-001',
  'DL-TECH2-IPM-BIOSECURITY-001',
  'DL-TECH2-POSTHARVEST-DEVIATION-001',
  'DL-TECH2-PROP-CANOPY-001',
  'DL-TECH2-SIMULATION-EVIDENCE-001',
  'DL-TECH2-TRACEABILITY-HANDOFF-001'
];

const html = fs.readFileSync(path.join(process.cwd(), 'apps/web/public/index.html'), 'utf8');
const portal = fs.readFileSync(path.join(process.cwd(), 'apps/web/public/portal.js'), 'utf8');
const portalStyles = fs.readFileSync(path.join(process.cwd(), 'apps/web/public/portal.css'), 'utf8');
const tech2CourseIds = Array.from({ length: 8 }, (_, index) => `COURSE-LH-TECH2-${String(index + 1).padStart(3, '0')}`);
const downloadRecords = expectedIds.map((id) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/downloads', `${id}.json`), 'utf8')));
const tech1CourseIds = Array.from({ length: 6 }, (_, index) => `COURSE-LH-TECH1-${String(index + 2).padStart(3, '0')}`);
for (const courseId of tech1CourseIds) {
  assert.ok(downloadRecords.some((record) => record.courseMappings?.includes(courseId)), `${courseId} should have at least one mapped learner download`);
}
for (const courseId of tech2CourseIds) {
  assert.ok(downloadRecords.some((record) => record.courseMappings?.includes(courseId)), `${courseId} should have at least one mapped learner download`);
}
assert.match(html, /id="tab-resources"[^>]*aria-pressed="false"/, 'Academy navigation should expose the Downloads view');
assert.match(portal, /fetch\('\/api\/downloads'/, 'Downloads view should load the safe metadata API');
assert.match(portal, /action\.download\s*=\s*''/, 'Download links should use browser download behavior');
assert.match(portal, /setAttribute\('aria-label', `Download \$\{download\.title\} as CSV`\)/, 'Download links need specific accessible names');
assert.match(portalStyles, /\.download-action:focus-visible\s*\{/, 'Download actions need visible keyboard focus');
assert.match(portalStyles, /@media\s*\(max-width:\s*620px\)[\s\S]*\.download-card dl\s*\{\s*grid-template-columns:\s*1fr/, 'Download metadata should reflow on narrow screens');

async function start(env) {
  const server = createAcademyWebServer({ env });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

for (const id of expectedIds) {
  const record = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/downloads', `${id}.json`), 'utf8'));
  assert.equal(record.status, 'draft');
  assert.equal(record.releaseStatus, 'internal-preview');
  assert.match(record.path, /^\/downloads\/[A-Za-z0-9._-]+\.csv$/);
  assert.ok(record.courseMappings.length > 0, `${id} should map to at least one course`);
  const file = path.join(process.cwd(), 'apps/web/public', record.path.slice(1));
  assert.ok(fs.existsSync(file), `${id} should reference an existing file`);
  const header = fs.readFileSync(file, 'utf8').split(/\r?\n/, 1)[0];
  assert.ok(header.includes(','), `${id} CSV should have a multi-column header`);
  assert.equal(header.startsWith('='), false, `${id} CSV should not begin with an executable formula`);
}

const staging = await start({ ...process.env, NODE_ENV: 'development', ACADEMY_PREVIEW_DRAFTS: '1' });
try {
  const base = `http://127.0.0.1:${staging.address().port}`;
  const response = await fetch(`${base}/api/downloads`);
  assert.equal(response.status, 200);
  const catalog = await response.json();
  assert.deepEqual(catalog.downloads.map((entry) => entry.id).sort(), [...expectedIds].sort());
  for (const entry of catalog.downloads) {
    assert.equal(Object.hasOwn(entry, 'localPath'), false, `${entry.id} must not expose a filesystem path`);
    const metadata = await fetch(`${base}/api/downloads/${entry.id}`);
    assert.equal(metadata.status, 200, `${entry.id} metadata should be available in staging`);
    const file = await fetch(`${base}${entry.path}`);
    assert.equal(file.status, 200, `${entry.path} should be available in staging`);
    assert.match(file.headers.get('content-type') ?? '', /^text\/csv/);
  }
  assert.equal((await fetch(`${base}/downloads/../server.mjs`)).status, 404, 'download route must reject traversal');
} finally {
  staging.close();
  await once(staging, 'close');
}

const production = await start({ ...process.env, NODE_ENV: 'production', ACADEMY_PREVIEW_DRAFTS: '0' });
try {
  const base = `http://127.0.0.1:${production.address().port}`;
  const catalog = await (await fetch(`${base}/api/downloads`)).json();
  assert.deepEqual(catalog.downloads, [], 'draft internal downloads must not appear in production');
  for (const id of expectedIds) assert.equal((await fetch(`${base}/api/downloads/${id}`)).status, 404);
  assert.equal((await fetch(`${base}/downloads/daily-cultivation-observation-log.csv`)).status, 404);
} finally {
  production.close();
  await once(production, 'close');
}

console.log('Learner download schema, metadata API, file routes, and production visibility boundary passed.');
