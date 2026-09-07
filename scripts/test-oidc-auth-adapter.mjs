import assert from 'node:assert/strict';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createRequestAuthorizer } from '../apps/api/src/oidc-auth-adapter.mjs';

const issuer = 'https://identity.example.test/';
const audience = 'https://academy.example.test/api';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const publicJwk = await exportJWK(publicKey);
publicJwk.kid = 'test-rsa-key';
publicJwk.alg = 'RS256';
publicJwk.use = 'sig';
const jwks = createLocalJWKSet({ keys: [publicJwk] });
const env = {
  THC_OIDC_ISSUER: issuer,
  THC_OIDC_AUDIENCE: audience,
  THC_OIDC_ALGORITHMS: 'RS256',
  THC_OIDC_CLOCK_TOLERANCE_SECONDS: '0'
};

async function token({
  scopes = 'learner:read learner:write',
  tokenAudience = audience,
  expires = '5m',
  scp = undefined,
  amr = undefined,
  acr = undefined,
  subject = 'learner-subject-123'
} = {}) {
  const payload = { scope: scopes };
  if (scp !== undefined) payload.scp = scp;
  if (amr !== undefined) payload.amr = amr;
  if (acr !== undefined) payload.acr = acr;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-rsa-key', typ: 'JWT' })
    .setIssuer(issuer)
    .setAudience(tokenAudience)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(privateKey);
}

function req(jwt) {
  return { headers: jwt ? { authorization: `Bearer ${jwt}` } : {} };
}

const authorize = await createRequestAuthorizer({ env, jwks });
const valid = await token();
let result = await authorize(req(valid), 'learner:read');
assert.equal(result.ok, true);
assert.equal(result.subject, 'learner-subject-123');
assert.ok(result.scopes.includes('learner:read'));
assert.ok(result.scopes.includes('learner:write'));
assert.equal(result.assurance.mfa, false);

result = await authorize(req(valid), 'admin:read');
assert.deepEqual(result, { ok: false, status: 403, error: 'insufficient-scope' });

const privilegedWithoutMfa = await token({ scopes: 'admin:read assessor:write learner:read' });
result = await authorize(req(privilegedWithoutMfa), 'admin:read');
assert.deepEqual(result, { ok: false, status: 403, error: 'privileged-mfa-required' });
result = await authorize(req(privilegedWithoutMfa), 'assessor:write');
assert.deepEqual(result, { ok: false, status: 403, error: 'privileged-mfa-required' });
result = await authorize(req(privilegedWithoutMfa), 'learner:read');
assert.equal(result.ok, true, 'learner scope must not require privileged MFA');

const privilegedWithMfa = await token({ scopes: 'admin:read assessor:write', amr: ['pwd', 'mfa'] });
result = await authorize(req(privilegedWithMfa), 'admin:read');
assert.equal(result.ok, true);
assert.equal(result.assurance.mfa, true);
assert.deepEqual(result.assurance.amr, ['pwd', 'mfa']);
result = await authorize(req(privilegedWithMfa), 'assessor:write');
assert.equal(result.ok, true);

const acrAuthorize = await createRequestAuthorizer({
  env: { ...env, THC_OIDC_PRIVILEGED_MFA_AMR_VALUES: '', THC_OIDC_PRIVILEGED_MFA_ACR_VALUES: 'urn:example:aal2' },
  jwks
});
const privilegedWithAcr = await token({ scopes: 'admin:read', acr: 'urn:example:aal2' });
result = await acrAuthorize(req(privilegedWithAcr), 'admin:read');
assert.equal(result.ok, true);
assert.equal(result.assurance.mfa, true);
assert.equal(result.assurance.acr, 'urn:example:aal2');

result = await acrAuthorize(req(await token({ scopes: 'admin:read', acr: 'urn:example:aal1' })), 'admin:read');
assert.deepEqual(result, { ok: false, status: 403, error: 'privileged-mfa-required' });

result = await authorize(req(), 'learner:read');
assert.deepEqual(result, { ok: false, status: 401, error: 'authentication-required' });

result = await authorize(req('not-a-jwt'), 'learner:read');
assert.deepEqual(result, { ok: false, status: 401, error: 'invalid-authentication' });

const wrongAudience = await token({ tokenAudience: 'https://wrong.example.test/api' });
result = await authorize(req(wrongAudience), 'learner:read');
assert.deepEqual(result, { ok: false, status: 401, error: 'invalid-authentication' });

const expired = await new SignJWT({ scope: 'learner:read' })
  .setProtectedHeader({ alg: 'RS256', kid: 'test-rsa-key' })
  .setIssuer(issuer)
  .setAudience(audience)
  .setSubject('learner-subject-123')
  .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
  .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
  .sign(privateKey);
result = await authorize(req(expired), 'learner:read');
assert.deepEqual(result, { ok: false, status: 401, error: 'invalid-authentication' });

const scpOnly = await new SignJWT({ scp: ['learner:read', 'assessment:read'] })
  .setProtectedHeader({ alg: 'RS256', kid: 'test-rsa-key' })
  .setIssuer(issuer)
  .setAudience(audience)
  .setSubject('scp-subject')
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(privateKey);
result = await authorize(req(scpOnly), 'learner:read');
assert.equal(result.ok, true);
assert.equal(result.subject, 'scp-subject');
assert.ok(result.scopes.includes('assessment:read'));

await assert.rejects(
  () => createRequestAuthorizer({ env: { ...env, THC_OIDC_ISSUER: 'http://insecure.example.test' }, jwks }),
  /must use https/
);
await assert.rejects(
  () => createRequestAuthorizer({ env: { ...env, THC_OIDC_ALGORITHMS: 'none' }, jwks }),
  /cannot include none/
);
await assert.rejects(
  () => createRequestAuthorizer({
    env: { ...env, THC_OIDC_PRIVILEGED_MFA_AMR_VALUES: '', THC_OIDC_PRIVILEGED_MFA_ACR_VALUES: '' },
    jwks
  }),
  /requires at least one configured MFA amr or acr assurance value/
);

console.log('Production OIDC request authorizer and privileged MFA tests passed.');
