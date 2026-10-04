# Evidence Submission Review Decisions

Evidence submission manifests package exact-version evidence for review. Review decisions are stored separately so the original submitted manifest remains auditable.

## Create a decision

`npm run evidence:submission:decision:create -- --submission EVSUB-... --decision accepted --reviewer REVIEWER-ID --summary "Reviewed exact-version evidence package." --write`

Allowed decisions:

- `accepted`
- `returned`
- `revision-required`

The submission must already be `ready-for-review` (or an existing accepted manifest being reconciled).

## Validation

- `npm run evidence:submission:decision:validate`
- `npm run evidence:submission:decision:report`

An accepted manifest requires a matching accepted decision record. Decision timestamps cannot predate submission.

## Reconciler connection

The authoritative certification evidence reconciler now surfaces accepted course-level and credential-program-level submission IDs for each course. Submission acceptance is **review workflow metadata only**; it does not directly promote a certification gate. Gate status still comes from the underlying exact-version evidence record and the gate-specific validator.

This separation preserves auditability while preventing a reviewer from turning incomplete evidence into release approval merely by accepting a package.
