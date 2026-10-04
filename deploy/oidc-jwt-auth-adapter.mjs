import crypto from 'node:crypto';

function required(env, name) {
  const value = String(env[name] ?? '').trim();
  if (!value) throw new Error(`OIDC authentication configuration requires ${name}`);
  return value;
}

function decodeBase64Url(value) {
  return Buffer.from(String(value), 'base64url');
}

function decodeJsonPart(value, label) {
  try { return JSON.parse(decodeBase64Url(value).toString('utf8')); }
  catch { throw new Error(`invalid JWT ${label}`); }
}

function normalizeAudience(value) {
  if (Array.isArray(value)) return value.map(String);
  return value == null ? [] : [String(value)];
}

function claimScopes(payload) {
  const values = new Set();
  if (typeof payload.scope === 'string') {
    for (const value of payload.scope.split(/\s+/)) if (value) values.add(value);
  }
  for (const field of ['scopes', 'permissions']) {
    if (Array.isArray(payload[field])) {
      for (const value of payload[field]) if (typeof value === 'string' && value) values.add(value);
    }
  }
  return [...values];
}

function hasMfa(payload) {
  if (payload.mfa_verified === true) return true;
  if (String(payload.aal ?? '').toLowerCase() === 'aal2') return true;
  const amr = Array.isArray(payload.amr) ? payload.amr : [];
  return amr.some((entry) => {
    const value = typeof entry === 'string' ? entry : entry?.method;
    return ['mfa', 'totp', 'otp', 'webauthn', 'hwk'].includes(String(value ?? '').toLowerCase());
  });
}

function bearerToken(req) {
  const header = String(req?.headers?.authorization ?? '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function verifySignature({ signingInput, signature, header, publicKey }) {
  if (header.alg === 'RS256') {
    return crypto.verify('RSA-SHA256', Buffer.from(signingInput), publicKey, signature);
  }
  if (header.alg === 'ES256') {
    return crypto.verify(
      'SHA256',
      Buffer.from(signingInput),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      signature
    );
  }
  return false;
}

async function loadJwks(env) {
  const inline = String(env.THC_AUTH_JWKS_JSON ?? '').trim();
  if (inline) {
    let parsed;
    try { parsed = JSON.parse(inline); }
    catch { throw new Error('THC_AUTH_JWKS_JSON must contain valid JWKS JSON'); }
    return parsed;
  }

  const url = required(env, 'THC_AUTH_JWKS_URL');
  let parsedUrl;
  try { parsedUrl = new URL(url); }
  catch { throw new Error('THC_AUTH_JWKS_URL must be a valid URL'); }
  if (parsedUrl.protocol !== 'https:') throw new Error('THC_AUTH_JWKS_URL must use https');

  const response = await fetch(parsedUrl, {
    headers: { accept: 'application/json', 'user-agent': 'thc-academy-auth-bootstrap/1.0' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Unable to load OIDC JWKS: HTTP ${response.status}`);
  return response.json();
}

function buildKeyMap(jwks) {
  if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    throw new Error('OIDC JWKS must contain at least one key');
  }
  const keys = new Map();
  for (const jwk of jwks.keys) {
    if (!jwk?.kid || !['RSA', 'EC'].includes(jwk.kty)) continue;
    try {
      keys.set(String(jwk.kid), crypto.createPublicKey({ key: jwk, format: 'jwk' }));
    } catch {
      throw new Error(`Unable to import OIDC key ${String(jwk.kid)}`);
    }
  }
  if (keys.size === 0) throw new Error('OIDC JWKS contains no supported signing keys');
  return keys;
}

export async function createRequestAuthorizer({ env = process.env } = {}) {
  const issuer = required(env, 'THC_AUTH_ISSUER').replace(/\/$/, '');
  let issuerUrl;
  try { issuerUrl = new URL(issuer); }
  catch { throw new Error('THC_AUTH_ISSUER must be a valid URL'); }
  if (issuerUrl.protocol !== 'https:') throw new Error('THC_AUTH_ISSUER must use https');

  const audience = String(env.THC_AUTH_AUDIENCE ?? '').trim();
  const clockSkewSeconds = Number(env.THC_AUTH_CLOCK_SKEW_SECONDS ?? 60);
  if (!Number.isFinite(clockSkewSeconds) || clockSkewSeconds < 0 || clockSkewSeconds > 300) {
    throw new Error('THC_AUTH_CLOCK_SKEW_SECONDS must be between 0 and 300');
  }

  const keys = buildKeyMap(await loadJwks(env));

  return function authorize(req, requiredScope) {
    const token = bearerToken(req);
    if (!token) return { ok: false, status: 401, error: 'authentication-required' };
    if (token.length > 16_384) return { ok: false, status: 401, error: 'invalid-access-token' };

    const parts = token.split('.');
    if (parts.length !== 3) return { ok: false, status: 401, error: 'invalid-access-token' };

    let header;
    let payload;
    try {
      header = decodeJsonPart(parts[0], 'header');
      payload = decodeJsonPart(parts[1], 'payload');
    } catch {
      return { ok: false, status: 401, error: 'invalid-access-token' };
    }

    if (!['RS256', 'ES256'].includes(header.alg) || typeof header.kid !== 'string') {
      return { ok: false, status: 401, error: 'unsupported-access-token' };
    }
    const key = keys.get(header.kid);
    if (!key) return { ok: false, status: 401, error: 'unknown-signing-key' };

    const signingInput = `${parts[0]}.${parts[1]}`;
    let validSignature = false;
    try {
      validSignature = verifySignature({
        signingInput,
        signature: decodeBase64Url(parts[2]),
        header,
        publicKey: key
      });
    } catch {
      validSignature = false;
    }
    if (!validSignature) return { ok: false, status: 401, error: 'invalid-access-token' };

    const now = Math.floor(Date.now() / 1000);
    if (String(payload.iss ?? '').replace(/\/$/, '') !== issuer) {
      return { ok: false, status: 401, error: 'invalid-token-issuer' };
    }
    if (typeof payload.exp !== 'number' || payload.exp < now - clockSkewSeconds) {
      return { ok: false, status: 401, error: 'access-token-expired' };
    }
    if (typeof payload.nbf === 'number' && payload.nbf > now + clockSkewSeconds) {
      return { ok: false, status: 401, error: 'access-token-not-active' };
    }
    if (audience && !normalizeAudience(payload.aud).includes(audience)) {
      return { ok: false, status: 401, error: 'invalid-token-audience' };
    }
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) {
      return { ok: false, status: 401, error: 'invalid-token-subject' };
    }

    const scopes = claimScopes(payload);
    if (requiredScope && !scopes.includes(requiredScope)) {
      return { ok: false, status: 403, error: 'insufficient-scope' };
    }

    return {
      ok: true,
      subject: payload.sub,
      scopes,
      mfaVerified: hasMfa(payload)
    };
  };
}
