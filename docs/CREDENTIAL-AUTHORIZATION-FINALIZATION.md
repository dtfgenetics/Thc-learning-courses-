# Credential Authorization Finalization

The Technician I and Technician II credential programs now have an explicit final authorization workflow instead of relying on manual edits.

## New production prerequisite: secure assessment store

Credential authorization already required `productionControls.secureAssessmentStoreValidated=true`, but there was no matching deployment-backed production control. The production evidence contract now includes a thirteenth control:

`secure-assessment-store`

It maps to `assessment.secureOperationalStoreIntegration` and requires live evidence for the private store/provider identity, ping/bank version, approved-operational item selection, form/exposure recording, quarantine, and answer-material exclusion.

Repository integration tests or code readiness do not satisfy this control.

## Authorization intake

Create an exact-version starter for either credential program:

`npm run evidence:intake:credential-authorization -- --program CREDPROG-CULT-TECH-I-001 --authority AUTHORIZATION-LEAD --issuer-id ISSUER-ID --issuer-name "Issuer Name" --issuer-url https://example.org/verify --write`

The starter is `draft`; final governance approvals and operational validation flags remain false.

## Evidence completion

`npm run evidence:complete:credential-authorization -- --source CREDAUTH-... --authority AUTHORIZATION-LEAD --validity-type indefinite --renewal-required false --renewal-method none --confirm-issuer-authority --confirm-signing-controls --confirm-public-verification --confirm-revocation-policy --confirm-appeals-policy --confirm-lifecycle-policy --confirm-privacy-retention-policy --write`

Completion is blocked until the release dependency graph reports **zero evidence blockers** for the program. That means every course prerequisite has reached at least evidence-complete, candidate governance evidence is approved, and all 13 production controls are at least evidence-complete.

## Final approval and application

`npm run evidence:approve:credential-authorization -- --source CREDAUTH-...-COMPLETE-... --decision-authority FINAL-AUTHORITY --rationale "..." --confirm-program-approval --confirm-assessment-approval --confirm-accessibility-approval --confirm-privacy-legal-approval --confirm-security-approval --confirm-organizational-approval --confirm-release --write`

Final approval is blocked until the release dependency graph reports **zero approval blockers**. The transition is append-only and applies the decision to authoritative source state in the same operation:

- writes a new `approved` credential-authorization evidence record;
- changes the exact credential program to `approved`;
- marks JTA, SME/employer, assessment, accessibility and standard-setting program states validated;
- sets `professionalCredentialUseAuthorized=true` on every exact-version required course;
- sets `liveCredentialFormApproved=true` where that field is part of the integrated course contract.

The credential authorization validator now rejects an approved authorization record if these applied source states disagree with it.

Legacy credential-definition files that are not mapped to the two canonical credential-program IDs are not silently rewritten by this workflow.

## Operator kits

- `npm run credential-authorization:kits`
- `npm run credential-authorization:kits:json`
- `npm run credential-authorization:kits:write`

The two kits show current evidence blockers, approval blockers, candidate-governance state, and production-control progress before presenting the intake/completion/approval commands.
