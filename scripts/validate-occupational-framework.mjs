import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const errors = [];
const mappings = [
  ['content/proficiency-levels', 'schemas/proficiency-level.schema.json'],
  ['content/occupations', 'schemas/occupation.schema.json'],
  ['content/job-roles', 'schemas/job-role.schema.json'],
  ['content/job-tasks', 'schemas/job-task.schema.json']
];
const ajv = new Ajv2020({allErrors: true, strict: false});
const objects = new Map();

function filesIn(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
}

for (const [dir, schemaRel] of mappings) {
  const schema = JSON.parse(fs.readFileSync(path.join(root, schemaRel), 'utf8'));
  const validate = ajv.compile(schema);
  for (const name of filesIn(dir)) {
    const rel = path.join(dir, name);
    const data = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
    if (!validate(data)) {
      for (const issue of validate.errors ?? []) errors.push(`${rel}${issue.instancePath || '/'}: ${issue.message}`);
    }
    if (objects.has(data.id)) errors.push(`${rel}: duplicate occupational id ${data.id}`);
    objects.set(data.id, data);
  }
}

const competencyDir = path.join(root, 'content/competencies');
const competencyIds = new Set(filesIn('content/competencies').map((name) => JSON.parse(fs.readFileSync(path.join(competencyDir, name), 'utf8')).id));

for (const [id, data] of objects) {
  if (id.startsWith('OCC-')) for (const role of data.roles ?? []) if (!objects.has(role)) errors.push(`${id}: missing role ${role}`);
  if (id.startsWith('ROLE-')) {
    if (!objects.has(data.occupation)) errors.push(`${id}: missing occupation ${data.occupation}`);
    for (const task of data.tasks ?? []) if (!objects.has(task)) errors.push(`${id}: missing task ${task}`);
  }
  if (id.startsWith('TASK-')) {
    if (!objects.has(data.proficiency)) errors.push(`${id}: missing proficiency ${data.proficiency}`);
    for (const competency of data.competencies ?? []) if (!competencyIds.has(competency)) errors.push(`${id}: missing competency ${competency}`);
  }
}

if (errors.length) {
  console.error('Occupational framework validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Occupational framework validation passed for ${objects.size} object(s).`);
