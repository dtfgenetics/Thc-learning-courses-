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

function csvValues(value, fallback = '') {
  return [...new Set(String(value ?? fallback).split(',').map((entry) => entry.trim()).filter(Boolean))];
}

function algorithmsFromEnvironment(env) {
  const algorithms = csvValues(env.THC_OIDC_ALGORITHMS, 'RS256');
  if (algorithms.length === 0) throw new Error('THC_OIDC_ALGORITHMS must contain at least one JWS algorithm');
  if (algorithms.includes('none')) throw new Error('THC_OIDC_ALGORITHMS cannot include none');
  return algorithms;
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

function authenticationMethods(payload) {
  if (Array.isArray(payload?.amr)) return payload.amr.map(String).map((value) => value.trim()).filter(Boolean);
  if (typeof payload?.amr === 'string') return payload.amr.split(/\s+/).filter(Boolean);
  return [];
}

function isPrivilegedScope(scope) {
  const value = String(scope ?? '');
  return value.startsWith('admin:') || value.startsWith('assessor:');
}

function hasPrivilegedMfa(payload, acceptedAmr, acceptedAcr) {
  const methods = new Set(authenticationMethods(payload));
  if (acceptedAmr.some((value) => methods.has(value))) return true;
  const acr = String(payload?.acr ?? '').trim();
  return Boolean(acr && acceptedAcr.includes(acr));
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
  const privilegedMfaAmrValues = csvValues(env.THC_OIDC_PRIVILEGED_MFA_AMR_VALUES, 'mfa');
  const privilegedMfaAcrValues = csvValues(env.THC_OIDC_PRIVILEGED_MFA_ACR_VALUES);
  if (privilegedMfaAmrValues.length === 0 && privilegedMfaAcrValues.length === 0) {
    throw new Error('Privileged OIDC access requires at least one configured MFA amr or acr assurance value');
  }

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
      const privilegedMfa = hasPrivilegedMfa(payload, privilegedMfaAmrValues, privilegedMfaAcrValues);
      if (isPrivilegedScope(requiredScope) && !privilegedMfa) {
        return { ok: false, status: 403, error: 'privileged-mfa-required' };
      }
      return {
        ok: true,
        subject,
        scopes,
        assurance: {
          mfa: privilegedMfa,
          amr: authenticationMethods(payload),
          acr: payload.acr == null ? null : String(payload.acr)
        }
      };
    } catch {
      return { ok: false, status: 401, error: 'invalid-authentication' };
    }
  };
}
