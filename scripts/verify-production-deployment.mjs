import assert from 'node:assert/strict';

function required(name) {
  const value = String(process.env[name] ?? '').trim();
  if (!value) throw new Error(`Production smoke verification requires ${name}`);
  return value;
}

function parseHttpsBase(value) {
  let url;
  try { url = new URL(value); }
  catch { throw new Error('THC_PRODUCTION_BASE_URL must be a valid URL'); }
  if (url.protocol !== 'https:') throw new Error('THC_PRODUCTION_BASE_URL must use https');
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url;
}

async function request(base, pathname, { token, expectedStatus, timeoutMs = 15_000 } = {}) {
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(new URL(pathname, base), {
    method: 'GET',
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch {}
  if (expectedStatus != null && response.status !== expectedStatus) {
    throw new Error(`${pathname} returned HTTP ${response.status}; expected ${expectedStatus}`);
  }
  return { response, body, text };
}

const base = parseHttpsBase(required('THC_PRODUCTION_BASE_URL'));
const expectedSha = required('THC_EXPECTED_SOURCE_SHA');
if (!/^[0-9a-f]{40}$/i.test(expectedSha)) throw new Error('THC_EXPECTED_SOURCE_SHA must be a full 40-character Git SHA');

const learnerToken = String(process.env.THC_SMOKE_LEARNER_TOKEN ?? '').trim();
const adminToken = String(process.env.THC_SMOKE_ADMIN_TOKEN ?? '').trim();

const checks = [];
function pass(name, details = {}) {
  checks.push({ name, status: 'pass', ...details });
}

const health = await request(base, '/healthz', { expectedStatus: 200 });
assert.equal(health.body?.ok, true, '/healthz must report ok=true');
pass('healthz', { httpStatus: 200 });

const ready = await request(base, '/readyz', { expectedStatus: 200 });
assert.equal(ready.body?.ok, true, '/readyz must report ok=true');
pass('readyz', {
  httpStatus: 200,
  schemaVersion: ready.body?.schemaVersion ?? ready.body?.databaseSchemaVersion ?? null
});

const build = await request(base, '/api/build-info', { expectedStatus: 200 });
const observedSha = String(
  build.body?.sourceSha ??
  build.body?.source?.sha ??
  build.body?.gitSha ??
  ''
).trim();
assert.equal(observedSha.toLowerCase(), expectedSha.toLowerCase(), 'deployed source SHA must match THC_EXPECTED_SOURCE_SHA');
pass('build-identity', { httpStatus: 200, sourceSha: observedSha });

const noLearner = await request(base, '/api/v1/me/progress', { expectedStatus: 401 });
pass('learner-auth-required', { httpStatus: noLearner.response.status });

const badLearner = await request(base, '/api/v1/me/progress', {
  token: 'not-a-valid-production-access-token',
  expectedStatus: 401
});
pass('invalid-token-rejected', { httpStatus: badLearner.response.status });

const noAdmin = await request(base, '/api/v1/admin/diagnostics', { expectedStatus: 401 });
pass('admin-auth-required', { httpStatus: noAdmin.response.status });

if (learnerToken) {
  const learner = await request(base, '/api/v1/me/progress', { token: learnerToken, expectedStatus: 200 });
  assert.ok(Array.isArray(learner.body?.progress), 'authenticated learner progress response must contain progress[]');
  pass('learner-token', { httpStatus: learner.response.status, recordCount: learner.body.progress.length });

  const learnerAdmin = await request(base, '/api/v1/admin/diagnostics', { token: learnerToken });
  assert.ok([401, 403].includes(learnerAdmin.response.status), 'learner token must not access admin diagnostics');
  pass('learner-admin-separation', { httpStatus: learnerAdmin.response.status });
}

if (adminToken) {
  const admin = await request(base, '/api/v1/admin/diagnostics', { token: adminToken, expectedStatus: 200 });
  pass('admin-token-mfa-and-scope', { httpStatus: admin.response.status });
}

const report = {
  schemaVersion: 1,
  kind: 'production-smoke-verification',
  observedAt: new Date().toISOString(),
  baseUrl: base.origin + base.pathname,
  expectedSourceSha: expectedSha,
  checks,
  optionalAuthenticatedChecks: {
    learnerTokenProvided: Boolean(learnerToken),
    adminTokenProvided: Boolean(adminToken)
  },
  readinessSemantics: 'This report is deployment evidence only. It does not by itself authorize credential issuance or mark human/validation gates complete.'
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
