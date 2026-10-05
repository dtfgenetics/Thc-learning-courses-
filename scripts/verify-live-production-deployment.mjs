const DEFAULT_TIMEOUT_MS = 10_000;

function requireHttpsBaseUrl(value) {
  const raw = String(value ?? '').trim().replace(/\/$/, '');
  if (!raw) throw new Error('Production verification requires --base-url or THC_PUBLIC_BASE_URL');
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error('Production base URL must be a valid URL'); }
  if (parsed.protocol !== 'https:') throw new Error('Production base URL must use https');
  return parsed.toString().replace(/\/$/, '');
}

function requireSourceSha(value) {
  const sha = String(value ?? '').trim();
  if (!/^[0-9a-fA-F]{40}$/.test(sha)) throw new Error('Expected source SHA must be exactly 40 hexadecimal characters');
  return sha.toLowerCase();
}

async function safeJson(response) {
  try { return await response.json(); } catch { return null; }
}

async function request(fetchImpl, url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const started = Date.now();
  const response = await fetchImpl(url, {
    redirect: 'error',
    ...options,
    signal: options.signal ?? AbortSignal.timeout(timeoutMs)
  });
  const body = await safeJson(response);
  return {
    status: response.status,
    ok: response.ok,
    durationMs: Date.now() - started,
    requestId: response.headers.get('x-request-id') ?? body?.requestId ?? null,
    wwwAuthenticate: response.headers.get('www-authenticate') ?? null,
    contentTypeOptions: response.headers.get('x-content-type-options') ?? null,
    referrerPolicy: response.headers.get('referrer-policy') ?? null,
    body
  };
}

function check(name, passed, details = {}) {
  return { name, passed: passed === true, ...details };
}

export async function verifyLiveProduction({
  baseUrl,
  expectedSourceSha,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const base = requireHttpsBaseUrl(baseUrl);
  const sourceSha = requireSourceSha(expectedSourceSha);
  const checks = [];

  const build = await request(fetchImpl, `${base}/api/build-info`, {
    headers: { accept: 'application/json', 'user-agent': 'thc-academy-production-verifier/1.0' }
  }, timeoutMs);
  const exactIdentity = build.status === 200
    && build.body?.exactIdentityAvailable === true
    && typeof build.body?.buildId === 'string'
    && build.body.buildId.length > 0
    && String(build.body?.sourceSha ?? '').toLowerCase() === sourceSha;
  checks.push(check('exact-build-identity', exactIdentity, {
    status: build.status,
    buildId: typeof build.body?.buildId === 'string' ? build.body.buildId : null,
    sourceSha: typeof build.body?.sourceSha === 'string' ? build.body.sourceSha : null
  }));

  const health = await request(fetchImpl, `${base}/healthz`, {
    headers: { accept: 'application/json', 'user-agent': 'thc-academy-production-verifier/1.0' }
  }, timeoutMs);
  checks.push(check('healthz', health.status === 200 && health.body?.ok === true, {
    status: health.status,
    requestId: health.requestId,
    durationMs: health.durationMs
  }));

  const readiness = await request(fetchImpl, `${base}/readyz`, {
    headers: { accept: 'application/json', 'user-agent': 'thc-academy-production-verifier/1.0' }
  }, timeoutMs);
  checks.push(check('readyz-schema-v7', readiness.status === 200 && readiness.body?.ok === true && String(readiness.body?.schemaVersion ?? '') === '7', {
    status: readiness.status,
    requestId: readiness.requestId,
    durationMs: readiness.durationMs,
    schemaVersion: readiness.body?.schemaVersion == null ? null : String(readiness.body.schemaVersion)
  }));

  const anonymousAdmin = await request(fetchImpl, `${base}/api/v1/admin/diagnostics`, {
    headers: { accept: 'application/json', 'user-agent': 'thc-academy-production-verifier/1.0' }
  }, timeoutMs);
  checks.push(check('anonymous-admin-denied', anonymousAdmin.status === 401 && /^Bearer\b/i.test(String(anonymousAdmin.wwwAuthenticate ?? '')), {
    status: anonymousAdmin.status,
    requestId: anonymousAdmin.requestId,
    bearerChallengePresent: /^Bearer\b/i.test(String(anonymousAdmin.wwwAuthenticate ?? ''))
  }));

  const headersSafe = [health, readiness, anonymousAdmin].every((r) =>
    r.contentTypeOptions === 'nosniff' && r.referrerPolicy === 'no-referrer'
  );
  checks.push(check('security-headers', headersSafe));

  const passed = checks.every((x) => x.passed);
  return {
    verificationType: 'external-tokenless-production-smoke',
    observedAt: new Date().toISOString(),
    baseUrl: base,
    expectedSourceSha: sourceSha,
    passed,
    checks,
    safeForEvidenceAttachment: true,
    secretsIncluded: false,
    limitations: [
      'This smoke test does not validate authenticated learner/evaluator/admin success paths.',
      'This smoke test does not prove MFA enforcement, row-level isolation, secure assessment bank behavior, backup/restore, monitoring, credential signing, revocation persistence, or independent security review.',
      'A passing result is deployment evidence for the checked endpoints only and does not authorize professional credential issuance.'
    ]
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    out[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = await verifyLiveProduction({
      baseUrl: args['base-url'] ?? process.env.THC_PUBLIC_BASE_URL,
      expectedSourceSha: args['source-sha'] ?? process.env.ACADEMY_SOURCE_REF,
      timeoutMs: args['timeout-ms'] ? Number(args['timeout-ms']) : DEFAULT_TIMEOUT_MS
    });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (!result.passed) process.exitCode = 1;
  } catch (error) {
    console.error(`Live production verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
