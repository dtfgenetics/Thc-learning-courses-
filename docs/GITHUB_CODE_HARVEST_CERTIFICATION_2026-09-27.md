# GitHub Code Harvest — Certification & Assessment Systems — 2026-09-27

Purpose: identify mature open-source code and standards that can improve THC Academy assessment, credential portability, verification, and interoperability without replacing working canonical scoring, attempt, persistence, or credential-governance systems.

## Current conclusion

The Academy already contains substantial first-party infrastructure:
- server-side summative scoring;
- resumable learner attempts;
- persisted expiration timestamps;
- configured retake limits/cooldowns;
- randomized items/choices where configured;
- learner progress and competency transcripts;
- practical-evaluation workflows;
- credential eligibility, persistence, issuance gates, revocation-aware public verification, and private learner credential retrieval;
- explicit separation between academic course finals and higher-integrity credential assessment banks.

Do not replace these systems with a generic quiz package.

## High-value external references

### 1EdTech QTI 3.x
Use for: assessment import/export interoperability, item/test packaging, and future interchange with LMS/assessment systems.
Decision: implement exporters/adapters around the canonical THC item model rather than adopting a foreign runtime as the source of truth.
Important boundary: QTI export must never expose private credential-bank answer keys or secure-form internals.

### citolab/qti-components
Repository: https://github.com/citolab/qti-components
Use for: reference implementation patterns for QTI item/test rendering and interaction semantics.
Decision: benchmark interactions and QTI mappings; do not replace the Academy runtime until a concrete interoperability requirement justifies it.

### citolab/qti-converter
Repository: https://github.com/citolab/qti-converter
Use for: conversion/reference patterns when building controlled QTI import/export tooling.
Decision: research/reference first. Preserve THC stable IDs, competency mappings, evidence references, item versions, and governance state during any conversion.

### 1EdTech Open Badges 3.0
Repository: https://github.com/1EdTech/openbadges-specification
Use for: portable credential representation and compatibility with external credential wallets/platforms.
Decision: high-value future output format after issuer identity, signing/key custody, revocation persistence, and credential-manager authorization gates are production-approved.

### W3C Verifiable Credentials 2.0 + panva/jose
Repository: https://github.com/panva/jose
Use for: standards-based signing primitives when a production-approved signer/key-management design is selected.
Decision: do not wire signing directly into the public repo before issuer identity, key custody, algorithm policy, rotation, revocation, and operational authorization are finalized. Current fail-closed signer-module boundary is correct.

### node-qrcode
Repository: https://github.com/soldair/node-qrcode
License: MIT.
Use for: QR encoding of the public credential verification URL on printable learner certificates.
Decision: safe UI enhancement once implemented without embedding private learner data in the QR payload. QR should contain only the public verification URL/verification identifier.

### qrcode-generator
Repository: https://github.com/kazuhikoarase/qrcode-generator
License: MIT.
Use for: dependency-light browser QR generation if the Academy wants to avoid adding a larger package/runtime.
Decision: viable alternative to node-qrcode for the printable verification surface.

## Do not import

- Generic client-side quiz engines that ship answer keys to the browser.
- Proctoring/surveillance libraries that collect invasive device, webcam, or biometric data.
- Credential libraries that require bypassing the Academy's current issuer-authorization gates.
- Entire LMS frameworks simply to gain one assessment or badge feature.
- Third-party question banks whose licensing, correctness, or psychometric provenance is unclear.

## Next implementation order

1. Add a public-verification QR code to printable issued credentials using only the public verification URL.
2. Build a one-way QTI 3 export prototype for approved non-secure academic items.
3. Add QTI round-trip validation fixtures without changing the canonical THC JSON item model.
4. Build an Open Badges 3.0 projection from an already-issued credential record; keep it disabled for production issuance until signer/governance gates are approved.
5. Evaluate JOSE signing only behind the existing managed signer interface.
6. Continue protecting secure credential-bank boundaries and never export private answer keys through public interoperability formats.
