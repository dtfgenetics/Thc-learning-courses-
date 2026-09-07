import fs from 'node:fs';

const policy = JSON.parse(fs.readFileSync('registry/monitoring-policy.json', 'utf8'));
const server = fs.readFileSync('apps/api/src/server.mjs', 'utf8');
const credentialWriter = fs.readFileSync('apps/api/src/postgres-credential-writer.mjs', 'utf8');
const failures = [];
const requiredIds = new Set(['api-health','api-readiness','http-error-rate','http-latency','database-connectivity','credential-worker-failure']);
const ids = new Set((policy.requiredSignals ?? []).map((row) => row.id));
for (const id of requiredIds) if (!ids.has(id)) failures.push(`missing monitoring signal ${id}`);
if (!server.includes("url.pathname === '/healthz'")) failures.push('API health endpoint /healthz is missing');
if (!server.includes("url.pathname === '/readyz'")) failures.push('API readiness endpoint /readyz is missing');
if (!server.includes("event: 'http.request.completed'")) failures.push('structured HTTP completion telemetry is missing');
if (!credentialWriter.includes('createPostgresCredentialWriter')) failures.push('production credential writer source is unavailable for failure monitoring');
for (const [key, value] of Object.entries(policy.requirements ?? {})) if (value !== true) failures.push(`monitoring policy requirement ${key} must be true`);
if (failures.length) {
  console.error('Monitoring policy validation failed:');
  failures.forEach((row) => console.error(`- ${row}`));
  process.exit(1);
}
console.log(`Monitoring policy validation passed for ${ids.size} required signal(s).`);
