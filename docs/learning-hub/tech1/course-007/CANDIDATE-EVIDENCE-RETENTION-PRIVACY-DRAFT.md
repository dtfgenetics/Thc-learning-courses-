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

## Retention schedule — issuer baseline pending approval

The project now has a documented issuer baseline so the system does not rely on silent indefinite retention. These periods are **not represented as legal requirements** and remain subordinate to applicable law, contracts, accreditation requirements and approved privacy/legal review:

- failed practice attempts: **90 days after last practice activity**, unless linked to an active appeal, security investigation or required audit record;
- readiness attempts: **12 months after last readiness activity**, unless superseded by a credential attempt or active review;
- credential attempts: **7 years after final attempt disposition**, or longer when required by applicable law, contract, accreditation or an unresolved appeal/security matter;
- evaluator/calibration evidence: **5 years after the calibration evidence is superseded or evaluator authorization ends, whichever is later**;
- appeal/adjudication records: **7 years after final appeal disposition**, or longer while a related legal/security matter remains open;
- issued credential verification records: **active credential lifetime plus 7 years after expiration, revocation or retirement**;
- revoked/expired credential records: **7 years after revocation or expiration**, retaining only the minimum public verification projection needed for historical status;
- security logs: **24 months by default**, with incident-linked logs retained with the incident record until the longer applicable retention requirement expires.

The baseline is defined in `registry/candidate-governance-controls.json`. It must not be activated as an operational deletion schedule until the required approvals are recorded.

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

Governance structure and a proposed retention schedule are defined and machine-aligned. Privacy/legal approval, security approval, organizational approval and operational-use authorization remain open. This document satisfies the machine requirement for an explicit controlled draft; it does not close the privacy release gate.
