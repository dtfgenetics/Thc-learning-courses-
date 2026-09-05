import fs from 'node:fs';
import path from 'node:path';

const registry = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'registry/system-readiness.json'), 'utf8'));
const blockers = [];
for (const [areaName, area] of Object.entries(registry.areas ?? {})) {
  for (const [gateName, value] of Object.entries(area.gates ?? {})) {
    if (value !== true) blockers.push(`${areaName}.${gateName}`);
  }
}

const report = {
  productionReadyClaim: registry.productionReady === true,
  blockerCount: blockers.length,
  blockers
};
console.log(JSON.stringify(report, null, 2));

if (registry.productionReady === true && blockers.length > 0) {
  throw new Error(`Production readiness is true with ${blockers.length} unresolved gate(s).`);
}
