# Production control evidence

THC Academy keeps repository implementation readiness separate from evidence that a control is actually deployed and verified in staging or production.

## Why this exists

A passing unit or integration test proves that a control can work in the repository. It does not prove that the live environment is configured to use that control. Production-only readiness gates therefore require a non-secret evidence record before they can be set to `true`.

Evidence records live under `content/production-control-evidence/` and must conform to `schemas/production-control-evidence.schema.json`. Never commit credentials, private keys, learner data, database dumps, raw security scan output containing secrets, or other sensitive material. Store sensitive artifacts in the approved external system and record only a safe reference plus a concise verification summary.

## Gates covered

The validator protects these production gates:

- production issuer identity and credential signing;
- privileged administrator MFA;
- deployed row-level authorization;
- completed security review;
- content, assessment, and frontend accessibility review/testing;
- staging and production environment verification;
- backup/restore drill completion;
- monitoring and alerting verification.

## Evidence workflow

1. Deploy or perform the real control in the target environment.
2. Run the applicable smoke test, security review, accessibility review, backup/restore drill, monitoring drill, or key-management verification.
3. Create one evidence JSON record containing the gate, environment, verifier, timestamp, safe summary, optional external reference, and repository commit tested.
4. Run `node scripts/validate-production-control-evidence.mjs`.
5. Only after valid evidence exists may the corresponding production gate in `registry/system-readiness.json` be changed to `true`.
6. If evidence expires or is invalidated, mark the record accordingly and return the readiness gate to `false`.

## Repository implementation evidence already present

Repository tests may support preparation without closing deployment gates. Examples include:

- live PostgreSQL RLS isolation tests in `scripts/test-live-rls-policy.mjs` and the PostgreSQL integration workflow;
- privileged MFA enforcement tests in `scripts/test-oidc-auth-adapter.mjs`;
- static Academy accessibility regressions in `scripts/test-academy-accessibility.mjs`;
- API authentication, rate limiting, privacy, and observability tests;
- deterministic credential eligibility, signing test paths, verification projection, and revocation persistence.

These are implementation evidence, not substitutes for production verification.
