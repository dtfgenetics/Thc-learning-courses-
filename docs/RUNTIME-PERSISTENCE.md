# Runtime Persistence Contract

The runtime schema defines PostgreSQL tables for learners, progress, assessments, competencies, credentials, credential status events, reviews, and audit events. The API now also has a PostgreSQL credential-store adapter contract that maps the `credentials` table into the privacy-safe public verification runtime.

## Production fail-closed behavior
The API must not silently use the in-memory development credential store in production. When `NODE_ENV=production`, `createApiServer()` requires an explicitly supplied persistent `credentialStore`; otherwise startup throws before the server begins listening.

This prevents a production process from appearing healthy while credential verification is actually backed by ephemeral memory.

## PostgreSQL adapter boundary
`apps/api/src/postgres-credential-store.mjs` accepts an injected `query(text, params)` function. This keeps SQL and runtime mapping testable without embedding database credentials or coupling the domain layer to a particular connection-pool package.

The verification lookup is parameterized (`where verification_id = $1`) and maps only the fields required by the runtime. Public responses still pass through `publicCredentialView`, which excludes `subject_hash` and other private payload data.

## What is still required
This is a tested persistence contract, not a deployed production database integration. The following remain intentionally incomplete:

- choose and configure the production PostgreSQL client/pool and secret delivery mechanism;
- connect the adapter during production application bootstrap;
- run schema migrations against staging and production;
- add live database integration tests and failure/retry behavior;
- implement transaction boundaries for issuance/revocation writes;
- deploy and test row-level authorization policies where applicable;
- verify backup/restore and monitoring in the deployed environment.

Accordingly, `runtime.productionPersistenceAdapter` and `api.productionDatabaseIntegration` remain false until those deployment-backed controls exist and are tested.
