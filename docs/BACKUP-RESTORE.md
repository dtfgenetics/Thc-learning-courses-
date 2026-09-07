# Backup and restore

THC Academy requires a verified restore, not merely a statement that backups exist.

## Repository drill

`scripts/test-backup-restore-drill.mjs` runs only against an explicitly supplied PostgreSQL `DATABASE_URL`. It creates a known marker, writes a custom-format `pg_dump` into an OS temporary directory, restores the dump into a separate disposable database, verifies critical tables and the marker, then deletes the restored database and temporary dump. The PostgreSQL integration workflow runs this against its disposable service database.

This proves the repository's restore procedure is executable. It does **not** close `operations.backupRestoreTested` for a live environment.

## Staging/production drill

Before the production gate can close:

1. Confirm the approved backup storage location, encryption, access controls, retention policy, RPO, and RTO outside this repository.
2. Produce a backup using the production-approved mechanism without copying secrets or learner data into Git or CI artifacts.
3. Restore into an isolated recovery environment.
4. Verify schema/migration state, representative relational integrity, credential/revocation records, and application readiness.
5. Record recovery duration and any discrepancies.
6. Destroy recovery data according to the organization's privacy/retention process.
7. Add a safe `operations.backupRestoreTested` production-control evidence record. Reference protected operational evidence externally rather than committing dumps or sensitive logs.

A future change to `registry/system-readiness.json` may set `backupRestoreTested` to true only after that verified evidence exists.
