import assert from 'node:assert/strict';
import { verifyLiveProduction } from './verify-live-production-deployment.mjs';

const sha = 'a'.repeat(40);

function response(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

const calls = [];
const goodFetch = async (url) => {
  calls.push(String(url));
  if (String(url).endsWith('/api/build-info')) {
    return response(200, { exactIdentityAvailable: true, buildId: 'build-001', sourceSha: sha });
  }
  if (String(url).endsWith('/healthz')) {
    return response(200, { ok: true, requestId: 'req-health' }, {
      'x-request-id': 'req-health',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    });
  }
  if (String(url).endsWith('/readyz')) {
    return response(200, { ok: true, schemaVersion: '7', requestId: 'req-ready' }, {
      'x-request-id': 'req-ready',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    });
  }
  if (String(url).endsWith('/api/v1/admin/diagnostics')) {
    return response(401, { error: 'missing-bearer-token', requestId: 'req-admin' }, {
      'x-request-id': 'req-admin',
      'www-authenticate': 'Bearer realm="thc-academy-api"',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    });
  }
  throw new Error(`Unexpected URL ${url}`);
};

const ok = await verifyLiveProduction({
  baseUrl: 'https://academy.dtfseeds.com/',
  expectedSourceSha: sha,
  fetchImpl: goodFetch,
  timeoutMs: 500
});
assert.equal(ok.passed, true);
assert.equal(ok.secretsIncluded, false);
assert.equal(ok.safeForEvidenceAttachment, true);
assert.equal(ok.expectedSourceSha, sha);
assert.equal(ok.checks.length, 5);
assert.equal(ok.checks.every((x) => x.passed), true);
assert.equal(calls.length, 4);
assert.equal(JSON.stringify(ok).includes('authorization'), false);
assert.equal(JSON.stringify(ok).includes('password'), false);

const wrongBuild = await verifyLiveProduction({
  baseUrl: 'https://academy.dtfseeds.com',
  expectedSourceSha: sha,
  fetchImpl: async (url) => {
    if (String(url).endsWith('/api/build-info')) {
      return response(200, { exactIdentityAvailable: true, buildId: 'build-002', sourceSha: 'b'.repeat(40) });
    }
    return goodFetch(url);
  },
  timeoutMs: 500
});
assert.equal(wrongBuild.passed, false);
assert.equal(wrongBuild.checks.find((x) => x.name === 'exact-build-identity')?.passed, false);

const unready = await verifyLiveProduction({
  baseUrl: 'https://academy.dtfseeds.com',
  expectedSourceSha: sha,
  fetchImpl: async (url) => {
    if (String(url).endsWith('/readyz')) {
      return response(503, { ok: false, error: 'database-schema-version-mismatch', schemaVersion: '6' }, {
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer'
      });
    }
    return goodFetch(url);
  },
  timeoutMs: 500
});
assert.equal(unready.passed, false);
assert.equal(unready.checks.find((x) => x.name === 'readyz-schema-v7')?.passed, false);

await assert.rejects(
  () => verifyLiveProduction({ baseUrl: 'http://academy.dtfseeds.com', expectedSourceSha: sha, fetchImpl: goodFetch }),
  /must use https/
);
await assert.rejects(
  () => verifyLiveProduction({ baseUrl: 'https://academy.dtfseeds.com', expectedSourceSha: 'main', fetchImpl: goodFetch }),
  /exactly 40/
);

console.log('Live production deployment verification harness: PASS');
