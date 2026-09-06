import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'registry/curriculum.json');
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

function idsIn(directory) {
  const full = path.join(root, directory);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')).id)
    .filter(Boolean)
    .sort();
}

const existing = fs.existsSync(registryPath)
  ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  : {};

const release = process.env.THC_REGISTRY_RELEASE || existing.release || 'academy-core-draft';
const status = process.env.THC_REGISTRY_STATUS || existing.status || 'draft';
const registry = { release, status };
for (const [field, directory] of Object.entries(mappings)) registry[field] = idsIn(directory);

const output = `${JSON.stringify(registry, null, 2)}\n`;
if (process.argv.includes('--write')) {
  fs.writeFileSync(registryPath, output);
  console.log(`Global curriculum registry rebuilt for ${release}.`);
} else {
  process.stdout.write(output);
}
