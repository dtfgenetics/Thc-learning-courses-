# Technician II Credential Issuance & Verification Workflow

**Credential:** `CREDPROG-CULT-TECH-II-001`  
**Status:** development workflow — issuance disabled until release approval

## Issuance preconditions

The issuer must refuse Technician II issuance unless all are true:

1. the credential program/version is approved and published;
2. `registry/technician-ii-release-evidence.json` computes release-ready;
3. prerequisite Technician I and all eight Technician II courses satisfy approved completion requirements;
4. Practicals A–G are accepted under approved scoring/decision rules;
5. the Senior Technician Diagnostic Shift capstone is accepted;
6. any required secure written/scenario credential assessment is passed under an approved operational blueprint/form;
7. no unresolved credential-blocking critical failure exists;
8. candidate identity/evidence linkage is verified under approved privacy/security controls;
9. no active appeal, security hold or evidence-integrity hold blocks issuance.

A display/status edit cannot bypass release readiness.

## Authoritative private record

Store credential instance ID, program ID/version, candidate internal identifier, issuance timestamp, current state, evidence-decision references, issuer/decision authority, auditable status-transition history and a privacy-safe public verification identifier. Full secure assessment content is not embedded in the credential record.

## Public verification

Return only approved minimum fields: credential title/level, issuer, instance/status, issue date, program/version, approved expiration/renewal date if later adopted, candidate display name only under approved privacy policy and verification timestamp.

Do not expose assessment items/keys, attempt history, accommodation/medical data, detailed assessor notes, private candidate IDs or evidence artifacts.

## Suspension, revocation and correction

State changes require authorized reason code, evidence reference, decision authority, timestamp and immutable audit history. Corrections preserve prior history rather than silently rewriting issuance evidence.

## Security

Verification identifiers are high-entropy/non-sequential where practical and are not authentication secrets. Public verification is read-only, rate-limited and resistant to enumeration. Signing keys and private verification secrets never reside in the public repository.

## Current state

Operational issuance remains disabled. `credentialIssuanceWorkflowApproval` stays `not-approved` and final program release remains unresolved until the real implementation and governance are approved.
