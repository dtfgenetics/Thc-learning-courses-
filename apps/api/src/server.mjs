import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { publicCredentialView } from '../../../packages/domain/credential-runtime.mjs';
import { createFixedWindowRateLimiter } from './rate-limit.mjs';
import { createServiceTokenAuthorizer, serviceTokensFromEnvironment } from './security.mjs';
import { isPersistenceUnavailableError } from './persistence-errors.mjs';
import { loadProductionApiOptions } from './bootstrap.mjs';

const root = process.cwd();
const port = Number(process.env.PORT ?? 8787);
const credentialDefinition = JSON.parse(fs.readFileSync(path.join(root, 'content/credentials/CRED-CULT-FOUNDATIONS-001.json'), 'utf8'));

export function createDevelopmentCredentialStore() {
  const records = new Map();
  return {
    kind: 'development-memory',
    async ping() { return true; },
    getByVerificationId(verificationId) { return records.get(verificationId) ?? null; },
    register(record) { records.set(record.verificationId, record); return record; },
    count() { return records.size; }
  };
}

const developmentCredentialStore = createDevelopmentCredentialStore();

function resolveCredentialStore(explicitStore, env = process.env) {
  if (explicitStore) return explicitStore;
  if (env.NODE_ENV === 'production') throw new Error('Production API requires an explicit persistent credentialStore');
  return developmentCredentialStore;
}

export function registerCredentialForDevelopment(record) {
  if (process.env.NODE_ENV === 'production') throw new Error('Development credential adapter is disabled in production');
  return developmentCredentialStore.register(record);
}

function setSecurityHeaders(res, requestId) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('x-request-id', requestId);
}

function json(res, status, body, extraHeaders = {}) {
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

function rateLimitKey(req) { return req.socket?.remoteAddress || 'unknown'; }
function applyRateLimitHeaders(res, result) {
  res.setHeader('ratelimit-limit', String(result.limit));
  res.setHeader('ratelimit-remaining', String(result.remaining));
  res.setHeader('ratelimit-reset', String(Math.ceil(result.resetAt / 1000)));
}
function defaultLogger(entry) { process.stdout.write(`${JSON.stringify(entry)}\n`); }

export function createHandler({
  credentialStore = null,
  env = process.env,
  limiter = createFixedWindowRateLimiter(),
  authorize = null,
  logger = defaultLogger,
  nowNs = () => process.hrtime.bigint()
} = {}) {
  const resolvedCredentialStore = resolveCredentialStore(credentialStore, env);
  const resolvedAuthorize = authorize ?? createServiceTokenAuthorizer({ tokens: serviceTokensFromEnvironment(env) });

  return async function handler(req, res) {
    const startedAt = nowNs();
    const requestId = crypto.randomUUID();
    let route = 'unmatched';
    setSecurityHeaders(res, requestId);

    res.once('finish', () => {
      const durationMs = Number(nowNs() - startedAt) / 1_000_000;
      logger({ level: 'info', event: 'http.request.completed', requestId, method: req.method, route, statusCode: res.statusCode, durationMs: Number(durationMs.toFixed(3)) });
    });

    try {
      let url;
      try { url = new URL(req.url, 'http://localhost'); } catch {
        route = 'invalid-url';
        return json(res, 400, { error: 'invalid-url', requestId });
      }

      if (req.method === 'GET' && url.pathname === '/healthz') {
        route = 'GET /healthz';
        return json(res, 200, { ok: true, requestId });
      }

      if (req.method === 'GET' && url.pathname === '/readyz') {
        route = 'GET /readyz';
        if (typeof resolvedCredentialStore.ping !== 'function') return json(res, 503, { ok: false, error: 'readiness-check-unavailable', requestId });
        const ready = await resolvedCredentialStore.ping();
        return json(res, ready ? 200 : 503, ready ? { ok: true, requestId } : { ok: false, error: 'dependency-unavailable', requestId });
      }

      if (url.pathname.startsWith('/api/')) {
        const rate = limiter.check(rateLimitKey(req));
        applyRateLimitHeaders(res, rate);
        if (!rate.allowed) {
          route = 'rate-limited-api';
          return json(res, 429, { error: 'rate-limit-exceeded', requestId }, { 'retry-after': String(rate.retryAfterSeconds) });
        }
      }

      const credentialMatch = url.pathname.match(/^\/api\/v1\/credentials\/([A-Za-z0-9_-]+)$/);
      if (req.method === 'GET' && credentialMatch) {
        route = 'GET /api/v1/credentials/:verificationId';
        const record = await resolvedCredentialStore.getByVerificationId(credentialMatch[1]);
        if (!record) return json(res, 404, { error: 'credential-not-found', requestId });
        return json(res, 200, publicCredentialView(record, credentialDefinition));
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/admin/diagnostics') {
        route = 'GET /api/v1/admin/diagnostics';
        const auth = resolvedAuthorize(req, 'admin:read');
        if (!auth.ok) {
          if (auth.status === 401) res.setHeader('www-authenticate', 'Bearer realm="thc-academy-api"');
          return json(res, auth.status, { error: auth.error, requestId });
        }
        return json(res, 200, {
          ok: true,
          service: 'thc-academy-api',
          storageAdapter: resolvedCredentialStore.kind ?? 'unknown',
          credentialCount: typeof resolvedCredentialStore.count === 'function' ? await resolvedCredentialStore.count() : null,
          authenticatedSubject: auth.subject,
          requestId
        });
      }

      route = `${req.method ?? 'UNKNOWN'} unmatched`;
      return json(res, 404, { error: 'not-found', requestId });
    } catch (error) {
      const dependencyUnavailable = isPersistenceUnavailableError(error);
      logger({ level: 'error', event: 'http.request.failed', requestId, method: req.method, route, statusCode: dependencyUnavailable ? 503 : 500, errorType: error?.name ?? 'Error', errorCode: error?.code ?? 'UNEXPECTED_ERROR' });
      if (!res.headersSent) return json(res, dependencyUnavailable ? 503 : 500, { error: dependencyUnavailable ? 'service-unavailable' : 'internal-error', requestId });
      res.destroy();
    }
  };
}

export function createApiServer(options = {}) { return http.createServer(createHandler(options)); }

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  const apiOptions = await loadProductionApiOptions(process.env);
  createApiServer(apiOptions).listen(port, () => {
    process.stdout.write(`${JSON.stringify({ level: 'info', event: 'api.started', port, mode: process.env.NODE_ENV === 'production' ? 'production' : 'development' })}\n`);
  });
}
