import assert from 'node:assert/strict';
import { validateProductionDeploymentPreflight } from './production-deployment-preflight.mjs';

const sha = 'a'.repeat(40);
const valid = {
  ACADEMY_SOURCE_REF: sha,
  GITHUB_SHA: sha,
  THC_PUBLIC_BASE_URL: 'https://academy.dtfseeds.com',
  THC_REQUIRED_SCHEMA_VERSION: '7',
  THC_POSTGRES_DATABASE_URL: 'postgresql://runtime_user:secret@runtime-db.internal:5432/thc_academy?sslmode=require',
  THC_SECURE_ASSESSMENT_DATABASE_URL: 'postgresql://secure_exam_user:secret@secure-db.internal:5432/thc_secure_assessment?sslmode=verify-full',
  THC_AUTH_ISSUER: 'https://id.dtfseeds.com',
  THC_AUTH_JWKS_URL: 'https://id.dtfseeds.com/.well-known/jwks.json',
  THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON: JSON.stringify({
    accessControlModel: 'least-privilege-rbac',
    leastPrivilegeAccess: true,
    privilegedAccessAudited: true,
    encryptionInTransit: true,
    encryptionAtRest: true,
    backupRecoveryDefined: true,
    keyManagementSeparated: true,
    environmentSeparated: true,
    publicRepositoryMaterialExcluded: true
  }),
  THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY: 'x'.repeat(48)
};

const result = validateProductionDeploymentPreflight(valid);
assert.equal(result.ok, true);
assert.equal(result.sourceSha, sha);
assert.equal(result.schemaVersion, 7);
assert.equal(result.secretsIncluded, false);
assert.equal(typeof result.configurationFingerprint, 'string');
assert.equal(result.configurationFingerprint.length, 64);

assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, ACADEMY_SOURCE_REF: 'main' }),
  /exact 40-character/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, GITHUB_SHA: 'b'.repeat(40) }),
  /must match/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, THC_PUBLIC_BASE_URL: 'http://academy.dtfseeds.com' }),
  /must use https/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, THC_POSTGRES_DATABASE_URL: 'postgresql://runtime_user:secret@runtime-db.internal:5432/thc_academy' }),
  /must require PostgreSQL TLS/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, THC_SECURE_ASSESSMENT_DATABASE_URL: valid.THC_POSTGRES_DATABASE_URL }),
  /must be different/
);
assert.throws(
  () => validateProductionDeploymentPreflight({
    ...valid,
    THC_SECURE_ASSESSMENT_DATABASE_URL: 'postgresql://runtime_user:other@runtime-db.internal:5432/thc_academy?sslmode=require'
  }),
  /must not reuse the same database identity/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, THC_AUTH_JWKS_URL: 'https://identity.example.com/.well-known/jwks.json' }),
  /placeholder/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, THC_REQUIRED_SCHEMA_VERSION: '6' }),
  /exactly 7/
);
assert.throws(
  () => validateProductionDeploymentPreflight({
    ...valid,
    THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON: JSON.stringify({
      ...JSON.parse(valid.THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON),
      backupRecoveryDefined: false
    })
  }),
  /backupRecoveryDefined must be true/
);
assert.throws(
  () => validateProductionDeploymentPreflight({ ...valid, THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY: 'short' }),
  /at least 32/
);

console.log('Production deployment preflight tests passed.');
