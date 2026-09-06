import fs from 'node:fs';
import path from 'node:path';

export function loadPerformanceDefinition({ root = process.cwd(), assessmentId } = {}) {
  if (!/^(PRACTICAL|CAPSTONE)-[A-Z0-9-]+$/.test(String(assessmentId ?? ''))) return null;
  const fullPath = path.join(root, 'content', 'performance-assessments', `${assessmentId}.json`);
  if (!fs.existsSync(fullPath)) return null;
  const definition = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  return definition?.id === assessmentId ? definition : null;
}

export function loadRequiredPerformanceDefinitions({ root = process.cwd(), credential } = {}) {
  const required = new Set(credential?.eligibility?.requiredPerformanceAssessments ?? []);
  const definitions = new Map();
  if (required.size === 0) return definitions;

  for (const assessmentId of required) {
    const definition = loadPerformanceDefinition({ root, assessmentId });
    if (definition) definitions.set(assessmentId, definition);
  }

  return definitions;
}
