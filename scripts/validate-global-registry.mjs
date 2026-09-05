import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'registry/curriculum.json');
const errors = [];

if (!fs.existsSync(registryPath)) {
  console.error('Global curriculum registry validation failed:\n- registry/curriculum.json does not exist');
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const mappings = {
  courses: 'content/courses',
  modules: 'content/modules',
  lessons: 'content/lessons',
  competencies: 'content/competencies',
  learningObjectives: 'content/learning-objectives',
  claims: 'content/claims',
  assessments: 'content/assessments',
  questions: 'content/questions',
  references: 'content/references',
  programs: 'content/programs',
  credentials: 'content/credentials',
  issuers: 'content/issuer'
};

if (typeof registry.release !== 'string' || !registry.release.trim()) errors.push('registry/curriculum.json: release must be a non-empty string');
if (!['draft', 'release-candidate', 'published'].includes(registry.status)) errors.push(`registry/curriculum.json: unsupported status ${registry.status}`);

function actualIds(directory) {
  const full = path.join(root, directory);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const data = JSON.parse(fs.readFileSync(path.join(full, name), 'utf8'));
      if (!data.id) errors.push(`${path.join(directory, name)}: missing id while building global registry coverage`);
      return data.id;
    })
    .filter(Boolean)
    .sort();
}

for (const [field, directory] of Object.entries(mappings)) {
  const declared = registry[field];
  if (!Array.isArray(declared)) {
    errors.push(`registry/curriculum.json: ${field} must be an array`);
    continue;
  }

  const duplicateIds = declared.filter((id, index) => declared.indexOf(id) !== index);
  for (const id of [...new Set(duplicateIds)]) errors.push(`registry/curriculum.json: ${field} contains duplicate id ${id}`);

  const declaredSorted = [...declared].sort();
  const actual = actualIds(directory);
  const missing = actual.filter((id) => !declaredSorted.includes(id));
  const extra = declaredSorted.filter((id) => !actual.includes(id));

  for (const id of missing) errors.push(`registry/curriculum.json: ${field} is missing source object ${id}`);
  for (const id of extra) errors.push(`registry/curriculum.json: ${field} lists nonexistent source object ${id}`);
}

if (errors.length) {
  console.error('Global curriculum registry validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Global curriculum registry validation passed for ${registry.release}.`);
