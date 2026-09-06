# Database Authorization and Credential Write Integrity

## Purpose
This layer defines the database-side authorization and state-write behavior that production infrastructure must implement and prove. It is intentionally conservative: adding SQL policy candidates and transaction contracts does not make the deployment production-ready by itself.

## Learner row isolation candidate
`database/rls-policies.sql` enables and forces PostgreSQL row-level security for learner-owned runtime tables:

- `learners`
- `enrollments`
- `lesson_progress`
- `assessment_attempts`
- `assessment_attempt_items`
- `learner_competencies`

The candidate policies are read-only for the learner identity stored in the transaction/session setting `thc.learner_id`. Assessment item access is constrained through ownership of the parent attempt. There are deliberately no learner-facing write policies: progress updates, scoring, mastery changes, and credential changes remain trusted server operations.

A production server must establish the learner identity from verified application authentication before setting this database context. End users must never receive direct database credentials. Production service/admin roles, privilege grants, connection-pool reset behavior, and attempts to spoof or leak session context require live staging tests before these policies can be promoted.

## Atomic credential state changes
`createPostgresCredentialWriter()` performs credential transitions inside an injected database transaction. The transaction:

1. locks the current credential row with `FOR UPDATE`;
2. validates the transition with the domain credential state machine;
3. updates the credential using an expected-current-status guard;
4. appends a `credential_status_events` record;
5. appends an `audit_events` record with actor, old state, new state, and reason.

If the guarded update loses a state race, the operation throws before event/audit writes. The production transaction wrapper is responsible for rolling back on any thrown error.

## Why readiness remains blocked
The repository now has testable policy and transactional contracts, but `security.rowLevelAuthorization`, `credentials.revocationPersistence`, `runtime.productionPersistenceAdapter`, and `api.productionDatabaseIntegration` remain false. Promotion requires a real PostgreSQL deployment, migration execution, least-privilege roles, transaction/pool wiring, live authorization tests, rollback/failure tests, and operational evidence.
