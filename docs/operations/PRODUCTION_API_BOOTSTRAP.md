# Production API bootstrap

The THC Academy API must fail closed in production. Development memory storage and local shared-token authentication are not acceptable production fallbacks.

## Required production configuration

Set all of the following before starting `apps/api/src/server.mjs` with `NODE_ENV=production`:

- `THC_PERSISTENCE_ADAPTER_MODULE` — module that exports `createPersistenceAdapters({ env })`. The repository-provided PostgreSQL adapter is `./apps/api/src/postgres-persistence-adapter.mjs`.
- `THC_AUTH_ADAPTER_MODULE` — module that exports `createRequestAuthorizer({ env })` for the deployed identity provider.
- `THC_PUBLIC_BASE_URL` — externally reachable HTTPS base URL for the Academy/API environment.
- `THC_REQUIRED_SCHEMA_VERSION` — database schema version required by this deployment. The current runtime schema records version `4`.
- `THC_DATABASE_URL` (preferred) or `DATABASE_URL` — PostgreSQL connection string used by the repository-provided persistence adapter.

Optional PostgreSQL tuning for the repository-provided adapter:

- `THC_DATABASE_SSL` — `require` (default), `verify-full`, or `disable`. Use `verify-full` when the deployment provides a CA chain that Node can validate. Do not disable TLS for remote production databases.
- `THC_DATABASE_POOL_MAX` — maximum pool size, default `10`.
- `THC_DATABASE_CONNECT_TIMEOUT_MS` — connection timeout, default `5000`.
- `THC_DATABASE_IDLE_TIMEOUT_MS` — idle connection timeout, default `30000`.
- `THC_DATABASE_APPLICATION_NAME` — PostgreSQL application name, default `thc-academy-api`.

The bootstrap rejects missing configuration, non-HTTPS public URLs, adapter modules without the required factories, persistence stores without readiness/schema/lookup/write functions, learner stores without the assessor performance-result writer, and authentication adapters that do not return an authorizer function.

## Repository PostgreSQL persistence adapter

`apps/api/src/postgres-persistence-adapter.mjs` composes the existing PostgreSQL runtime components behind the production bootstrap contract:

```js
export async function createPersistenceAdapters({ env }) {
  return {
    credentialStore,  // readiness, schema version, verification lookup, lifecycle history
    credentialWriter, // transactional credential lifecycle transitions + audit events
    learnerStore,     // enrollment, lesson progress, credential evidence, assessor results
    async close() {}
  };
}
```

The adapter uses a pooled PostgreSQL connection for reads/writes and a dedicated client for each credential lifecycle transaction. Transactional lifecycle writes execute `BEGIN`, update the credential under row lock, append lifecycle/audit events, then `COMMIT`; failures attempt `ROLLBACK` and always release the client.

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
3. Verify `academy_schema_migrations` contains the expected current version (`4`).
4. Set `THC_PERSISTENCE_ADAPTER_MODULE=./apps/api/src/postgres-persistence-adapter.mjs`.
5. Configure `THC_DATABASE_URL` and database TLS/pool settings through the deployment secret/config manager.
6. Configure the identity-provider authentication adapter and provider secrets/keys through the deployment secret manager.
7. Set `THC_REQUIRED_SCHEMA_VERSION=4` and the HTTPS public base URL.
8. Start the API with `NODE_ENV=production`.
9. Require `/healthz` to return 200 and `/readyz` to return 200 before accepting traffic.
10. Treat `database-schema-version-mismatch` from `/readyz` as a deployment-blocking migration error.
11. Confirm protected endpoints reject missing/invalid credentials, reject insufficient scopes, and accept only correctly verified identities.
12. Run the staging/production smoke checklist before changing deployed-environment readiness gates.

## Readiness semantics

Passing the production persistence adapter, bootstrap, authentication-adapter, schema-readiness, RLS-contract, and failure-handling tests proves the repository contains a production-capable PostgreSQL composition layer and fails closed at its integration boundaries. It does **not** prove that a live database, real identity provider, MFA, TLS endpoint, backups, monitoring, credential signing keys, or human review/pilot gates are operational. Those deployment readiness flags remain false until verified in the deployed environment.
