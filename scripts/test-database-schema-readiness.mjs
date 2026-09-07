import assert from 'node:assert/strict';
import fs from 'node:fs';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/server.mjs';

const schemaSql = fs.readFileSync('database/schema.sql', 'utf8');
for (const requiredFragment of [
  'rubric_id text',
  'rubric_version text',
  'delivery_mode text',
  'performance_assessment_results_delivery_mode_check',
  "values ('3', 'Performance assessment evaluator, rubric, and delivery provenance')",
  "'issued','valid','suspended','superseded','expired','revoked'",
  'idx_status_events_credential',
  "values ('4', 'Credential suspension and lifecycle history support')",
  'competency_version text',
  "values ('5', 'Versioned competency evidence and mastery persistence')"
]) {
  assert.equal(schemaSql.includes(requiredFragment), true, `database/schema.sql missing schema v5 contract fragment: ${requiredFragment}`);
}

async function requestReadiness(schemaVersion) {
  const credentialStore = {
    kind: 'test-persistent',
    async ping() { return true; },
    async schemaVersion() { return schemaVersion; },
    async getByVerificationId() { return null; }
  };
  const server = createApiServer({
    env: { NODE_ENV: 'production' },
    credentialStore,
    requiredSchemaVersion: '5',
    authorize: () => ({ ok: false, status: 401, error: 'authentication-required' }),
    logger: () => {}
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/readyz`);
    return { status: response.status, body: await response.json() };
  } finally {
    server.close();
    await once(server, 'close');
  }
}

const matching = await requestReadiness('5');
assert.equal(matching.status, 200);
assert.equal(matching.body.ok, true);
assert.equal(matching.body.schemaVersion, '5');

const stale = await requestReadiness('4');
assert.equal(stale.status, 503);
assert.equal(stale.body.error, 'database-schema-version-mismatch');
assert.equal(stale.body.requiredSchemaVersion, '5');
assert.equal(stale.body.actualSchemaVersion, '4');

const missing = await requestReadiness(null);
assert.equal(missing.status, 503);
assert.equal(missing.body.error, 'database-schema-version-mismatch');
assert.equal(missing.body.actualSchemaVersion, null);

console.log('Database schema v5 competency evidence and readiness gate passed.');
