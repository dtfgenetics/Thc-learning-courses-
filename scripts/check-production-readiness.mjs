import fs from 'node:fs';
import path from 'node:path';

const registryPath = path.join(process.cwd(), 'registry/system-readiness.json');
const registry = fs.existsSync(registryPath)
  ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  : {};

const observations = [];
for (const [areaName, area] of Object.entries(registry.areas ?? {})) {
  for (const [gateName, value] of Object.entries(area.gates ?? {})) {
    if (value !== true) observations.push(`${areaName}.${gateName}`);
  }
}

const productionReadyClaim = registry.productionReady === true;
const ready = productionReadyClaim && observations.length === 0;

console.log(JSON.stringify({
  mode: 'production-readiness-gate',
  blocking: true,
  ready,
  productionReadyClaim,
  openObservationCount: observations.length,
  observations
}, null, 2));

if (!ready) {
  console.error('Production readiness gate failed: unresolved production gates remain.');
  process.exit(1);
}

console.log('Production readiness gate passed.');
