# Candidate Governance Issuer Policy Baseline — v0.2.0

This version closes the **issuer-policy design** gaps that were previously null while preserving the privacy/legal and operational-release boundary.

## Approved issuer choices

- credential attempt limit: **3 total attempts**
- minimum retest interval: **168 hours / 7 days**
- remediation required before retest
- equivalent secure form/variant required
- critical failures remain non-compensatory
- no automatic retest fee at initial launch
- accommodations preserve the construct and remain separate from scoring
- appeals preserve original records and secure answer content
- security incidents use hold/investigation/documented disposition rather than silent evidence mutation
- public verification exposes only the minimum approved credential projection

These are THC Academy issuer-policy choices. ISO/IEC 17024:2026 supports fairness, records, confidentiality, security, assessment reliability and appeals; DOJ ADA guidance supports accessible testing; FTC guidance supports data minimization, limited access and purpose-based retention. None of those sources dictates the numeric values above.

## Proposed retention baseline

- **failedPracticeAttempts:** 90 days after last practice activity, unless linked to an active appeal, security investigation or required audit record
- **readinessAttempts:** 12 months after last readiness activity, unless superseded by a credential attempt or active review
- **credentialAttempts:** 7 years after final attempt disposition, or longer when required by applicable law, contract, accreditation or an unresolved appeal/security matter
- **evaluatorCalibrationEvidence:** 5 years after the calibration evidence is superseded or evaluator authorization ends, whichever is later
- **appealAdjudicationRecords:** 7 years after final appeal disposition, or longer while a related legal/security matter remains open
- **issuedCredentialVerificationRecords:** for the active credential lifetime plus 7 years after expiration, revocation or retirement of the credential record
- **revokedExpiredCredentials:** 7 years after revocation or expiration, with the minimum public verification projection retained only as necessary to verify historical status
- **securityLogs:** 24 months by default; incident-linked logs retained with the incident record until its longer retention requirement expires

The retention schedule is intentionally **not marked privacy/legal approved**. Applicable law, accreditation, contracts or a later approved privacy/legal review may require changes.

## Current approval state

Program, assessment, accessibility, security and organizational governance: **approved as issuer policy**.  
Privacy/legal review: **pending**.  
Operational use: **not authorized**.  
Credential issuance: **not authorized by this record**.
