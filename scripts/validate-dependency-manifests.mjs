import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const schemaPath = path.join(root, 'schemas/dependency-manifest.schema.json');
const manifestDir = path.join(root, 'automation/curriculum-ingestion/manifests');

const ajv = new Ajv2020({allErrors: true, strict: false});
addFormats(ajv);
const validate = ajv.compile(JSON.parse(fs.readFileSync(schemaPath, 'utf8')));
const failures = [];
let count = 0;

for (const name of fs.readdirSync(manifestDir).filter((value) => value.endsWith('.json')).sort()) {
  count += 1;
  const full = path.join(manifestDir, name);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    failures.push(`${name}: invalid JSON: ${error.message}`);
    continue;
  }
  if (!validate(data)) {
    for (const issue of validate.errors ?? []) failures.push(`${name}${issue.instancePath || '/'}: ${issue.message}`);
  }
}

if (failures.length) {
  console.error(`Dependency manifest validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Dependency manifest validation passed for ${count} manifest(s).`);
