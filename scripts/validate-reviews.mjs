import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reviewDir = path.join(root, 'content/reviews');
const warnings = [];

const reviewFiles = fs.existsSync(reviewDir)
  ? fs.readdirSync(reviewDir).filter((name) => name.endsWith('.json')).sort()
  : [];

for (const name of reviewFiles) {
  const rel = path.join('content/reviews', name);
  try {
    JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  } catch (error) {
    warnings.push(`${rel}: invalid JSON (${error.message})`);
  }
}

if (warnings.length) {
  console.warn('Review-note validation warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

console.log(`Review notes checked. ${reviewFiles.length} JSON file(s) found. Review metadata is optional and non-blocking.`);
