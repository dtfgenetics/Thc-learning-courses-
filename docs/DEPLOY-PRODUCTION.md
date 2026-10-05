# Production Academy deployment

This runbook covers the deployable machine layer for the authenticated THC Academy certification portal. It does **not** authorize professional credential issuance by itself. Human review, pilot/calibration evidence, secure-form validation, standard setting, security/operations validation, candidate governance, and final credential authorization remain separate fail-closed gates.

## Production shape

The preferred runtime is the repository's combined Node service:

- learner Academy web UI;
- protected `/api/v1/*` learner/evaluator/admin API;
- `/healthz` liveness;
- `/readyz` production dependency/schema readiness;
- PostgreSQL schema version 7 for learner/progress/credential state;
- a **separate** PostgreSQL database/role for protected operational assessment material;
- OIDC/JWT access-token verification using JWKS;
- application scope enforcement plus MFA assurance for admin routes.

The production starter is `scripts/start-production-service.mjs`. It calls the existing fail-closed production bootstrap before opening the combined service. Missing persistence, auth, secure-assessment, schema, or HTTPS configuration is therefore a startup/readiness failure rather than a fallback to development storage.

## Container build

Build with `deploy/Dockerfile.production`. The image:

- uses Node 24;
- runs with `NODE_ENV=production`;
- pins node-postgres `pg@8.23.1` inside the image;
- includes the governed runtime/content/database files;
- starts the combined production service on port 8787 by default.

For Hostinger, use a VPS with the Docker template/Docker Manager for this container path. Hostinger's current Docker Manager supports Docker Compose projects and repository-backed Compose deployment. Keep the public WordPress site separate and route an Academy subdomain (for example `academy.dtfseeds.com`) to this service through the VPS HTTPS/reverse-proxy layer.

Hostinger also has managed Node.js GitHub deployments and a Supabase database-connect wizard, but this repository's authoritative production packaging is currently the Docker image because the PostgreSQL driver is pinned in that image rather than the root academic package lock. Do not silently switch deployment modes without reproducing that dependency boundary.

## Exact-source deployment

Production must deploy an exact validated source SHA, not mutable `main`.

`deploy/compose.production.yml` requires:

- `ACADEMY_SOURCE_REF` — exact validated certification repo commit SHA;
- `THC_PUBLIC_BASE_URL` — HTTPS production Academy URL;
- runtime and secure-assessment database URLs;
- OIDC issuer/JWKS configuration;
- secure-assessment security declaration and audit HMAC secret.

The two database URLs must be different. Both URLs must require TLS using `sslmode=require`, `verify-ca`, or `verify-full`.

## Database preparation

Use two PostgreSQL security boundaries.

### Runtime database

Apply `database/schema.sql` through the controlled migration process. Confirm:

- `academy_schema_migrations` reports schema version 7;
- the production runtime role is least-privilege;
- end users never receive direct database credentials;
- backup/restore and monitoring are configured outside Git.

### Secure operational assessment database

Apply `database/secure-assessment-schema.sql` only to the isolated assessment database/role.

Do **not** seed that database from public `content/questions/` credential-purpose material. Those public keyed items are development/training blueprints and are classified as compromised for high-integrity credential decisions. New protected operational items must be authored and governed privately.

## Identity configuration

The repository provides `deploy/oidc-jwt-auth-adapter.mjs`.

Required values:

- `THC_AUTH_ISSUER`;
- `THC_AUTH_JWKS_URL` (HTTPS) or protected `THC_AUTH_JWKS_JSON`;
- optional `THC_AUTH_AUDIENCE` when the issuer uses an audience claim.

The adapter verifies RS256 or ES256 signatures, issuer, expiry/not-before, optional audience, subject, and requested application scope. Admin access additionally passes through `enforceProductionAuthAssurance()`, which rejects an otherwise valid admin token unless MFA assurance is present.

Authorization scopes are application contracts; configure the identity provider to issue only the scopes each role needs. Do not derive authorization from user-editable profile metadata.

## Secrets

Use the hosting secret/environment manager. Never put real values into Git for:

- database connection URLs/passwords;
- secure-assessment HMAC key;
- OIDC client/provider secrets;
- private item content/scoring keys;
- credential signing keys.

`deploy/production.env.example` is names-only/sample configuration and contains no operational credentials.

## Pre-traffic verification

Before routing public traffic:

1. Verify the exact image/source SHA.
2. Verify both database connections use TLS and distinct credentials.
3. Verify runtime schema version 7.
4. Verify `/healthz` returns 200.
5. Verify `/readyz` returns 200.
6. Verify unauthenticated protected requests fail.
7. Verify a valid learner token can access only learner scopes.
8. Verify evaluator/admin scope separation.
9. Verify admin access without MFA is rejected.
10. Verify secure item delivery never exposes scoring keys/rationales.
11. Verify assessment save/resume/timeout/submit behavior and audit writes.
12. Exercise backup/restore and incident/rollback procedures in the deployed environment.

Only deployment-backed evidence may change the corresponding production-readiness records.

## Automated deployment preflight

Before any production rollout, run the **Production deployment preflight** GitHub Actions workflow against the exact release SHA. The workflow is intentionally fail-closed and uses the protected `production` environment.

It verifies, without printing secrets:

- the deployment uses an exact 40-character Git SHA and the checked-out revision matches it;
- the public Academy base URL, OIDC issuer, and JWKS URL use HTTPS and are not placeholder values;
- runtime and secure-assessment PostgreSQL URLs are different, use separate database identities, and require TLS;
- the runtime schema target is exactly version 7;
- the secure-assessment control declaration explicitly enables least privilege, privileged-access auditing, encryption, backup/recovery, key separation, environment separation, and exclusion of public-repository material;
- the secure-assessment audit HMAC key is present and has a minimum safe length.

The command behind the workflow is `node scripts/production-deployment-preflight.mjs`. Successful output contains only non-secret deployment metadata and a configuration fingerprint. A green preflight means the supplied configuration is structurally deployable; it is **not** proof that the infrastructure was deployed, that controls operated correctly, or that professional certification is authorized.

## Public-site cutover

The current DTFSeeds WordPress course pages truthfully avoid sending learners to a nonexistent authenticated exam portal. Preserve that behavior until this service is deployed and verified.

After production verification:

1. record the exact Academy build/source identity;
2. record deployment-control evidence for the exact environment;
3. point certification final CTAs to the verified authenticated Academy URL;
4. run the DTFSeeds public route/link verification suite;
5. preserve rollback to the prior truthfully-disabled CTA state.

## External platform references

Current Hostinger documentation:

- Node.js web apps / GitHub deployment: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Supabase connection for Hostinger Node apps: https://www.hostinger.com/support/connecting-a-supabase-database-to-a-hostinger-node-js-application/
- VPS Docker Manager deployment: https://www.hostinger.com/support/12040815-how-to-deploy-your-first-container-with-hostinger-docker-manager/
