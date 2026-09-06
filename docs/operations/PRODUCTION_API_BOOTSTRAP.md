# Production API bootstrap

The THC Academy API must fail closed in production. Development memory storage and local shared-token authentication are not acceptable production fallbacks.

## Required production configuration

Set all of the following before starting `apps/api/src/server.mjs` with `NODE_ENV=production`:

- `THC_PERSISTENCE_ADAPTER_MODULE` — module that exports `createPersistenceAdapters({ env })`.
- `THC_AUTH_ADAPTER_MODULE` — module that exports `createRequestAuthorizer({ env })` for the deployed identity provider.
- `THC_PUBLIC_BASE_URL` — externally reachable HTTPS base URL for the Academy/API environment.
- `THC_REQUIRED_SCHEMA_VERSION` — database schema version required by this deployment. The current runtime schema records version `1`.

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
    learnerStore: {/* used by authenticated learner runtime routes */}
  };
}
```

`credentialStore.ping()` and `credentialStore.schemaVersion()` are used by `/readyz`. Production traffic should not be routed to the service until the database is reachable and its recorded schema version matches `THC_REQUIRED_SCHEMA_VERSION`.

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

The application deliberately does not prescribe a specific identity vendor. A deployment adapter can verify OIDC/JWT access tokens, gateway assertions, or another approved identity mechanism while preserving the same application authorization contract. MFA, session policy, account recovery, token rotation, and provider configuration remain deployment responsibilities and must be separately verified before the production authentication readiness gate is changed.

## Deployment sequence

1. Provision PostgreSQL and an application database/user using least privilege.
2. Apply `database/schema.sql` through the controlled migration process.
3. Verify `academy_schema_migrations` contains the expected version.
4. Configure the deployment-specific persistence adapter and database secrets.
5. Configure the identity-provider authentication adapter and provider secrets/keys through the deployment secret manager.
6. Set `THC_REQUIRED_SCHEMA_VERSION=1` and the HTTPS public base URL.
7. Start the API with `NODE_ENV=production`.
8. Require `/healthz` to return 200 and `/readyz` to return 200 before accepting traffic.
9. Treat `database-schema-version-mismatch` from `/readyz` as a deployment-blocking migration error.
10. Confirm protected endpoints reject missing/invalid credentials, reject insufficient scopes, and accept only correctly verified identities.
11. Run the staging/production smoke checklist before changing any system-readiness gate.

## Readiness semantics

Passing the bootstrap, authentication-adapter, and schema-readiness tests proves the application fails closed and has explicit integration boundaries for persistence and identity. It does **not** prove that a live database, real identity provider, MFA, TLS endpoint, backups, monitoring, credential signing keys, or production review/pilot gates are operational. Those readiness flags remain false until verified in the deployed environment.
