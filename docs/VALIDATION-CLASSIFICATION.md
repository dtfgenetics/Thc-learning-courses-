# Validation classification

## Authoring checks — blocking

These protect source integrity while allowing rapid work:

- schema and JSON validity
- unique IDs
- resolvable references and mappings
- valid versions/statuses
- deterministic generated registry
- duplicate/assessment structural integrity
- credential/runtime/security regression tests
- PII/private-key exclusion

## Readiness checks — reporting

These measure remaining work and should not reject ordinary authoring commits:

- exact-version human review coverage
- evidence depth and reference quality
- assessment bank depth and review coverage
- pilot statistics and active-pool depth
- accessibility acceptance
- deployed environment evidence
- backup/restore and monitoring drills

## Release checks — blocking

These are strict for publication, production assessment activation, and credential issuance:

- current-version required reviews
- release-scoped assessment eligibility and active/pilot evidence
- production issuer/signing/revocation
- deployed authentication, authorization, MFA and RLS evidence
- accessibility acceptance
- staging/production, backup/recovery and monitoring evidence
- explicit release-scope consistency

A readiness gap is not a source-code defect. A release gate must never be bypassed by changing a readiness report to green without evidence.
