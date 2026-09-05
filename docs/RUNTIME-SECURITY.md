# THC Academy Runtime Security Controls

## Trust boundaries

Curriculum and public metadata may be delivered to learner clients. Secure assessment keys, item-selection logic for credential exams, learner responses, scores, credential signing material, administrative actions, and audit records remain server-side.

## Roles

- `learner`: own enrollments, progress, attempts, credentials
- `author`: draft curriculum content
- `editor`: editorial review
- `scientific-reviewer`: scientific review records
- `assessment-reviewer`: assessment/item review records
- `credential-manager`: eligible credential issuance/revocation workflows
- `administrator`: system administration

Administrative and credential-management roles require MFA in production. Least privilege applies; content authorship alone cannot issue credentials or approve one's own credential-bearing content.

## Authorization rules

Every runtime read/write is authorized server-side. Resource ownership must never be accepted from client-supplied learner IDs without comparison to the authenticated subject. Administrative endpoints require explicit role checks. Database policies should additionally constrain learner-scoped tables by authenticated subject when row-level security is available.

## Assessment security

Production exam forms are assembled on the server from active items only. Clients receive stems/presentation choices without answer keys or rationales. Responses are scored against the immutable item ID/version recorded at attempt creation. A browser-submitted total score is never trusted.

## Credential security

Eligibility is computed from authoritative runtime results. Issuance is idempotent for the learner, credential definition, and curriculum version. Signing keys are loaded from a managed secret/KMS service and never committed to Git. Revocation and supersession are append-only status events.

## Data minimization

Git contains no learner PII or real assessment results. Runtime learner identity should use the authentication provider's opaque subject plus only the minimum additional profile data needed by the product. Public verification must not expose learner email, internal learner IDs, detailed answer history, or internal integrity hashes.

## Audit events

At minimum record: `assessment.started`, `assessment.submitted`, `assessment.scored`, `credential.issued`, `credential.revoked`, `credential.superseded`, `content.reviewed`, `content.published`, `role.changed`, and administrative security changes.

## Production controls still required

- managed identity provider and MFA enforcement
- PostgreSQL TLS and encrypted backups
- row-level or equivalent authorization policies
- secret/KMS-backed credential signing
- rate limiting and abuse protection
- structured logs, metrics, traces and alerting
- dependency and container scanning
- CSP/security headers for web applications
- incident-response and restore drills
- independent security review before credential production launch
