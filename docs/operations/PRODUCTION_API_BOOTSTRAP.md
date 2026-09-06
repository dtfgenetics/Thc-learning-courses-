# Production API bootstrap

The THC Academy API must fail closed in production. Development memory storage is never an acceptable production fallback.

## Required production configuration

Set all of the following before starting `apps/api/src/server.mjs` with `NODE_ENV=production`:

- `THC_PERSISTENCE_ADAPTER_MODULE` — module that exports `createPersistenceAdapters({ env })`.
- `THC_PUBLIC_BASE_URL` — externally reachable HTTPS base URL for the Academy/API environment.
- `THC_API_ADMIN_TOKEN` — service token of at least 32 characters. Supply this from the deployment secret manager; do not commit it.
- `THC_REQUIRED_SCHEMA_VERSION` — database schema version required by this deployment. The current runtime schema records version `1`.

The bootstrap rejects missing values, non-HTTPS public URLs, short service tokens, adapter modules without the required factory, and stores that do not implement readiness, schema-version, and credential-lookup functions.

## Persistence adapter contract

The configured module must export:

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
    credentialWriter: {/* optional until write routes are enabled */}
  };
}
```

`credentialStore.ping()` and `credentialStore.schemaVersion()` are used by `/readyz`. Production traffic should not be routed to the service until the database is reachable **and** its recorded schema version matches `THC_REQUIRED_SCHEMA_VERSION`.

The repository PostgreSQL store implements `schemaVersion()` by reading `academy_schema_migrations`. `database/schema.sql` creates that migration table and records schema version `1` idempotently.

The repository also contains parameterized PostgreSQL store/writer adapters in `apps/api/src/postgres-credential-store.mjs` and `apps/api/src/postgres-credential-writer.mjs`. A deployment-specific module is responsible for supplying the actual PostgreSQL driver's `query` and transaction functions without committing connection strings or credentials.

## Deployment sequence

1. Provision PostgreSQL and an application database/user using least privilege.
2. Apply `database/schema.sql` through the controlled migration process.
3. Verify `academy_schema_migrations` contains the expected version.
4. Configure the deployment-specific persistence adapter module and database secrets.
5. Set `THC_REQUIRED_SCHEMA_VERSION=1`, an HTTPS public base URL, and a secret-managed API token.
6. Start the API with `NODE_ENV=production`.
7. Require `/healthz` to return 200 and `/readyz` to return 200 before accepting traffic.
8. Treat `database-schema-version-mismatch` from `/readyz` as a deployment-blocking migration error.
9. Confirm `/api/v1/admin/diagnostics` returns 401 without a token and 200 only with the correctly scoped service token.
10. Run the staging/production smoke checklist before changing any system-readiness gate.

## Readiness semantics

Passing the bootstrap and schema-readiness tests proves the application fails closed, can accept a real persistence adapter, and refuses readiness when its database schema is unknown or stale. It does **not** prove that a live database, identity provider, TLS endpoint, backups, monitoring, MFA, credential signing keys, or production review/pilot gates are operational. Those readiness flags remain false until verified in the deployed environment.
