# Production API bootstrap

The THC Academy API must fail closed in production. Development memory storage and local shared-token authentication are not acceptable production fallbacks.

## Required production configuration

Set all of the following before starting `apps/api/src/server.mjs` with `NODE_ENV=production`:

- `THC_PERSISTENCE_ADAPTER_MODULE` — module that exports `createPersistenceAdapters({ env })`.
- `THC_AUTH_ADAPTER_MODULE` — module that exports `createRequestAuthorizer({ env })` for the deployed identity provider.
- `THC_PUBLIC_BASE_URL` — externally reachable HTTPS base URL for the Academy/API environment.
- `THC_REQUIRED_SCHEMA_VERSION` — database schema version required by this deployment. The current runtime schema records version `3`.

The bootstrap rejects missing configuration, non-HTTPS public URLs, adapter modules without the required factories, persistence stores without readiness/schema/lookup functions, and authentication adapters that do not return an authorizer function.

## Persistence adapter contract

```js
export async function createPersistenceAdapters({ env }) {
  return {
    credentialStore: {
      kind: 'postgres',
      async ping() {},
      async schemaVersion() {},
      async getByVerificationId(verificationId) {},
      async count() {}
    },
    credentialWriter: {/* optional until write routes are enabled */},
    learnerStore: {/* authenticated learner progress, evidence and assessment-attempt methods */},
    practicalEvaluatorStore: {
      async listCourseLearners() {},
      async listCourseReportRows() {},
      async getEvaluation() {},
      async saveEvaluation() {},
      async claimEvaluator() {},
      async releaseEvaluator() {},
      async setEvaluatorAssignment() {}
    }
  };
}
```

`credentialStore.ping()` and `credentialStore.schemaVersion()` are used by `/readyz`. Production traffic should not be routed to the service until the database is reachable and its recorded schema version matches `THC_REQUIRED_SCHEMA_VERSION`.

Schema version 3 adds `practical_evaluation_assignments`, which keeps evaluator ownership separate from practical score/evidence records. That separation allows an evaluator to be assigned before an evaluation record exists and prevents ownership metadata from being hidden inside learner evidence JSON.

## Authentication adapter contract

```js
export async function createRequestAuthorizer({ env }) {
  return function authorize(req, requiredScope) {
    // Verify the request with the deployment identity provider.
    // Return a stable external subject and granted scopes only after verification.
    return { ok: true, subject: 'provider-subject', scopes: ['learner:read'] };
  };
}
```

The adapter must return `{ ok: false, status, error }` for missing, invalid, expired, or insufficiently scoped credentials. Production authorization decisions must come from the deployed identity provider or gateway; the repository's simple service-token helper is for development/staging service testing only.

Operational scopes currently include learner read/write, evaluator read/write, and administrator read/write. Evaluator scope can claim/release its own practical assignments and save assigned evaluations. Administrator write scope can reassign a practical to another evaluator. Administrator read scope can produce Course 1 practical reports/CSV exports without exposing private evaluator notes or detailed evidence references.

The application deliberately does not prescribe a specific identity vendor. A deployment adapter can verify OIDC/JWT access tokens, gateway assertions, or another approved identity mechanism while preserving the same application authorization contract. MFA, session policy, account recovery, token rotation, and provider configuration remain deployment responsibilities and must be separately verified before the production authentication readiness gate is changed.

## Deployment sequence

1. Provision PostgreSQL and an application database/user using least privilege.
2. Apply `database/schema.sql` through the controlled migration process.
3. Verify `academy_schema_migrations` contains version `3`.
4. Verify the `practical_evaluation_assignments` table and its evaluator index exist.
5. Configure the deployment-specific persistence adapter and database secrets.
6. Configure the identity-provider authentication adapter and provider secrets/keys through the deployment secret manager.
7. Set `THC_REQUIRED_SCHEMA_VERSION=3` and the HTTPS public base URL.
8. Start the API with `NODE_ENV=production`.
9. Require `/healthz` to return 200 and `/readyz` to return 200 before accepting traffic.
10. Treat `database-schema-version-mismatch` from `/readyz` as a deployment-blocking migration error.
11. Confirm protected endpoints reject missing/invalid credentials, reject insufficient scopes, and accept only correctly verified identities.
12. Confirm evaluator assignment/reassignment and report export are audited and privacy-tested before production use.
13. Run the staging/production smoke checklist before changing any system-readiness gate.

## Readiness semantics

Passing the bootstrap, authentication-adapter, and schema-readiness tests proves the application fails closed and has explicit integration boundaries for persistence and identity. It does **not** prove that a live database, real identity provider, MFA, TLS endpoint, backups, monitoring, credential signing keys, or operational review processes are working in a deployed environment. Those readiness flags remain false until verified in the deployed environment.
