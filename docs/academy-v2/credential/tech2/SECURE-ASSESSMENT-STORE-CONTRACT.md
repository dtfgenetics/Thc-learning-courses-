# Technician II Secure Assessment Store Contract

**Credential:** `CREDPROG-CULT-TECH-II-001`  
**Status:** development contract — not approved for operational credential delivery  
**Public blueprint:** `ASSESS-CULT-TECH-II-CREDENTIAL-001`

## Boundary

The public repository may contain curriculum, public academic assessments, development blueprints, practical/capstone specifications and validation tooling. It must not contain the live Technician II operational credential item bank, answer keys, selected secure forms, candidate attempts, candidate identities, private assessor evidence, signing secrets or production keys.

Public `ITEM-TECH2-*` material is development content only and cannot be promoted into an operational credential form merely because it passes repository CI.

## Required private store objects

An approved private operational assessment store must support versioned records for secure item/task ID and revision, competency/domain mapping, protected stem/options/task media, scoring key/rubric and rationale, source provenance, review/approval state, pilot/psychometric metadata, exposure history, retirement/quarantine state, form assignment, accommodation-compatible presentation metadata, compromise status and immutable privileged audit events.

Candidate identity, attempts and scored evidence should be separated from authoring content wherever practical and linked through controlled identifiers.

## Access control

Least-privilege roles must distinguish item author/reviewer, assessment administrator, evaluator/assessor, candidate delivery role, credential decision authority and security/audit administrator. Course administration alone must not grant answer-key or full-bank access.

## Environment separation

Development, pilot and operational credential environments must remain distinguishable. Production forms cannot be generated from an unapproved development bank. Synthetic/test candidate records cannot be mixed with live credential records.

## Data protection and recovery

Operational implementation requires approved encryption in transit/at rest, secret/key management and rotation, backup and restore controls, audit-log retention, privileged-access logging, incident response for form/item exposure, secure retirement/deletion procedures and vendor/subprocessor controls when external systems are used.

## Delivery boundary

The delivery service receives only content needed for the assigned secure form/session. Client-visible payloads must not include unused keys, hidden forms, scoring rationales, bank metadata or other candidates' data. Randomization of public items is not a security control.

## Release gate

The release-evidence gate `secureAssessmentStore` remains `not-approved` until a real private implementation is security/privacy reviewed and explicitly approved. This contract does not close that gate.
