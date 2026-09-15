import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const ajv = new Ajv2020({allErrors: true, strict: false});
addFormats(ajv);

const specs = [
  {
    registry: 'registry/LINKS.json',
    schema: 'schemas/link-record.schema.json',
    key: 'links'
  },
  {
    registry: 'registry/DATASETS.json',
    schema: 'schemas/dataset-record.schema.json',
    key: 'datasets'
  }
];

const failures = [];
let validated = 0;

for (const spec of specs) {
  const registryPath = path.join(root, spec.registry);
  const schemaPath = path.join(root, spec.schema);
  if (!fs.existsSync(registryPath)) {
    failures.push(`${spec.registry}: missing registry`);
    continue;
  }
  if (!fs.existsSync(schemaPath)) {
    failures.push(`${spec.schema}: missing schema`);
    continue;
  }

  let registry;
  let schema;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (error) {
    failures.push(`${spec.registry}: invalid JSON: ${error.message}`);
    continue;
  }

  const items = registry?.[spec.key];
  if (!Array.isArray(items)) {
    failures.push(`${spec.registry}: expected array at .${spec.key}`);
    continue;
  }

  const validate = ajv.compile(schema);
  const ids = new Set();
  for (const [index, item] of items.entries()) {
    validated += 1;
    if (ids.has(item.id)) failures.push(`${spec.registry}[${index}]: duplicate id ${item.id}`);
    ids.add(item.id);

    if (!validate(item)) {
      for (const issue of validate.errors ?? []) {
        failures.push(`${spec.registry}[${index}]${issue.instancePath || '/'}: ${issue.message}`);
      }
    }

    if (item.verified === true && item.status !== 'verified') {
      failures.push(`${spec.registry}[${index}]: verified=true requires status=verified`);
    }
    if (item.status === 'verified' && item.httpStatus != null && item.httpStatus < 200) {
      failures.push(`${spec.registry}[${index}]: verified link cannot have HTTP ${item.httpStatus}`);
    }
  }
}

if (failures.length) {
  console.error(`Ingestion registry validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Ingestion registry validation passed for ${validated} record(s).`);
