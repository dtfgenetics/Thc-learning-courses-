# THC Academy Operations Runbook

## Environments

Use separate development, staging, and production environments. Each environment has separate databases, authentication configuration, storage, issuer/signing configuration, and secrets. Production signing material is never copied into lower environments.

## Deploy

1. Validate curriculum and schemas.
2. Generate a development exam form and run assessment/credential tests.
3. Run review-readiness and item-bank-readiness reports.
4. Run production-readiness gate.
5. Apply database migrations in staging.
6. Run API health, authorization, assessment-attempt, scoring, credential, and verifier smoke tests.
7. Promote the exact tested release artifact to production.
8. Record release ID, git SHA, curriculum release/version, migration version, and operator.

## Rollback

Application rollback uses the previous immutable build. Curriculum already associated with issued credentials is never mutated in place; a bad curriculum release is superseded by a new version. Destructive database rollback is avoided; forward-fix migrations are preferred unless a tested reversible migration exists.

## Backup and restore

Production PostgreSQL requires automated encrypted backups and point-in-time recovery where supported. Restore procedures must be tested on a schedule in an isolated environment. Backup success without a demonstrated restore does not satisfy the readiness gate.

## Incidents

For suspected assessment exposure, credential-signing compromise, authorization bypass, or data leak:

1. stop affected issuance or assessment pathways;
2. preserve logs and audit evidence;
3. rotate compromised credentials/secrets where applicable;
4. identify affected attempts/credentials/users;
5. revoke or supersede credentials only when justified and record the reason;
6. correct the vulnerability and validate before re-enabling;
7. document timeline, scope, remediation, and preventive actions.

## Monitoring

Alert on elevated API error rates, authentication failures, unusual assessment attempt patterns, credential issuance failures, verification failures, database saturation, backup failures, and repeated administrative authorization denials.

## Credential key rotation

Signing keys use explicit key IDs. Rotation adds a new active signing key while preserving verification material for credentials signed with retired keys. A compromised key is disabled immediately and affected credentials are assessed according to the credential policy.
