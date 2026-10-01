# Technician I Secure Assessment Store Contract

**Credential:** `CREDPROG-CULT-TECH-I-001`  
**Status:** development contract — not approved for operational credential delivery  
**Public blueprint:** `ASSESS-CRED-TECH1-001`

## Boundary

The public repository contains curriculum, public academic assessments, blueprints and development controls. It must **not** contain the operational secure credential item bank, operational answer keys, live credential forms, candidate attempts, candidate identities, signing secrets, private keys, or production assessor evidence.

Public `ITEM-*` files may support instruction, practice, academic checks and development analysis. They are not secure credential evidence and may not be silently promoted into operational credential forms.

## Required private store objects

An approved private assessment system must support versioned records for:

- secure item ID and revision;
- competency/JTA-domain mapping;
- secure stem, options or task materials;
- scoring key/rubric and rationale;
- source/evidence provenance;
- review/approval status;
- pilot/psychometric metadata where applicable;
- exposure history and retirement state;
- form assignments and form revision;
- accommodation-compatible presentation metadata;
- security-incident/compromise state;
- immutable audit events for privileged changes.

Candidate identity, attempts and performance evidence must be stored separately from authoring content wherever practical and linked through controlled identifiers.

## Access control

Operational access must be least-privilege and role based. At minimum distinguish:

- item author/reviewer;
- assessment administrator;
- evaluator/assessor;
- candidate delivery role;
- credential decision role;
- security/audit role.

No role should receive answer-key or full-bank access merely because it can administer a course or issue a credential. Privileged reads and changes must be auditable.

## Environment separation

Development, pilot and operational credential environments must remain distinguishable. Production forms must not be generated from an unapproved development bank. Test fixtures and synthetic candidate records must not be mixed with live credential records.

## Data protection

The operational implementation must define and approve:

- encryption in transit and at rest;
- secret/key management and rotation;
- backup and recovery controls;
- audit-log retention;
- data-location and access requirements;
- incident response for item/form exposure;
- secure deletion/retirement procedure;
- vendor/subprocessor controls when an external delivery system is used.

## Runtime provider contract

The API adapter refuses an operational provider unless it identifies itself as `private-operational-assessment-store`, implements the required operational methods, and declares a `securityControls` capability block. The declaration must state that least-privilege access, privileged-access auditing, encryption in transit and at rest, backup/recovery, key-management separation, environment separation, and exclusion of public-repository credential material are enabled. The provider must also declare an approved least-privilege RBAC or ABAC access-control model.

This declaration is a software boundary, **not** evidence that the controls have been independently reviewed or approved. The release gate remains fail-closed until a real provider is deployed and its security/privacy, recovery, access, audit, and operational controls are verified with real evidence.

## Form delivery

The delivery service receives only the minimum secure content required for the assigned form/session. Client-visible payloads must not include unused keys, bank metadata, hidden items, scoring rationales or other forms. Randomizing public items is not a security control.

## Release gate

The release-evidence gate `secureAssessmentStore` remains `not-approved` until a real implementation is security/privacy reviewed and explicitly approved. Creating this contract does not close that gate.
