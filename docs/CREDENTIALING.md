# Credentialing Rules

## Terminology

Initial THC Academy offerings are assessment-based educational certificate programs. Do not represent them as government licenses, accredited college credentials, or independent personnel certifications unless the applicable external requirements are actually satisfied.

## Issuance

A credential may only be issued when the deterministic eligibility engine confirms all requirements for the exact published program version. Course progress alone is not sufficient.

## Required credential metadata

- immutable credential ID
- learner identifier
- credential definition ID and version
- course/program version
- issue timestamp
- status
- competencies demonstrated
- evidence/assessment references
- issuer identity

## Lifecycle

`eligible -> issued -> valid`

Valid credentials may transition to `superseded`, `expired`, or `revoked`. Every status transition must create an append-only audit event.

## Privacy

Public verification must expose only approved public credential metadata. Do not expose learner email, raw assessment responses, IP addresses, authentication identifiers, or private audit records.

## Signing

Future Open Badges / Verifiable Credential signing keys must be stored outside the repository in a secure key/secret management system. Staging and production issuer identities must be separate.
