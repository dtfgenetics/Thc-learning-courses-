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
