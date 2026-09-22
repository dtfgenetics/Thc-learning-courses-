# Production Credential Signing Integration

## Purpose

THC Academy production credentials must use an external managed signing provider. Private signing keys, recovery seeds, raw key material and signing secrets must never be stored in this repository or returned to application responses.

## Repository integration

`apps/api/src/credential-signing-adapter.mjs` provides the fail-closed application contract.

A deployment sets:

- `NODE_ENV=production`
- `THC_CREDENTIAL_SIGNER_MODULE=<deployment module>`

The deployment module exports:

```js
export async function createCredentialSigner({ env }) {
  return {
    async getIssuerIdentity() {
      return {
        issuerId: 'controlled-stable-id',
        name: 'Teaching Healthy Cultivation',
        url: 'https://dtfseeds.com/'
      };
    },
    async signDigest({ digest, context }) {
      // Send only the digest and minimum context to the managed signer/KMS/HSM.
      return {
        algorithm: 'provider-approved-algorithm',
        keyId: 'non-secret-key-reference',
        signature: 'opaque-signature'
      };
    }
  };
}
```

The repository adapter canonicalizes the public credential payload, computes a SHA-256 digest, sends the digest to the deployment signer, validates the returned public signature envelope and rejects envelopes that expose obvious private key material.

## Release boundary

This code completes the application-side signing integration contract only. It does **not** establish a production issuer identity, choose or approve a cryptographic algorithm, provision a KMS/HSM key, prove key custody/rotation/recovery, approve certificate/credential policy, or authorize credential issuance.

The following remain required before `productionIssuerIdentity` or `productionSigning` can become true:

1. approved issuer identity and legal/organizational ownership;
2. managed production signing key provisioned outside Git;
3. approved algorithm/key policy;
4. least-privilege signer access and MFA/administrative controls;
5. key rotation/revocation/recovery procedure;
6. staging signature/verification exercise;
7. production monitoring/audit evidence;
8. final credential-program release approval.
