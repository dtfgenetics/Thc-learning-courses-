import crypto from 'node:crypto';

export const MIN_SERVICE_TOKEN_LENGTH = 32;

function safeEqualText(left, right) {
  const leftDigest = crypto.createHash('sha256').update(String(left)).digest();
  const rightDigest = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

export function createServiceTokenAuthorizer({ tokens = [] } = {}) {
  const configured = tokens
    .filter((entry) => entry?.token)
    .map((entry) => {
      if (String(entry.token).length < MIN_SERVICE_TOKEN_LENGTH) {
        throw new Error(`Service tokens must be at least ${MIN_SERVICE_TOKEN_LENGTH} characters`);
      }
      return {
        token: String(entry.token),
        subject: entry.subject ?? 'service',
        scopes: new Set(entry.scopes ?? [])
      };
    });

  return function authorize(req, requiredScope) {
    if (configured.length === 0) {
      return { ok: false, status: 503, error: 'authentication-not-configured' };
    }

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return { ok: false, status: 401, error: 'authentication-required' };
    }

    const presented = header.slice('Bearer '.length).trim();
    if (!presented) return { ok: false, status: 401, error: 'authentication-required' };

    const match = configured.find((entry) => safeEqualText(entry.token, presented));
    if (!match) return { ok: false, status: 401, error: 'invalid-authentication' };
    if (requiredScope && !match.scopes.has(requiredScope)) {
      return { ok: false, status: 403, error: 'insufficient-scope' };
    }

    return { ok: true, subject: match.subject, scopes: [...match.scopes] };
  };
}

export function serviceTokensFromEnvironment(env = process.env) {
  const tokens = [];
  if (env.THC_API_ADMIN_TOKEN) {
    tokens.push({
      token: env.THC_API_ADMIN_TOKEN,
      subject: 'admin-service',
      scopes: ['admin:read']
    });
  }
  return tokens;
}
