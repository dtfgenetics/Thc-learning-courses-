import fs from 'node:fs';
import path from 'node:path';

export function loadRequiredPerformanceDefinitions({ root = process.cwd(), credential } = {}) {
  const required = new Set(credential?.eligibility?.requiredPerformanceAssessments ?? []);
  const definitions = new Map();
  if (required.size === 0) return definitions;

  const directory = path.join(root, 'content', 'performance-assessments');
  if (!fs.existsSync(directory)) return definitions;

  for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith('.json')).sort()) {
    const fullPath = path.join(directory, name);
    const definition = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (required.has(definition.id)) definitions.set(definition.id, definition);
  }

  return definitions;
}
