import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequestAuthorizer } from '../deploy/oidc-jwt-auth-adapter.mjs';
import { enforceProductionAuthAssurance } from '../apps/api/src/bootstrap.mjs';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt({ privateKey, kid, payload }) {
  const header = encode({ alg: 'RS256', typ: 'JWT', kid });
  const body = encode(payload);
  const input = `${header}.${body}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
  return `${input}.${signature}`;
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const kid = 'test-key-1';
const jwk = publicKey.export({ format: 'jwk' });
jwk.kid = kid;
jwk.alg = 'RS256';
jwk.use = 'sig';

const env = {
  THC_AUTH_ISSUER: 'https://issuer.example.test',
  THC_AUTH_AUDIENCE: 'thc-academy',
  THC_AUTH_JWKS_JSON: JSON.stringify({ keys: [jwk] }),
  THC_AUTH_CLOCK_SKEW_SECONDS: '0'
};

const rawAuthorize = await createRequestAuthorizer({ env });
const authorize = enforceProductionAuthAssurance(rawAuthorize);
const now = Math.floor(Date.now() / 1000);

const learnerToken = signJwt({
  privateKey,
  kid,
  payload: {
    iss: env.THC_AUTH_ISSUER,
    aud: env.THC_AUTH_AUDIENCE,
    sub: 'learner-test-1',
    exp: now + 300,
    scope: 'learner:read learner:write'
  }
});

const learnerReq = { headers: { authorization: `Bearer ${learnerToken}` } };
const learnerResult = authorize(learnerReq, 'learner:read');
assert.equal(learnerResult.ok, true);
assert.equal(learnerResult.subject, 'learner-test-1');
assert.equal(learnerResult.mfaVerified, false);

const deniedScope = authorize(learnerReq, 'evaluator:read');
assert.equal(deniedScope.ok, false);
assert.equal(deniedScope.status, 403);
assert.equal(deniedScope.error, 'insufficient-scope');

const adminWithoutMfa = signJwt({
  privateKey,
  kid,
  payload: {
    iss: env.THC_AUTH_ISSUER,
    aud: env.THC_AUTH_AUDIENCE,
    sub: 'admin-test-1',
    exp: now + 300,
    scope: 'admin:read admin:write'
  }
});
const adminDenied = authorize({ headers: { authorization: `Bearer ${adminWithoutMfa}` } }, 'admin:read');
assert.equal(adminDenied.ok, false);
assert.equal(adminDenied.status, 403);
assert.equal(adminDenied.error, 'admin-mfa-required');

const adminWithMfa = signJwt({
  privateKey,
  kid,
  payload: {
    iss: env.THC_AUTH_ISSUER,
    aud: env.THC_AUTH_AUDIENCE,
    sub: 'admin-test-1',
    exp: now + 300,
    scope: 'admin:read admin:write',
    aal: 'aal2'
  }
});
const adminAllowed = authorize({ headers: { authorization: `Bearer ${adminWithMfa}` } }, 'admin:write');
assert.equal(adminAllowed.ok, true);
assert.equal(adminAllowed.mfaVerified, true);

const tampered = learnerToken.slice(0, -1) + (learnerToken.endsWith('a') ? 'b' : 'a');
const tamperedResult = authorize({ headers: { authorization: `Bearer ${tampered}` } }, 'learner:read');
assert.equal(tamperedResult.ok, false);
assert.equal(tamperedResult.status, 401);

const expired = signJwt({
  privateKey,
  kid,
  payload: {
    iss: env.THC_AUTH_ISSUER,
    aud: env.THC_AUTH_AUDIENCE,
    sub: 'learner-test-1',
    exp: now - 1,
    scope: 'learner:read'
  }
});
const expiredResult = authorize({ headers: { authorization: `Bearer ${expired}` } }, 'learner:read');
assert.equal(expiredResult.ok, false);
assert.equal(expiredResult.error, 'access-token-expired');

console.log('Production OIDC authentication adapter OK');
