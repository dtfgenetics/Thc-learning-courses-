import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const reviewRoot = path.join(root, 'automation/curriculum-ingestion/reviews');
const schemaPath = path.join(root, 'schemas/evidence-mapping-review.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv2020({allErrors: true, strict: false});
addFormats(ajv);
const validate = ajv.compile(schema);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.json') ? [full] : [];
  });
}

const failures = [];
const ids = new Set();
let count = 0;
for (const file of walk(reviewRoot).sort()) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${path.relative(root, file)}: invalid JSON: ${error.message}`);
    continue;
  }
  count += 1;
  if (!validate(data)) {
    for (const issue of validate.errors ?? []) {
      failures.push(`${path.relative(root, file)}${issue.instancePath || '/'}: ${issue.message}`);
    }
  }
  if (ids.has(data.id)) failures.push(`${path.relative(root, file)}: duplicate review id ${data.id}`);
  ids.add(data.id);
  const rel = path.relative(reviewRoot, file).replaceAll('\\', '/');
  if (rel.startsWith('approved/') && data.status !== 'approved') {
    failures.push(`${path.relative(root, file)}: files under reviews/approved must have status=approved`);
  }
}

if (failures.length) {
  console.error(`Evidence mapping review validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Evidence mapping review validation passed for ${count} review record(s).`);
