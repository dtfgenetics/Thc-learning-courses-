# Source Reconciliation — 2026-09-20

## Purpose

Establish one controlled interpretation of the THC Academy / certification project before release-completion work continues.

## Source-of-truth order

1. **Certification repository registries and canonical content objects** in `dtfgenetics/Thc-learning-courses-` are authoritative for current certification architecture, lifecycle state, readiness gates, course composition, assessments, credentials, review records, deployment evidence, and release status.
2. **Repository readiness ledgers and executable validation** are the authoritative projection of machine-verifiable completion. Human-readable matrices must agree with them and must not advance human gates.
3. **Google Drive controlled registers and course/visual masters** are supporting controlled records, source-material stores, historical packages, and production-asset masters. A Drive title or historical status does not override a newer canonical repository object.
4. **The legacy 420-course catalog** is retained as a broad educational/resource taxonomy. The 420 `THC-C###` records are reconciled through `registry/legacy-420-resource-reconciliation.json` and are not treated as 420 separate credential-bearing certification courses.
5. Superseded Drive documents and historical repo documents remain historical evidence only. They must not be used to infer current readiness when a newer registry or readiness ledger exists.

## Reconciled architecture

- Professional certification architecture currently centers on the governed credential pathways, including Technician I and Technician II.
- Technician I has seven source/package contracts that satisfy the machine package standard. Professional credential release remains blocked by real deployment, review, pilot/practical/calibration, psychometric/standard-setting, privacy/security, and release approvals.
- Technician II has eight public academic packages and a controlled 36-concept visual production registry. Production instructional visuals are raster-only under the current policy; PNG/WebP/JPEG are releasable formats, while SVG candidates are legacy review material only.
- Foundational and specialist credential offerings remain fail-closed until their pathway-specific publication and issuance gates are satisfied.

## Drive reconciliation decision

The historical Drive 420-course master catalog may continue to be used for topic inventory, legacy IDs, source discovery, and comprehensive educational-resource planning. Its older columns such as `Planned`, `Needs evidence map`, or `Not reviewed` must not be copied back into the certification repository as current certification state without checking the canonical repo object first.

The controlled Drive deliverable register remains useful for locating SOP packages, visual masters, review artifacts, and production files. Where Drive and the repository disagree on certification lifecycle/readiness, the repository's current canonical record wins and the Drive record should be annotated or superseded rather than silently treated as current.

## Visual asset reconciliation

- New production instructional images, charts, and infographics must be high-resolution raster assets: PNG, WebP, JPEG/JPG as appropriate.
- SVG instructional graphics are not the production target.
- Existing public SVGs may remain temporarily only where they are the verified learner-facing compatibility baseline and removing them would create a broken course surface.
- Raster replacements must pass factual/copy QA, authority-boundary checks, accessibility requirements, responsive/manual review, registry mapping, and public path verification before the legacy baseline is retired.
- Course 1 already has controlled PNG replacement candidates and deployment/release manifests; those candidates must be promoted by the existing QA gate rather than bypassed.
- Technician II's production registry now explicitly blocks SVG release.

## Current readiness truth

Machine-complete does not mean certification-approved. The project must continue to preserve separate gates for:

- scientific/technical and editorial review;
- assessment review;
- accessibility/manual UX review;
- practical/capstone validation and evaluator calibration;
- controlled learner/item pilot evidence;
- formal standard setting and final decision rules;
- candidate privacy/retention and security approval;
- production issuer/signing/revocation/persistence readiness;
- exact deployment identity and release verification;
- explicit versioned final release approval.

## Immediate controlled work sequence

1. Keep repository/Drive source reconciliation synchronized.
2. Run and repair the readiness/validation matrix from the current integration head.
3. Close remaining machine-fixable content, asset, deployment, and registry defects.
4. Record only genuine version-specific human approvals; never manufacture review evidence.
5. Collect real pilot/practical/calibration evidence and activate assessment items only through the governed lifecycle.
6. Finalize credential governance/security and production persistence.
7. Verify the deployed learner/credential surfaces and then evaluate the explicit production release gate.
