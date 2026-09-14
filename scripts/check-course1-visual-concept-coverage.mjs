import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const coveragePath = path.join(root, 'visuals', 'COURSE1-VISUAL-CONCEPT-COVERAGE.json');
const registryPath = path.join(root, 'visuals', 'ASSET-REGISTRY.json');

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const errors = [];

if (coverage.courseId !== 'COURSE-LH-TECH1-001') errors.push('Unexpected Course 1 visual coverage courseId.');
if (!coverage.policy?.assetCountIsNotAQualityTarget) errors.push('Coverage policy must reject asset-count-only completion.');
if (!coverage.policy?.combinedAssetsAllowed) errors.push('Coverage policy must permit intentional combined instructional assets.');
if (!Array.isArray(coverage.concepts) || coverage.concepts.length !== 18) errors.push(`Expected exactly 18 primary Course 1 visual concepts; found ${coverage.concepts?.length ?? 0}.`);

const registryById = new Map((registry.assets ?? []).map((asset) => [asset.id, asset]));
const conceptIds = new Set();
for (const concept of coverage.concepts ?? []) {
  if (!concept.conceptId || conceptIds.has(concept.conceptId)) errors.push(`Duplicate or missing conceptId: ${concept.conceptId ?? '<missing>'}`);
  conceptIds.add(concept.conceptId);
  if (!Array.isArray(concept.lessonIds) || concept.lessonIds.length === 0) errors.push(`${concept.conceptId} has no canonical lesson mapping.`);
  if (!concept.publicAsset?.startsWith('/assets/course1/')) errors.push(`${concept.conceptId} has invalid public asset path.`);
  if (!String(concept.status ?? '').startsWith('deployed')) errors.push(`${concept.conceptId} is not deployed.`);
  const registryAsset = registryById.get(concept.registryAssetId);
  if (!registryAsset) {
    errors.push(`${concept.conceptId} references missing registry asset ${concept.registryAssetId}.`);
    continue;
  }
  if (registryAsset.status !== 'produced') errors.push(`${concept.conceptId} registry asset ${concept.registryAssetId} is not produced.`);
  if (registryAsset.learnerPath !== concept.publicAsset) errors.push(`${concept.conceptId} public path disagrees with registry asset ${concept.registryAssetId}.`);
  const physicalPath = path.join(root, 'apps', 'web', 'public', concept.publicAsset.replace(/^\/assets\//, 'assets/'));
  if (!fs.existsSync(physicalPath)) errors.push(`${concept.conceptId} public asset file is missing: ${physicalPath}`);
  for (const lessonId of concept.lessonIds ?? []) {
    const lessonPath = path.join(root, 'content', 'lessons', `${lessonId}.json`);
    if (!fs.existsSync(lessonPath)) errors.push(`${concept.conceptId} references missing lesson ${lessonId}.`);
  }
  if (concept.status === 'deployed-combined' && !concept.coverageNote && ['VIS-LH-TECH1-001-04-SDS-ANATOMY','VIS-LH-TECH1-001-06-CLEAN-DIRTY-FLOW','VIS-LH-TECH1-001-11-MOVEMENT-RECORD'].includes(concept.conceptId)) {
    errors.push(`${concept.conceptId} combined coverage requires an explicit instructional boundary note.`);
  }
}

for (let i = 1; i <= 18; i += 1) {
  const prefix = `VIS-LH-TECH1-001-${String(i).padStart(2, '0')}-`;
  if (![...conceptIds].some((id) => id.startsWith(prefix))) errors.push(`Missing primary visual concept number ${String(i).padStart(2, '0')}.`);
}

if (errors.length) {
  console.error('Course 1 visual concept coverage FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Course 1 visual concept coverage passed: ${coverage.concepts.length} concepts across ${new Set(coverage.concepts.map((c) => c.registryAssetId)).size} produced public assets.`);
