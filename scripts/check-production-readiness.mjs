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

console.log(JSON.stringify({
  mode: 'informational-readiness-report',
  blocking: false,
  productionReadyClaim: registry.productionReady === true,
  openObservationCount: observations.length,
  observations
}, null, 2));
