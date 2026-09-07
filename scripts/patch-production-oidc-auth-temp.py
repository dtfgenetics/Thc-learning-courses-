from pathlib import Path

# Make authorization boundary async for real JWT/JWKS verification.
p = Path('apps/api/src/server.mjs')
text = p.read_text()
text = text.replace('function authorizeRequest(authorize, req, scope, res, requestId) {\n  const auth = authorize(req, scope);', 'async function authorizeRequest(authorize, req, scope, res, requestId) {\n  const auth = await authorize(req, scope);')
text = text.replace('const auth = authorizeRequest(resolvedAuthorize, req,', 'const auth = await authorizeRequest(resolvedAuthorize, req,')
p.write_text(text)

# Default production auth to the in-repo OIDC adapter while retaining override support.
p = Path('apps/api/src/bootstrap.mjs')
text = p.read_text()
old = "  const authAdapterModule = required(env, 'THC_AUTH_ADAPTER_MODULE');\n"
new = "  const authAdapterModule = String(env.THC_AUTH_ADAPTER_MODULE ?? './apps/api/src/oidc-auth-adapter.mjs').trim();\n  if (!authAdapterModule) throw new Error('Production configuration requires a non-empty THC_AUTH_ADAPTER_MODULE when overridden');\n"
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit('bootstrap auth adapter anchor missing')
p.write_text(text)

# Wire jose and focused test into package contract.
p = Path('package.json')
text = p.read_text()
anchor = '    "api:test": "node scripts/test-api-security.mjs",\n'
line = '    "api:oidc-auth:test": "node scripts/test-oidc-auth-adapter.mjs",\n'
if line not in text:
    if anchor not in text: raise SystemExit('api script anchor missing')
    text = text.replace(anchor, anchor + line, 1)
chain = 'npm run runtime:test && npm run api:test && npm run api:failure:test'
replacement = 'npm run runtime:test && npm run api:test && npm run api:oidc-auth:test && npm run api:failure:test'
if replacement not in text:
    if chain not in text: raise SystemExit('api test chain anchor missing')
    text = text.replace(chain, replacement, 1)
if '"jose": "6.2.12"' not in text:
    dep_anchor = '    "ajv-formats": "3.0.1",\n'
    if dep_anchor not in text: raise SystemExit('dependency anchor missing')
    text = text.replace(dep_anchor, dep_anchor + '    "jose": "6.2.12",\n', 1)
p.write_text(text)

# Update bootstrap test for async authorizers and default OIDC module loading.
p = Path('scripts/test-production-bootstrap.mjs')
text = p.read_text()
text = text.replace("const authMissing = options.authorize({ headers: {} }, 'admin:read');", "const authMissing = await options.authorize({ headers: {} }, 'admin:read');")
text = text.replace("const authOk = options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'admin:read');", "const authOk = await options.authorize({ headers: { authorization: 'Bearer external-test-token' } }, 'admin:read');")
marker = "assert.doesNotThrow(() => createHandler(options));\n\n"
addition = """assert.doesNotThrow(() => createHandler(options));

const defaultOidcOptions = await loadProductionApiOptions({
  NODE_ENV: 'production',
  THC_PERSISTENCE_ADAPTER_MODULE: './scripts/fixtures/test-persistence-adapter.mjs',
  THC_PUBLIC_BASE_URL: 'https://academy.example.com',
  THC_REQUIRED_SCHEMA_VERSION: '5',
  THC_OIDC_ISSUER: 'https://identity.example.com/',
  THC_OIDC_AUDIENCE: 'https://academy.example.com/api',
  THC_OIDC_JWKS_URI: 'https://identity.example.com/.well-known/jwks.json',
  THC_OIDC_ALGORITHMS: 'RS256'
});
assert.equal(typeof defaultOidcOptions.authorize, 'function');

"""
if 'const defaultOidcOptions = await loadProductionApiOptions' not in text:
    if marker not in text: raise SystemExit('bootstrap test insertion anchor missing')
    text = text.replace(marker, addition, 1)
p.write_text(text)

# Document production OIDC configuration and async verification boundary.
p = Path('docs/API-SECURITY.md')
text = p.read_text()
old = "This service-token mechanism is a narrow bootstrap control, not the final learner/admin identity architecture. Production user and administrator authentication should be delegated to a trusted OIDC/OAuth identity provider with short-lived credentials, rotation, MFA for privileged users, and centralized revocation/session controls. Accordingly, the broader runtime authentication/authorization and `adminMfaEnforced` readiness gates remain false."
new = "The service-token mechanism remains a narrow development/bootstrap control. Production now defaults to the in-repo OIDC/OAuth JWT adapter (`apps/api/src/oidc-auth-adapter.mjs`) unless `THC_AUTH_ADAPTER_MODULE` explicitly overrides it. The production adapter verifies signed bearer JWTs asynchronously against an HTTPS JWKS endpoint, validates issuer, audience, expiration, subject, and an explicit JWS algorithm allowlist, then enforces API scopes from `scope`/`scp` claims. Required configuration is `THC_OIDC_ISSUER`, `THC_OIDC_AUDIENCE`, `THC_OIDC_JWKS_URI`, and optionally `THC_OIDC_ALGORITHMS` (default `RS256`) and `THC_OIDC_CLOCK_TOLERANCE_SECONDS` (default `5`). Privileged-user MFA remains a separate unsatisfied gate because this adapter does not infer or fabricate MFA assurance from provider-specific claims."
if old in text:
    text = text.replace(old, new, 1)
elif 'Production now defaults to the in-repo OIDC/OAuth JWT adapter' not in text:
    raise SystemExit('API security documentation anchor missing')
p.write_text(text)
