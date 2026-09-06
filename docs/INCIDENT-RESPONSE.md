# Incident Response Runbook

## Purpose and scope
This runbook defines the minimum response process for security, privacy, credential-integrity, content-integrity, and availability incidents affecting THC Academy. It applies to the API, databases, credential issuance and verification, curriculum publication pipeline, administrative access, and supporting infrastructure.

The current repository is not production-ready. Production deployment must assign named on-call owners, contact paths, hosting procedures, and monitoring integrations before launch.

## Severity levels
- **SEV-1 Critical:** confirmed compromise of credential signing material, unauthorized credential issuance or revocation at scale, confirmed exposure of learner PII, or sustained outage of credential verification with material user impact.
- **SEV-2 High:** suspected privileged-account compromise, limited unauthorized data access, integrity failure affecting published curriculum or assessments, or repeated service degradation.
- **SEV-3 Moderate:** contained security control failure, isolated incorrect credential state, non-sensitive data integrity issue, or degraded non-critical functionality.
- **SEV-4 Low:** minor operational defect with no confirmed confidentiality, integrity, or availability impact.

## Detection and declaration
1. Record the detection time, reporter, affected service, observed symptoms, and available request or audit identifiers. Do not copy secrets, bearer tokens, raw learner PII, or private signing material into tickets or chat.
2. Assign an incident commander and severity.
3. Open an incident log with UTC timestamps and preserve relevant application, infrastructure, audit, and database evidence.
4. If compromise is plausible, treat credentials and sessions as untrusted until proven otherwise.

## Containment
- Disable or isolate affected administrative credentials and service tokens.
- Stop credential issuance if credential integrity or signing systems may be affected; public verification may remain read-only if its data is trustworthy.
- Restrict affected deployment routes and administrative endpoints.
- Preserve logs and database snapshots needed for investigation before destructive remediation when safe to do so.
- Do not delete audit events to hide or simplify the incident record.

## Eradication and recovery
1. Identify the root cause and the earliest known compromise or failure window.
2. Patch the vulnerable code or configuration and rotate affected secrets.
3. Validate database integrity, credential state, and published curriculum state against authoritative records.
4. Restore service in stages, beginning with read-only verification where practical.
5. Run the repository quality gates and deployment checks before restoring write operations.
6. Increase monitoring during the recovery window and document the final restoration time.

## Credential signing key compromise
- Immediately stop production credential issuance.
- Revoke or disable the compromised key at the issuer/key-management layer.
- Determine all credentials signed during the possible compromise window.
- Rotate to a new managed signing key; do not commit replacement private keys to Git.
- Decide whether affected credentials require revocation and re-issuance, preserving an auditable supersession/revocation trail.
- Publish verifier behavior that clearly distinguishes valid, revoked, expired, and superseded credentials.

## Database or privacy incident
- Restrict database access and rotate affected database/application credentials.
- Determine which tables, records, fields, and time windows were exposed or modified.
- Preserve audit evidence and avoid exporting unnecessary learner data during investigation.
- Validate that public credential verification still excludes learner identifiers and subject hashes.
- Follow applicable contractual and legal notification requirements with qualified counsel and the production operator; this runbook does not replace jurisdiction-specific breach obligations.

## Credential issuance or revocation integrity incident
- Pause issuance/revocation writes if the authoritative state cannot be trusted.
- Compare credential records, credential-status events, assessment eligibility evidence, and audit events.
- Correct state only through an auditable administrative workflow; do not rewrite historical events silently.
- Re-run deterministic eligibility checks before any re-issuance.

## Curriculum or assessment content integrity incident
- Freeze publication of the affected version.
- Identify altered lessons, assessment definitions, question items, references, reviews, and registry entries.
- Restore from a reviewed Git revision, then re-run validation, registry, review, and release-readiness gates.
- Require renewed scientific/editorial/assessment review when the restored or corrected content changes substantive claims or scoring behavior.

## Communications
- Keep a single incident timeline and decision log.
- Communicate only confirmed facts; label hypotheses as hypotheses.
- Do not expose learner PII, credentials, secrets, exploit details that create immediate risk, or private security logs in public updates.
- For user-impacting incidents, state affected functionality, known scope, mitigation, and restoration status.

## Post-incident review
Within the operator's defined review window, document: timeline, root cause, impact, detection gap, containment actions, recovery actions, evidence preserved, credential/data corrections, control failures, and assigned corrective actions. Add regression tests or release gates for preventable failure modes and verify closure of corrective actions.

## Readiness dependencies before production
This runbook satisfies the repository-level incident-response documentation gate only. Production still requires named responders, tested escalation contacts, monitoring/alerting, backup/restore exercises, hardened authentication with MFA for administrators, production persistence, managed credential signing, and a deployed staging/production environment.
