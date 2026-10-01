# Technician I Credential Issuance & Verification Workflow

**Credential:** `CREDPROG-CULT-TECH-I-001`  
**Status:** development workflow — issuance disabled until release approval

## Issuance preconditions

The issuance service must refuse to issue Technician I unless all of the following are true:

1. the credential program version is approved/published;
2. `registry/technician-i-release-evidence.json` computes release-ready under the controlled readiness reporter;
3. required courses and academic prerequisites are complete under their approved versions;
4. required Practicals A–F are accepted under approved scoring/decision rules;
5. the integrated capstone is accepted under the approved decision rule;
6. any required secure written/scenario credential assessment is passed under the approved operational blueprint;
7. there is no unresolved credential-blocking critical failure;
8. candidate identity and evidence linkage are verified under the approved privacy/security process;
9. no active appeal, security hold or evidence-integrity hold blocks issuance.

A staff role must not be able to bypass release readiness simply by changing a display status.

## Issuance record

A private authoritative credential record should contain at minimum:

- credential instance ID;
- credential program ID and version;
- candidate internal identifier and immutable learner reference;
- certification application reference linking the candidate decision to the applicable credential program;
- candidate certificate/display name snapshot used for the issued artifact;
- issuance timestamp;
- current status (`active`, `suspended`, `revoked`, `expired` if renewal is later adopted);
- evidence-decision reference(s), not full secure assessment content;
- issuer/decision authority;
- audit trail for status changes;
- public verification token/identifier that does not expose private candidate evidence.

## Public verification response

The public verification surface should return only what is needed to verify the credential, such as:

- credential title and level;
- issuer;
- credential instance/status;
- issue date;
- program/version identifier;
- expiration/renewal date only if the approved program later requires one;
- candidate display name only under the approved privacy/consent policy and only when the issuance record carries that consent state;
- verification timestamp.

Do not expose assessment items, answer keys, attempt history, medical/accommodation data, detailed assessor notes, internal candidate identifiers, or private evidence artifacts.

## Revocation, suspension and correction

Credential state changes require an authorized workflow with reason code, evidence reference, decision authority, timestamp and audit trail. Corrections must preserve history rather than silently rewriting the original issuance record.

## Reissue and versioning

A corrected display artifact may be reissued without changing the underlying credential instance when the correction does not change the credential decision. A new credential decision or later credential version must be distinguishable from the earlier instance.

## Verification security

Verification identifiers should be high-entropy/non-sequential where practical and must not function as authentication credentials. The public endpoint should be read-only, rate limited, and resistant to enumeration. Signing keys or verification secrets must never live in the public repository.

## Current state

The workflow contract exists and the learner runtime now persists learner references, certification application references and certificate-name data used to bind course-assessment evidence to a candidate record. Public verification can render a printable certificate from an issued verification record and exposes a recipient display name only when explicit public-name consent is present.

Operational issuance remains disabled. The release-evidence gate `credentialIssuanceWorkflowApproval` stays `not-approved` and `finalProgramReleaseApproval` stays unresolved until production issuer identity/signing/revocation controls, governance approvals and the remaining professional certification evidence gates are approved.
