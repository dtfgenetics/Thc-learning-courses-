# Authoring and release validation boundary

THC Academy development is intentionally permissive during authoring and strict at release.

## Authoring

Ordinary `content/*`, `feat/*`, and `fix/*` work may add or revise lessons, questions, assessments, visuals, references, modules, courses, and credential definitions without first refreshing human-review, pilot, deployment, or production evidence.

Authoring validation should fail only for defects that make the source internally invalid or unsafe to integrate, including malformed schema, duplicate IDs, broken references, impossible mappings, invalid status values, corrupt generated structures, credential-integrity regressions, or security boundary regressions.

Readiness reports may identify stale reviews, missing review evidence, pilot gaps, accessibility work, deployment evidence, active-pool gaps, or production controls. Those findings are work queues, not ordinary authoring blockers.

Historical review records remain immutable audit history. A content version change makes prior review evidence stale for the new version; it does not make the historical record invalid.

## Release

Publication, production assessment activation, and credential issuance remain fail-closed. Release checks must require current-version review evidence, valid item status and pilot evidence where applicable, production identity/signing, authorization and security controls, accessibility verification, deployment evidence, backup/recovery, monitoring, and any other release contract encoded by the repository.

Do not weaken release checks to make development green. Do not mark review, pilot, security, accessibility, deployment, or credential evidence complete unless the corresponding evidence exists.

## CI rule

Pull-request CI reports readiness but does not require the entire product to already be production-ready. The explicit release workflow is the enforcement point for production readiness.
