import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const mappings = [
  ['content/assessments', 'schemas/assessment.schema.json'],
  ['content/claims', 'schemas/claim.schema.json'],
  ['content/competencies', 'schemas/competency.schema.json'],
  ['content/courses', 'schemas/course.schema.json'],
  ['content/credentials', 'schemas/credential.schema.json'],
  ['content/encyclopedia', 'schemas/encyclopedia-entry.schema.json'],
  ['content/glossary', 'schemas/glossary-entry.schema.json'],
  ['content/learning-objectives', 'schemas/learning-objective.schema.json'],
  ['content/lessons', 'schemas/lesson.schema.json'],
  ['content/modules', 'schemas/module.schema.json'],
  ['content/programs', 'schemas/program.schema.json'],
  ['content/questions', 'schemas/question.schema.json'],
  ['content/references', 'schemas/reference.schema.json']
];

const ajv = new Ajv2020({allErrors: true, strict: false});
addFormats(ajv);

const failures = [];
let validatedFiles = 0;

for (const [directory, schemaPath] of mappings) {
  const fullDir = path.join(root, directory);
  const fullSchema = path.join(root, schemaPath);
  if (!fs.existsSync(fullDir)) continue;
  if (!fs.existsSync(fullSchema)) {
    failures.push(`${schemaPath}: schema file is missing`);
    continue;
  }

  const schema = JSON.parse(fs.readFileSync(fullSchema, 'utf8'));
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (error) {
    failures.push(`${schemaPath}: schema compile failed: ${error.message}`);
    continue;
  }

  const files = fs.readdirSync(fullDir).filter((name) => name.endsWith('.json')).sort();
  for (const name of files) {
    const rel = path.join(directory, name);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(fullDir, name), 'utf8'));
    } catch (error) {
      failures.push(`${rel}: invalid JSON: ${error.message}`);
      continue;
    }
    validatedFiles += 1;
    if (!validate(data)) {
      for (const issue of validate.errors ?? []) {
        const where = issue.instancePath || '/';
        failures.push(`${rel}${where}: ${issue.message}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`JSON Schema validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`JSON Schema validation passed for ${validatedFiles} content file(s) across ${mappings.length} schema mappings.`);
