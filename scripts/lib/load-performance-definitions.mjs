import fs from 'node:fs';
import path from 'node:path';

export function loadRequiredPerformanceDefinitions({ root = process.cwd(), credential } = {}) {
  const definitions = new Map();
  for (const assessmentId of credential?.eligibility?.requiredPerformanceAssessments ?? []) {
    const fullPath = path.join(root, 'content', 'performance-assessments', `${assessmentId}.json`);
    if (!fs.existsSync(fullPath)) continue;
    const definition = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    definitions.set(assessmentId, definition);
  }
  return definitions;
}
