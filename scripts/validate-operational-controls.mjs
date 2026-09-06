import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readiness = JSON.parse(fs.readFileSync(path.join(root, 'registry/system-readiness.json'), 'utf8'));
const failures = [];

function requireFile(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) failures.push(`missing required operational control file: ${rel}`);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

const server = requireFile('apps/api/src/server.mjs');
const security = requireFile('apps/api/src/security.mjs');
const limiter = requireFile('apps/api/src/rate-limit.mjs');
const apiTest = requireFile('scripts/test-api-security.mjs');
const incident = requireFile('docs/INCIDENT-RESPONSE.md');

if (readiness.areas?.api?.gates?.rateLimiting === true && !limiter.includes('createFixedWindowRateLimiter')) {
  failures.push('api.rateLimiting is true without the rate limiter implementation');
}
if (readiness.areas?.api?.gates?.authentication === true && !security.includes('createServiceTokenAuthorizer')) {
  failures.push('api.authentication is true without the service authorizer implementation');
}
if (readiness.areas?.api?.gates?.observability === true && !server.includes('http.request.completed')) {
  failures.push('api.observability is true without structured request completion logging');
}
if ((readiness.areas?.api?.gates?.rateLimiting === true || readiness.areas?.api?.gates?.authentication === true || readiness.areas?.api?.gates?.observability === true) && !apiTest.includes('API security, privacy, rate limiting and observability tests passed')) {
  failures.push('API control readiness is true without the executable API control regression test');
}

const requiredRunbookSections = [
  '## Severity levels',
  '## Detection and declaration',
  '## Containment',
  '## Eradication and recovery',
  '## Credential signing key compromise',
  '## Database or privacy incident',
  '## Credential issuance or revocation integrity incident',
  '## Curriculum or assessment content integrity incident',
  '## Communications',
  '## Post-incident review'
];
if (readiness.areas?.operations?.gates?.incidentResponseRunbook === true) {
  for (const heading of requiredRunbookSections) {
    if (!incident.includes(heading)) failures.push(`incident response runbook missing section: ${heading}`);
  }
}

if (failures.length) {
  console.error('Operational control validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Operational control validation passed');
