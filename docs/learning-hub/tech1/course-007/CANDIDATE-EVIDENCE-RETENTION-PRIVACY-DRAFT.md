# Technician I Candidate Evidence Retention & Privacy Draft

**Applies to:** Course 7 integrated lab, Practicals A–F, capstone and professional credential evidence  
**State:** governance draft; legal/privacy/security approval required before live credential use

## Purpose

Define the minimum controls for collecting, using, retaining, securing and disposing of candidate performance evidence. This draft is not legal advice and does not substitute for jurisdiction-specific privacy, employment, education or records-retention review.

## Data-minimization principle

Collect only evidence necessary to administer, evaluate, audit, remediate and verify the credential. Do not collect unrelated sensitive personal information merely because the runtime can store it.

## Candidate evidence categories

Potential controlled evidence includes:

- candidate identifier;
- enrollment/eligibility status;
- assessment/practical/capstone form and version;
- timestamps and event/decision records;
- measurement/work-order entries;
- uploaded or generated work artifacts;
- evaluator scores and rubric evidence;
- prompts/assistance/accommodation administration notes necessary to interpret the score;
- critical-failure/adjudication records;
- remediation/retest history;
- approval/issuance status;
- verification identifier for an issued credential.

## Separate public and private data

### Private operational evidence

Keep secure and non-public:

- assessment items and answer keys;
- secure form configuration/event logic;
- raw candidate event stream;
- detailed evaluator notes;
- internal adjudication discussions;
- accommodation documentation beyond what is necessary for administration;
- security/fraud indicators;
- non-public contact/account information.

### Public verification data

Expose only the minimum approved credential-verification fields, such as:

- credential title/level;
- issuer;
- credential identifier;
- issue date and, if applicable, status/expiration;
- approved capability-domain summary;
- verification status.

Do not expose test questions, raw scores, private evidence, evaluator notes or accommodation information by default.

## Access control

Use role-based access. At minimum distinguish:

- candidate;
- instructor/remediation role;
- evaluator/assessor;
- assessment administrator;
- credential approver;
- security/audit administrator;
- public verifier.

Access should be limited to the minimum information required for the role.

## Retention schedule — unresolved governance item

The final retention periods must be approved based on legal, accreditation/business, audit, appeals and credential-verification needs. Until approved, the system should not silently delete or indefinitely retain credential evidence under an undocumented rule.

The approved schedule should separately define retention for:

- failed/practice attempts;
- readiness attempts;
- credential attempts;
- evaluator/calibration evidence;
- appeal/adjudication records;
- issued credential verification records;
- revoked/expired credentials where applicable;
- security logs.

## Integrity and auditability

Credential evidence should preserve:

- source/version of the form and rubric;
- who created or modified a record where applicable;
- original evidence and controlled corrections;
- status transitions;
- approval/revocation actions;
- relationship between practical/capstone evidence and the issued credential.

Do not permit an administrator to overwrite original scored evidence without an audit trail.

## Candidate access/correction

The final policy should define:

- what evidence a candidate may view;
- how factual identity/contact errors can be corrected;
- how scoring disagreements enter the appeal process;
- what secure assessment content must remain withheld to protect form security;
- how a candidate can request privacy/data-rights actions where legally applicable.

## Accommodation confidentiality

Store only the administration information necessary to implement an approved accommodation. Do not expose disability/medical documentation in public credential output or ordinary evaluator views when the evaluator only needs the approved administration rule.

## Breach/security response

The production system requires a documented incident process covering unauthorized access, assessment-content exposure, candidate-data exposure, credential fraud and integrity compromise. Security events should preserve evidence for investigation without expanding access unnecessarily.

## Deletion/disposal

When approved retention periods expire, disposal should be controlled and auditable. Backup/log retention must be considered so deletion claims reflect actual system behavior.

## Required approval before live credential use

- privacy/legal review appropriate to intended operation/jurisdictions;
- security review;
- retention schedule approval;
- candidate notice/consent or other lawful-basis review where applicable;
- access-control review;
- incident-response approval;
- public-verification data-field approval.

## Current status

Governance structure is defined, but final retention periods and legal/privacy approvals remain open. This document satisfies the machine requirement for an explicit controlled draft; it does not close the privacy release gate.
