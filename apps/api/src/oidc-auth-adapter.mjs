import { createRemoteJWKSet, jwtVerify } from 'jose';

function required(env, name) {
  const value = String(env[name] ?? '').trim();
  if (!value) throw new Error(`OIDC configuration requires ${name}`);
  return value;
}

function httpsUrl(value, name) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${name} must be a valid URL`); }
  if (parsed.protocol !== 'https:') throw new Error(`${name} must use https`);
  return parsed;
}

function algorithmsFromEnvironment(env) {
  const raw = String(env.THC_OIDC_ALGORITHMS ?? 'RS256').trim();
  const algorithms = raw.split(',').map((value) => value.trim()).filter(Boolean);
  if (algorithms.length === 0) throw new Error('THC_OIDC_ALGORITHMS must contain at least one JWS algorithm');
  if (algorithms.includes('none')) throw new Error('THC_OIDC_ALGORITHMS cannot include none');
  return [...new Set(algorithms)];
}

function clockToleranceFromEnvironment(env) {
  const value = Number(env.THC_OIDC_CLOCK_TOLERANCE_SECONDS ?? 5);
  if (!Number.isFinite(value) || value < 0 || value > 300) {
    throw new Error('THC_OIDC_CLOCK_TOLERANCE_SECONDS must be between 0 and 300');
  }
  return value;
}

function tokenScopes(payload) {
  const scopes = new Set();
  if (typeof payload?.scope === 'string') {
    for (const scope of payload.scope.split(/\s+/).filter(Boolean)) scopes.add(scope);
  }
  const scp = payload?.scp;
  if (typeof scp === 'string') {
    for (const scope of scp.split(/\s+/).filter(Boolean)) scopes.add(scope);
  } else if (Array.isArray(scp)) {
    for (const scope of scp) if (typeof scope === 'string' && scope.trim()) scopes.add(scope.trim());
  }
  return [...scopes];
}

function bearerToken(req) {
  const header = String(req?.headers?.authorization ?? '');
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export async function createRequestAuthorizer({ env = process.env, jwks = null } = {}) {
  const issuer = required(env, 'THC_OIDC_ISSUER');
  const audience = required(env, 'THC_OIDC_AUDIENCE');
  httpsUrl(issuer, 'THC_OIDC_ISSUER');
  const algorithms = algorithmsFromEnvironment(env);
  const clockTolerance = clockToleranceFromEnvironment(env);

  let keySet = jwks;
  if (!keySet) {
    const jwksUri = required(env, 'THC_OIDC_JWKS_URI');
    keySet = createRemoteJWKSet(httpsUrl(jwksUri, 'THC_OIDC_JWKS_URI'), {
      timeoutDuration: 5000,
      cooldownDuration: 30000,
      cacheMaxAge: 600000
    });
  }

  return async function authorize(req, requiredScope) {
    const token = bearerToken(req);
    if (!token) return { ok: false, status: 401, error: 'authentication-required' };

    try {
      const { payload } = await jwtVerify(token, keySet, {
        issuer,
        audience,
        algorithms,
        requiredClaims: ['sub', 'exp'],
        clockTolerance
      });
      const subject = String(payload.sub ?? '').trim();
      if (!subject) return { ok: false, status: 401, error: 'invalid-authentication' };
      const scopes = tokenScopes(payload);
      if (requiredScope && !scopes.includes(requiredScope)) {
        return { ok: false, status: 403, error: 'insufficient-scope' };
      }
      return { ok: true, subject, scopes };
    } catch {
      return { ok: false, status: 401, error: 'invalid-authentication' };
    }
  };
}
