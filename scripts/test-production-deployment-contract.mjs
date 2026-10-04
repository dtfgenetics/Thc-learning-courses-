import assert from 'node:assert/strict';
import fs from 'node:fs';

const dockerfile = fs.readFileSync('deploy/Dockerfile.production', 'utf8');
const starter = fs.readFileSync('scripts/start-production-service.mjs', 'utf8');
const runtimePool = fs.readFileSync('deploy/postgres-pool-provider.mjs', 'utf8');
const securePool = fs.readFileSync('deploy/secure-postgres-pool-provider.mjs', 'utf8');
const poolFactory = fs.readFileSync('deploy/postgres-pool-factory.mjs', 'utf8');
const auth = fs.readFileSync('deploy/oidc-jwt-auth-adapter.mjs', 'utf8');
const envExample = fs.readFileSync('deploy/production.env.example', 'utf8');

assert.match(dockerfile, /ENV NODE_ENV=production/, 'production image must run with NODE_ENV=production');
assert.match(dockerfile, /pg@8\.23\.1/, 'production image must pin the PostgreSQL client');
assert.match(dockerfile, /start-production-service\.mjs/, 'production image must use the production starter');
assert.doesNotMatch(dockerfile, /start-staging-service\.mjs/, 'production image must not use staging starter');

assert.match(starter, /loadProductionApiOptions/, 'production starter must load fail-closed API bootstrap');
assert.match(starter, /service === 'combined'/, 'production starter must support single-service web + API hosting');
assert.match(starter, /createApiHandler\(apiOptions\)/, 'combined service must use configured production API handler');
assert.match(starter, /createAcademyWebServer\(\{ env, apiHandler \}\)/, 'combined service must mount protected API into Academy web server');

assert.match(runtimePool, /THC_POSTGRES_DATABASE_URL/, 'runtime provider must use runtime DB URL');
assert.match(securePool, /THC_SECURE_ASSESSMENT_DATABASE_URL/, 'secure provider must use isolated secure DB URL');
assert.match(securePool, /secureUrl === runtimeUrl/, 'secure provider must reject credential reuse');
assert.match(poolFactory, /sslmode=require, verify-ca, or verify-full/, 'PostgreSQL provider must require TLS');
assert.doesNotMatch(poolFactory, /password\s*[:=]\s*['"][^'"]+['"]/, 'pool provider must not embed a password');

assert.match(auth, /RS256/, 'auth adapter must support RS256');
assert.match(auth, /ES256/, 'auth adapter must support ES256');
assert.match(auth, /invalid-token-issuer/, 'auth adapter must validate issuer');
assert.match(auth, /invalid-token-audience/, 'auth adapter must validate configured audience');
assert.match(auth, /insufficient-scope/, 'auth adapter must enforce application scopes');
assert.match(auth, /mfaVerified/, 'auth adapter must project MFA assurance');

assert.match(envExample, /THC_REQUIRED_SCHEMA_VERSION=7/, 'production template must pin schema v7');
assert.match(envExample, /THC_AUTH_ADAPTER_MODULE=\.\/deploy\/oidc-jwt-auth-adapter\.mjs/, 'production template must select first-party OIDC adapter');
assert.match(envExample, /THC_SECURE_ASSESSMENT_POSTGRES_POOL_MODULE=\.\/deploy\/secure-postgres-pool-provider\.mjs/, 'production template must select isolated secure DB provider');
assert.doesNotMatch(envExample, /THC_SECURE_ASSESSMENT_DATABASE_URL=.*THC_POSTGRES_DATABASE_URL/, 'production template must not alias DB credentials');

console.log('Production deployment contract OK');
