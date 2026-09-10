import assert from 'node:assert/strict';
import fs from 'node:fs';

const serverSource = fs.readFileSync('apps/api/src/server.mjs', 'utf8');
const specSource = fs.readFileSync('openapi/academy-api.yaml', 'utf8');

function normalizeServerPath(pathname) {
  return pathname.replace(/:([A-Za-z][A-Za-z0-9]*)/g, '{$1}');
}

function extractServerOperations(source) {
  const operations = new Set();
  const routePattern = /route\s*=\s*'((?:GET|POST|PUT|PATCH|DELETE) (?:\/healthz|\/readyz|\/api\/v1\/[^']+))'/g;
  for (const match of source.matchAll(routePattern)) {
    const [method, pathname] = match[1].split(' ');
    operations.add(`${method} ${normalizeServerPath(pathname)}`);
  }
  return operations;
}

function extractSpecOperations(source) {
  const operations = new Set();
  let insidePaths = false;
  let currentPath = null;
  for (const line of source.split(/\r?\n/)) {
    if (line === 'paths:') {
      insidePaths = true;
      continue;
    }
    if (insidePaths && /^[A-Za-z][A-Za-z0-9_-]*:$/.test(line)) break;
    if (!insidePaths) continue;
    const pathMatch = line.match(/^  (\/[^:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }
    const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/i);
    if (currentPath && methodMatch) operations.add(`${methodMatch[1].toUpperCase()} ${currentPath}`);
  }
  return operations;
}

const serverOperations = extractServerOperations(serverSource);
const specOperations = extractSpecOperations(specSource);

assert.equal(serverOperations.size, 17, `Expected 17 routable server operations, found ${serverOperations.size}: ${[...serverOperations].sort().join(', ')}`);
assert.equal(specOperations.size, 17, `Expected 17 documented OpenAPI operations, found ${specOperations.size}: ${[...specOperations].sort().join(', ')}`);

const undocumented = [...serverOperations].filter((operation) => !specOperations.has(operation)).sort();
const nonexistent = [...specOperations].filter((operation) => !serverOperations.has(operation)).sort();
assert.deepEqual(undocumented, [], `Server operations missing from OpenAPI: ${undocumented.join(', ')}`);
assert.deepEqual(nonexistent, [], `OpenAPI operations not implemented by server: ${nonexistent.join(', ')}`);

assert.match(specSource, /^openapi:\s*3\.1\.0/m, 'Academy API specification must use OpenAPI 3.1.0');
assert.match(specSource, /bearerAuth:\n\s+type:\s+http\n\s+scheme:\s+bearer/m, 'Bearer security scheme must be documented');
const scopeAnnotations = [...specSource.matchAll(/^\s+x-required-scope:\s+([^\s]+)\s*$/gm)].map((match) => match[1]);
assert.equal(scopeAnnotations.length, 14, `Expected scope annotations for 14 protected operations, found ${scopeAnnotations.length}`);
for (const scope of ['learner:read', 'learner:write', 'assessor:write', 'admin:read', 'admin:write']) {
  assert.ok(scopeAnnotations.includes(scope), `OpenAPI specification is missing protected scope ${scope}`);
}
const bearerRequirements = [...specSource.matchAll(/^\s+- bearerAuth:\s*\[\]\s*$/gm)];
assert.equal(bearerRequirements.length, 14, `Expected bearer security requirement on 14 protected operations, found ${bearerRequirements.length}`);
for (const forbidden of ['correctAnswer', 'answerKey', 'scoringKey', 'SERVICE_TOKEN', 'OIDC_CLIENT_SECRET']) {
  assert.equal(specSource.includes(forbidden), false, `OpenAPI specification must not expose ${forbidden}`);
}

console.log(`Academy API OpenAPI parity passed for ${serverOperations.size} operations with ${scopeAnnotations.length} protected scope contracts.`);
