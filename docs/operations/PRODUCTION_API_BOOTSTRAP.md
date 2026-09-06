# Production API bootstrap

The THC Academy API must fail closed in production. Development memory storage is never an acceptable production fallback.

## Required production configuration

Set all of the following before starting `apps/api/src/server.mjs` with `NODE_ENV=production`:

- `THC_PERSISTENCE_ADAPTER_MODULE` — module that exports `createPersistenceAdapters({ env })`.
- `THC_PUBLIC_BASE_URL` — externally reachable HTTPS base URL for the Academy/API environment.
- `THC_API_ADMIN_TOKEN` — service token of at least 32 characters. Supply this from the deployment secret manager; do not commit it.

The bootstrap rejects missing values, non-HTTPS public URLs, short service tokens, adapter modules without the required factory, and stores that do not implement readiness and credential lookup.

## Persistence adapter contract

The configured module must export:

```js
export async function createPersistenceAdapters({ env }) {
  return {
    credentialStore: {
      kind: 'postgres',
      async ping() {},
      async getByVerificationId(verificationId) {},
      async count() {}
    },
    credentialWriter: {/* optional until write routes are enabled */}
  };
}
```

`credentialStore.ping()` is used by `/readyz`. Production traffic should not be routed to the service until this succeeds.

The repository already contains parameterized PostgreSQL store/writer adapters in `apps/api/src/postgres-credential-store.mjs` and `apps/api/src/postgres-credential-writer.mjs`. A deployment-specific module is responsible for supplying the actual PostgreSQL driver's `query` and transaction functions without committing connection strings or credentials.

## Deployment sequence

1. Provision PostgreSQL and an application database/user using least privilege.
2. Apply `database/schema.sql` through the controlled migration process.
3. Configure the deployment-specific persistence adapter module and database secrets.
4. Set an HTTPS public base URL and secret-managed API token.
5. Start the API with `NODE_ENV=production`.
6. Require `/healthz` to return 200 and `/readyz` to return 200 before accepting traffic.
7. Confirm `/api/v1/admin/diagnostics` returns 401 without a token and 200 only with the correctly scoped service token.
8. Run the staging/production smoke checklist before changing any system-readiness gate.

## Readiness semantics

Passing the bootstrap test proves the application fails closed and can accept a real persistence adapter. It does **not** prove that a live database, identity provider, TLS endpoint, backups, monitoring, MFA, credential signing keys, or production review/pilot gates are operational. Those readiness flags remain false until verified in the deployed environment.
