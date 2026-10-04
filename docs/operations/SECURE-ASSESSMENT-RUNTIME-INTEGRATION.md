# Secure Operational Assessment Runtime Integration

The public repository now provides application-side contracts for a **separate private operational assessment store**. It intentionally does not contain operational credential items, answer keys, live forms or candidate attempts.

## Deployment adapter

Set `THC_SECURE_ASSESSMENT_STORE_MODULE` to a deployment module exporting:

```js
export async function createSecureAssessmentStore({ env }) {
  return {
    kind: 'private-operational-assessment-store',
    async ping() {},
    async bankVersion() {},
    async selectOperationalItems({ credentialProgramId, blueprint, exclusions }) {},
    async recordForm({ privateManifest }) {},
    async recordExposure({ candidateRef, formId, itemAssignments }) {},
    async quarantineItem({ secureItemId, revision, reason }) {}
  };
}
```

Operational item identifiers must use the private `SECITEM-*` namespace. Public `ITEM-*` development identifiers are rejected.

## Form boundary

`packages/domain/secure-operational-assessment.mjs`:

- validates private operational item state;
- rejects public-development item IDs;
- requires explicit approved-operational status and private-operational source classification;
- creates a private form manifest containing only item assignment metadata;
- creates a delivery projection with the minimum item content required by the assigned form;
- strips scoring keys, rationales and bank metadata from delivery payloads.

The delivery system must still apply session authorization, transport encryption, anti-caching controls, exposure limits and provider-specific security controls.

## Equivalence boundary

This implementation supplies the construction/security interface needed to build equivalent forms. It does not claim that two forms are psychometrically equivalent. Final equivalence tolerances require real item/pilot evidence and formal standard-setting/equating decisions.

## Release boundary

The credential release gates `secureOperationalItemBank`, `secureAssessmentStore` and `equivalentSecureForms` remain unresolved until a real private bank/store is populated, reviewed, pilot-supported where required, security/privacy approved and exercised in the deployed environment.


## PostgreSQL first-party provider

The repository now includes `apps/api/src/postgres-secure-assessment-store.mjs` and an isolated `database/secure-assessment-schema.sql` for:

- private operational bank/version metadata;
- `SECITEM-*` operational item revisions and private scoring material;
- private form manifests;
- HMAC-pseudonymized candidate exposure audit records;
- item quarantine state.

No operational item content is seeded from Git. The production database must be populated through an approved private authoring/review process.

Production bootstrap requires a valid separate `secureAssessmentStore`. When using the repository PostgreSQL provider, configure:

- `THC_SECURE_ASSESSMENT_STORE_MODULE=./apps/api/src/postgres-secure-assessment-store.mjs`;
- `THC_SECURE_ASSESSMENT_POSTGRES_POOL_MODULE` with a separate pool/credential set from the learner/runtime database;
- `THC_SECURE_ASSESSMENT_SECURITY_CONTROLS_JSON` with the security-control declaration required by the adapter contract;
- `THC_SECURE_ASSESSMENT_AUDIT_HMAC_KEY` with a secret-manager value used only to pseudonymize candidate exposure references.

Bootstrap validation proves only that the application boundary is configured and fail-closed. It does not substitute for independent security review, access-control testing, backup/restore evidence, human assessment review, pilot evidence, standard setting, or final credential authorization.


## Privileged bank management

The deployed API now exposes a protected administration lifecycle for building a **new private operational bank** without committing item content to Git.

Production admin authorization must use the existing `admin:read` / `admin:write` scopes. Production bootstrap requires MFA for admin scopes.

The lifecycle is:

1. create a draft bank for one credential program;
2. create immutable `SECITEM-*` revisions inside that draft bank;
3. move an item from `draft -> pilot` only with an evidence reference;
4. move an item from `pilot -> approved-operational` only with an evidence reference;
5. quarantine or retire an exposed/invalid item rather than mutating its historical revision;
6. activate a bank only when it contains at least one item and **every** item is `approved-operational`;
7. activation retires the prior active bank for the same credential program;
8. every privileged create/transition/activation writes `secure_assessment_admin_audit`.

Admin API responses return identifiers, states, counts and audit IDs only. They do not echo protected prompts, scoring keys, rationales or bank content.

Evidence references are pointers to real controlled review/pilot/approval records; entering a string is not itself evidence and must never be used to fabricate completion of a human or psychometric gate.
