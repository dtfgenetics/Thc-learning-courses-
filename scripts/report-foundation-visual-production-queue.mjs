import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registries = [
  'visuals/COURSE3-ASSET-REGISTRY.json',
  'visuals/COURSE4-ASSET-REGISTRY.json',
  'visuals/COURSE5-ASSET-REGISTRY.json',
  'visuals/COURSE6-ASSET-REGISTRY.json'
];
const json = process.argv.includes('--json');
const check = process.argv.includes('--check');

const queue = [];
const invalid = [];
let foundationTargets = 0;
let producedApproved = 0;

for (const rel of registries) {
  const registry = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  for (const asset of registry.assets ?? []) {
    if (!String(asset.id ?? '').startsWith('VIS-FOUNDATION-')) continue;
    if (asset.status === 'retired') continue;

    foundationTargets += 1;
    const row = {
      registry: rel,
      courseId: registry.courseId,
      id: asset.id,
      title: asset.title,
      status: asset.status,
      primaryLessons: asset.primaryLessons ?? [],
      visualType: asset.productionSpec?.visualType ?? null,
      requiredFormats: asset.productionSpec?.requiredFormats ?? [],
      svgAllowed: asset.productionSpec?.svgAllowed,
      minimumShortSidePx: asset.productionSpec?.minimumShortSidePx ?? null,
      references: asset.references ?? [],
      learnerPath: asset.learnerPath ?? null,
      releaseApproved: asset.rasterReplacement?.releaseApproved === true
    };

    if (asset.status !== 'produced' || !row.releaseApproved || !row.learnerPath) queue.push(row);
    else producedApproved += 1;

    if (asset.productionSpec?.svgAllowed !== false) {
      invalid.push({ id: asset.id, issue: 'svg-policy-not-explicitly-disabled' });
    }
    const formats = new Set(asset.productionSpec?.requiredFormats ?? []);
    if (![...formats].some((format) => ['png','webp','jpeg','jpg'].includes(String(format).toLowerCase()))) {
      invalid.push({ id: asset.id, issue: 'no-approved-raster-format-required' });
    }
    if ((asset.productionSpec?.minimumShortSidePx ?? 0) < 1600) {
      invalid.push({ id: asset.id, issue: 'minimum-resolution-below-1600px' });
    }
    if (!(asset.primaryLessons ?? []).length) {
      invalid.push({ id: asset.id, issue: 'no-primary-lesson-mapping' });
    }
    if (!(asset.references ?? []).length) {
      invalid.push({ id: asset.id, issue: 'no-reference-basis' });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: 'foundation-visual-production-courses-3-through-6',
  summary: {
    foundationTargets,
    producedApproved,
    remainingProductionQueue: queue.length,
    invalidProductionSpecs: invalid.length,
    productionComplete: queue.length === 0 && invalid.length === 0
  },
  queue,
  invalid
};

if (json) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  console.log('Foundation visual production queue');
  console.log(`Remaining raster targets: ${queue.length}`);
  console.log(`Invalid production specs: ${invalid.length}`);
  for (const item of queue) {
    console.log(`- ${item.id} | ${item.primaryLessons.join(', ')} | ${item.visualType ?? 'unspecified'}`);
  }
}

if (check && (queue.length || invalid.length)) process.exitCode = 1;
