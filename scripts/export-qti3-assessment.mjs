import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { assertAcademicQtiExportable, itemToQti3, qtiManifest } from './lib/qti3-export.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || true];
}));
const assessmentId = String(args.assessment || '').trim();
if (!/^ASSESS-[A-Z0-9-]+$/.test(assessmentId)) {
  throw new Error('Usage: node scripts/export-qti3-assessment.mjs --assessment=ASSESS-... [--out=dist/qti]'); 
}

const root = process.cwd();
const assessmentPath = path.join(root, 'content', 'assessments', `${assessmentId}.json`);
if (!fs.existsSync(assessmentPath)) throw new Error(`Assessment not found: ${assessmentId}`);
const assessment = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));
const items = (assessment.items || []).map((id) => {
  const itemPath = path.join(root, 'content', 'questions', `${id}.json`);
  if (!fs.existsSync(itemPath)) throw new Error(`${assessmentId}: missing item ${id}`);
  return JSON.parse(fs.readFileSync(itemPath, 'utf8'));
});

assertAcademicQtiExportable({ assessment, items });

const baseOut = path.resolve(root, String(args.out || 'dist/qti3'));
const out = path.join(baseOut, assessment.id);
const itemsOut = path.join(out, 'items');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(itemsOut, { recursive: true });

for (const item of items) {
  fs.writeFileSync(
    path.join(itemsOut, `${item.id}.xml`),
    itemToQti3(item, { shuffle: assessment.randomizeChoices === true }),
  );
}
fs.writeFileSync(path.join(out, 'imsmanifest.xml'), qtiManifest({ assessment, items }));
fs.writeFileSync(path.join(out, 'EXPORT-NOTICE.json'), JSON.stringify({
  format: 'QTI 3.0 item package prototype',
  sourceAssessment: assessment.id,
  sourceVersion: assessment.version,
  exportedAt: new Date().toISOString(),
  itemCount: items.length,
  canonicalSourceRemains: 'THC Academy JSON',
  validationBoundary: 'Generated XML should be checked with the official 1EdTech QTI validation/conformance tooling before interchange use.',
  securityBoundary: 'Credential assessment banks and non-active items are intentionally refused by this exporter.'
}, null, 2) + '\n');

console.log(JSON.stringify({ assessmentId: assessment.id, itemCount: items.length, output: path.relative(root, out) }, null, 2));
