import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readiness = JSON.parse(fs.readFileSync(path.join(root, 'registry/system-readiness.json'), 'utf8'));
const failures = [];
const checks = [];

function requireFile(rel) {
  const ok = fs.existsSync(path.join(root, rel));
  checks.push({ check: `file:${rel}`, ok });
  if (!ok) failures.push(`missing required staging file ${rel}`);
}

function requireGate(area, gate) {
  const value = readiness.areas?.[area]?.gates?.[gate];
  const ok = value === true;
  checks.push({ check: `${area}.${gate}`, ok });
  if (!ok) failures.push(`${area}.${gate} must be true for staging usability`);
}

for (const file of [
  'package.json',
  'package-lock.json',
  'apps/web/server.mjs',
  'apps/web/public/index.html',
  'apps/web/public/app.js',
  'apps/web/public/styles.css',
  'apps/api/src/server.mjs',
  'database/schema.sql',
  'docs/STAGING-LEARNER-APP.md',
  'docs/INCIDENT-RESPONSE.md',
  'registry/system-readiness.json'
]) requireFile(file);

for (const [area, gate] of [
  ['curriculum', 'substantiveContentComplete'],
  ['assessment', 'blueprintComplete'],
  ['assessment', 'developmentFormGeneration'],
  ['runtime', 'serverSideAttemptStateMachine'],
  ['runtime', 'serverSideScoringCore'],
  ['runtime', 'competencyResultCore'],
  ['runtime', 'postgresSchemaDefined'],
  ['credentials', 'deterministicEligibility'],
  ['credentials', 'testIssuance'],
  ['credentials', 'privacySafeVerificationProjection'],
  ['api', 'verificationContract'],
  ['api', 'developmentHttpService'],
  ['api', 'rateLimiting'],
  ['api', 'authentication'],
  ['api', 'observability'],
  ['security', 'piiExcludedFromGit'],
  ['security', 'privateKeysExcludedFromGit'],
  ['security', 'serverSideScoringBoundary'],
  ['accessibility', 'wcagTargetDefined'],
  ['operations', 'releasePolicyDefined'],
  ['operations', 'incidentResponseRunbook']
]) requireGate(area, gate);

const report = {
  stagingUsable: failures.length === 0,
  productionReady: readiness.productionReady === true,
  checked: checks.length,
  failures,
  productionBoundary: [
    'scientific/editorial/assessment human review',
    'pilot statistics and active production item pools',
    'production persistence and authorization',
    'production issuer identity/signing and revocation persistence',
    'MFA/security review',
    'accessibility verification',
    'staging/production infrastructure, backup restore, and monitoring'
  ]
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
