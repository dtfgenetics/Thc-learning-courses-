import crypto from 'node:crypto';

const REQUIRED_CONTROLS = [
  'leastPrivilegeAccess',
  'privilegedAccessAudited',
  'encryptionInTransit',
  'encryptionAtRest',
  'backupRecoveryDefined',
  'keyManagementSeparated',
  'environmentSeparated',
  'publicRepositoryMaterialExcluded'
];

function required(env, name) {
  const value = String(env[name] ?? '').trim();
  if (!value) throw new Error(`Missing required production setting: ${name}`);
  return value;
}

function parseUrl(value, name, protocols) {
  let parsed;
  try { parsed = new URL(value); } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  if (!protocols.includes(parsed.protocol)) {
    throw new Error(`${name} must use ${protocols.join(' or ')}`);
  }
  return parsed;
}

function assertNotPlaceholder(value, name) {
  const normalized = String(value).toLowerCase();
  if (
    normalized.includes('replace-me') ||
    normalized.includes('example.com') ||
    normalized.includes('changeme') ||
    normalized.includes('placeholder')
  ) {
    throw new Error(`${name} still contains a placeholder value`);
  }
}

function assertPostgresTls(url, name) {
  const parsed = parseUrl(url, name, ['postgres:', 'postgresql:']);
  const mode = String(parsed.searchParams.get('sslmode') ?? '').toLowerCase();
  if (!['require', 'verify-ca', 'verify-full'].includes(mode)) {
    throw new Error(`${name} must require PostgreSQL TLS with sslmode=require, verify-ca, or verify-full`);
  }
  assertNotPlaceholder(url, name);
  return parsed;
}

function parseSecurityControls(value) {
  let controls;
  try { controls = JSON.parse(value); } catch {
    throw new Error('THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON must be valid JSON');
  }
  if (!controls || typeof controls !== 'object' || Array.isArray(controls)) {
    throw new Error('THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON must be an object');
  }
  if (!String(controls.accessControlModel ?? '').toLowerCase().includes('least-privilege')) {
    throw new Error('Secure assessment accessControlModel must explicitly be least-privilege');
  }
  for (const key of REQUIRED_CONTROLS) {
    if (controls[key] !== true) throw new Error(`Secure assessment control ${key} must be true`);
  }
  return controls;
}

export function validateProductionDeploymentPreflight(env = process.env) {
  const sourceSha = required(env, 'ACADEMY_SOURCE_REF');
  if (!/^[0-9a-f]{40}$/i.test(sourceSha)) {
    throw new Error('ACADEMY_SOURCE_REF must be an exact 40-character Git commit SHA');
  }
  if (env.GITHUB_SHA && String(env.GITHUB_SHA).trim() !== sourceSha) {
    throw new Error('ACADEMY_SOURCE_REF must match the checked-out GITHUB_SHA');
  }

  const publicBase = parseUrl(required(env, 'THC_PUBLIC_BASE_URL'), 'THC_PUBLIC_BASE_URL', ['https:']);
  assertNotPlaceholder(publicBase.toString(), 'THC_PUBLIC_BASE_URL');

  const runtimeDbRaw = required(env, 'THC_POSTGRES_DATABASE_URL');
  const secureDbRaw = required(env, 'THC_SECURE_ASSESSMENT_DATABASE_URL');
  const runtimeDb = assertPostgresTls(runtimeDbRaw, 'THC_POSTGRES_DATABASE_URL');
  const secureDb = assertPostgresTls(secureDbRaw, 'THC_SECURE_ASSESSMENT_DATABASE_URL');

  if (runtimeDbRaw === secureDbRaw) {
    throw new Error('Runtime and secure-assessment database URLs must be different');
  }
  if (
    runtimeDb.username === secureDb.username &&
    runtimeDb.hostname === secureDb.hostname &&
    runtimeDb.pathname === secureDb.pathname
  ) {
    throw new Error('Runtime and secure-assessment stores must not reuse the same database identity');
  }

  const issuer = parseUrl(required(env, 'THC_AUTH_ISSUER'), 'THC_AUTH_ISSUER', ['https:']);
  assertNotPlaceholder(issuer.toString(), 'THC_AUTH_ISSUER');
  const jwks = parseUrl(required(env, 'THC_AUTH_JWKS_URL'), 'THC_AUTH_JWKS_URL', ['https:']);
  assertNotPlaceholder(jwks.toString(), 'THC_AUTH_JWKS_URL');

  const schemaVersion = Number(required(env, 'THC_REQUIRED_SCHEMA_VERSION'));
  if (!Number.isInteger(schemaVersion) || schemaVersion !== 7) {
    throw new Error('THC_REQUIRED_SCHEMA_VERSION must be exactly 7 for the current production runtime');
  }

  parseSecurityControls(required(env, 'THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON'));

  const hmac = required(env, 'THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY');
  assertNotPlaceholder(hmac, 'THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY');
  if (hmac.length < 32) throw new Error('THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY must contain at least 32 characters');

  const fingerprint = crypto
    .createHash('sha256')
    .update([
      sourceSha,
      publicBase.origin,
      issuer.origin,
      jwks.origin,
      runtimeDb.hostname,
      secureDb.hostname,
      String(schemaVersion)
    ].join('|'))
    .digest('hex');

  return {
    ok: true,
    sourceSha,
    publicBaseUrl: publicBase.toString(),
    schemaVersion,
    runtimeDatabaseHost: runtimeDb.hostname,
    secureAssessmentDatabaseHost: secureDb.hostname,
    issuer: issuer.origin,
    jwksOrigin: jwks.origin,
    configurationFingerprint: fingerprint,
    secretsIncluded: false
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = validateProductionDeploymentPreflight(process.env);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    console.error(`Production deployment preflight failed: ${error.message}`);
    process.exit(1);
  }
}
