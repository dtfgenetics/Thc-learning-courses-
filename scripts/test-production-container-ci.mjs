import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/validate.yml', 'utf8');

assert.match(
  workflow,
  /docker\/build-push-action@/,
  'quality workflow must build the production container'
);
assert.match(
  workflow,
  /file:\s*deploy\/Dockerfile\.production/,
  'quality workflow must build deploy/Dockerfile.production'
);
assert.match(
  workflow,
  /push:\s*false/,
  'quality workflow must not publish PR validation images'
);

console.log('Production container CI build contract: PASS');
