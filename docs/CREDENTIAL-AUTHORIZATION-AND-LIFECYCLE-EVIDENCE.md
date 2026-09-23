# Credential Authorization and Lifecycle Evidence

## Purpose

This layer governs the final program-level decision to authorize issuance of the Technician I and Technician II credentials.

It does not treat course publication, passing scores, CI success, or individual learner eligibility as authorization to issue a professional credential.

## Exact-version scope

Authorization evidence is pinned to:

- the exact credential-program version;
- every required canonical course and its exact current version; and
- the current candidate-governance-controls version.

A course or credential-program version change makes the prior authorization record insufficient for the new version until reviewed and re-authorized.

## Required control domains

An approved authorization record must document all of the following:

- issuer identity and authority;
- managed external signing with no private key material in the repository;
- key rotation and compromise response;
- minimum-necessary public verification and tamper detection;
- revocation policy, decision authority, effective date, public status update and audit trail;
- appeals policy preserving the original record and protecting secure answer material;
- validity, renewal, supersession and expiration rules;
- privacy/data minimization, role-based access, retention schedule and record disposition;
- persistence, authorization, backup/restore and monitoring validation;
- signing integration and secure operational assessment-store validation;
- program, assessment, accessibility, privacy/legal, security and organizational approvals;
- an explicit final release decision by the designated authority.

## Candidate governance dependency

The repository already contains `registry/candidate-governance-controls.json`. Credential authorization remains fail-closed while that registry is `approval-pending` or `operationalUseAuthorized=false`.

The project must not invent final attempt limits, waiting periods, fees, retention periods, or privacy/legal approvals merely to make the credential appear ready.

## Commands

- `npm run credential:authorization:validate`
- `npm run credential:authorization:readiness`

Credential authorization evidence feeds the certification-wide evidence reconciler. A record may be structurally complete before it is approved; only exact-version approved evidence can satisfy the final credential-authorization gate.
