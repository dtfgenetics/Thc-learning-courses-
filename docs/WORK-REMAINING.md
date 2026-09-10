# THC Academy completion work queue

This file tracks genuine remaining work without turning unfinished production evidence into an authoring blocker.

## Content and assessment

- Refresh scientific/editorial review evidence for any lesson version changed after its last exact-version review or catalog attestation.
- Complete assessment review for current-version release-scoped items and assessments.
- Run a real pilot cohort, collect item statistics, revise weak items, and promote only reviewed/pilot-ready items to the active production pool.
- Continue catalog depth expansion where readiness reports identify thin lessons, modules, or missing assessment coverage.
- Keep all 36 Cultivation Foundations objectives mapped in the coverage policy and maintain scenario/application emphasis.

## Production credentialing

- Configure production issuer identity and protected signing keys outside Git.
- Verify revocation persistence and public verification against the deployed production environment.
- Keep production issuance disabled until explicit release checks pass.

## Security and authorization

- Verify deployed privileged MFA enforcement.
- Verify deployed row-level authorization/RLS isolation with production-equivalent identities.
- Complete security review and record evidence without committing secrets or learner PII.

## Accessibility

- Complete human content and assessment accessibility review.
- Complete frontend runtime accessibility testing using deterministic/non-Playwright project QA.
- Record remediation evidence and rerun static checks.

## Operations and deployment

- Provision and verify staging, then production.
- Run backup/restore drill against the deployed data layer.
- Enable monitoring/alerting and execute the monitoring drill.
- Run staging acceptance and explicit production release checks.

## Definition of finished

The authored curriculum can continue evolving without being blocked by the items above. A production certification release is finished only when current-version review/pilot evidence and deployed security, accessibility, credential, backup, monitoring, and release checks all pass.
