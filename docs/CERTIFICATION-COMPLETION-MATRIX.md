# Certification Completion Matrix

This file is a human-readable projection of the canonical credential architecture. It must not be used to authorize credential issuance.

Snapshot: 2026-09-21. Repository registries/readiness ledgers are authoritative for certification state; Drive registers are controlled supporting archives and production-asset sources. The legacy 420-course catalog is reconciled as a resource/reference library rather than 420 credential-bearing certification courses.

## Inventory Matrix

| Area | Current inventory | Complete | Needs revision | Missing | Integration / QA |
| --- | ---: | --- | --- | --- | --- |
| Courses | 32 canonical course records; 15 Technician academic packages are publicly available for study (7 Technician I + 8 Technician II); source lifecycle remains fail-closed for credential release | Course catalog, public Technician learner graph, and deployment identity are verified | Draft/source lifecycle records still need versioned human review and release approvals | Tech I Course 7 and Tech II Course 8 intentionally lack ordinary finals because they are integrated-practical/capstone courses | Five noncredential public courses have draft academic finals wired into catalog metadata; public study access does not imply credential issuance |
| Lessons | 204 lessons; 18 published, 186 draft | Public/searchable lesson endpoints and owner-approved scientific/editorial content snapshot exist | Seven changed formative items require renewed assessment approval; content changes invalidate their prior object-scoped approval automatically | No current missing lesson files detected by repo validation | Route/data checks and object-scoped approval checks required after each content expansion |
| SOPs / resources | Controlled Drive register tracks 24 SOP targets; repo has SOP-design curriculum, one reviewed government reference, a four-tool learner pack, and a source-ingestion register | Repository-native learner tools cover authoring, execution, deviation/change control, and training evidence | Drive packages GROW-042, 050, 060, and 070 remain `pending-source`; all tools need instructional/accessibility and release review | Twenty additional controlled targets remain unidentified in the repository | Need controlled source delivery, provenance, claim review, resource/course mapping, accessibility, and release approval |
| Assessments | 94 assessments; 17 canonical performance assessments; 7 published knowledge assessments | Module checkpoints, course finals, Technician I/II practical sets, and both integrated capstones are structurally present | Seven changed formative items, pilot statistics, evaluator calibration, form equivalence, and standard setting remain open | Secure operational credential forms remain private/not implemented in public repo | Integrated capstone courses are validated as performance pathways rather than being forced to use artificial ordinary finals |
| Question banks | 1,417 draft items | Object-scoped approval covers 1,410 unchanged items; deterministic duplicate and public credential-bank boundary checks exist | Seven changed formative items require renewed assessment approval; pilot evidence is not complete | Active operational item pools are missing by design | Changed objects automatically reopen approval without invalidating unchanged approved content |
| Certification logic | 11 credentials; 26 credential-bearing course paths | Eligibility, progress, transcript, test issuance, verification tooling, practical-evidence submission workflow, and all 26 structural course pathways exist | Production issuer identity/signing/revocation persistence and deployed practical-submission validation are not ready | Production deployment and operational credential-form evidence remain missing | `credential:coverage` reports 26/26 structural paths; C7/C8 correctly use practical-plus-capstone completion |
| Downloads / assets | Twenty-three draft CSV learner tools, a searchable Academy Downloads view, course visual registries, controlled asset routes, and 96 public SVG compatibility/review files | Download schema, Technician I/II support packs, SOP learner pack, registry mapping, safe metadata API, UI/file-route boundaries, and raster-only production policy are deterministic | All 96 public instructional SVG files are now explicitly governed as compatibility/review assets and require reviewed high-resolution PNG/WebP/JPEG replacements before SVG retirement | External controlled SOP packages cannot be represented until their source files are available | Raster backlog reporting and regression tests now prevent Course 1-6 / Technician II visual policy from silently drifting back to SVG-as-production |
| Navigation / data | `registry/curriculum.json`, `/api/catalog`, lesson/module routes, governance summary exist | Staging navigation is usable | Catalog needs continued safe metadata expansion as courses mature | Production-only public catalog remains intentionally limited | Added safe `finalAssessment` catalog projection for visible courses |
| Deployment | Public Academy academic deployment is verified for the recorded 15-course Technician snapshot; production certification readiness remains false | Exact build/source identity is recorded through the public build-info contract for Technician I Courses 2-7 and Technician II Courses 1-8, with Course 1 already governed separately | Manual responsive/accessibility approval and deployment-backed production-service validation remain open | Production DB integration, MFA/RLS/security review, monitoring/alerting, backup/restore evidence, signing/revocation infrastructure remain missing | Keep QA deterministic; no Playwright required for DTFSeeds checks |

## Completion Categories

| Category | Items |
| --- | --- |
| Complete / structurally present | Staging Academy runtime, global registry, catalog/lesson/module endpoints, Course 1 public academic package, 26/26 credential-bearing course paths, Technician I/II practical and capstone objects, test credential issuing/verifying, learner progress/enrollment/transcript APIs |
| Needs revision / human gates | Seven changed formative-item reviews, pilot evidence, practical/capstone calibration, standard setting, accessibility review, visual review, security/privacy review, release approval |
| Missing / machine work | Controlled-source ingestion for remaining SOP targets, high-resolution raster asset replacement, production issuer identity/signing/revocation persistence, deployed practical-submission validation, production DB/RLS/MFA integration, backup/restore, and monitoring evidence |
| Integration / QA | Object-scoped approval reporting, integrated-performance path validation, registry rebuild, schema/curriculum validation, credential coverage, web route tests |

| Offering | Type | Public visibility target | Current build state | Issuance state |
| --- | --- | --- | --- | --- |
| THC Safety & Responsible Practice Certificate | Foundational certificate | Visible | In development | Blocked |
| THC Cultivation Foundations Certificate | Foundational certificate | Visible | In development | Blocked |
| THC Cultivation Technician I | Professional credential | Visible | All 7 source/package contracts machine-complete; deployment evidence and human/pilot/standard-setting gates remain | Blocked |
| THC Cultivation Technician II | Professional credential | Visible | All 8 public academic packages present; 36 primary raster production visuals remain in controlled review/production; human/pilot/credential gates remain | Blocked |
| THC Plant Health, IPM & Biosecurity Specialist | Professional credential | Visible | Planned architecture | Blocked |
| THC Environmental, Irrigation & Fertigation Systems Specialist | Professional credential | Visible | Planned architecture | Blocked |
| THC Propagation & Clean Stock Specialist | Professional credential | Visible | Planned architecture | Blocked |
| THC Postharvest Quality Specialist | Professional credential | Visible | Planned architecture | Blocked |
| THC Genetics, Breeding & Preservation Specialist | Professional credential | Visible | Planned architecture | Blocked |
| THC Cultivation Lead & Operations Professional | Professional credential | Visible | Planned architecture | Blocked |
| THC Home Grow Learning Path | Public education course | Visible in staging | Draft course with academic final wired | Not a credential |
| THC Outdoor and Greenhouse Cultivation | Public education course | Visible in staging | Draft course with academic final wired | Not a credential |
| THC Outdoor Resilience and Risk Management | Public education course | Visible in staging | Draft course with academic final wired | Not a credential |
| THC Advanced Root Zone, Hydroponics and Soil Biology | Public education course | Visible in staging | Draft course with academic final wired | Not a credential |
| THC Safety, Compliance and Responsible Practice | Public education course | Visible in staging | Draft course with academic final wired | Not a credential |

## Current completion focus

1. Reconcile the controlled repository, Drive registers, and the legacy 420-course catalog so repository registries remain the certification source of truth.
2. Keep Technician I's seven source/package contracts, canonical performance objects, and printable job-aid pack green while closing responsive/manual QA, raster asset replacement, changed-object review evidence, practical validation, pilot and standard-setting gates.
3. Finish Technician II's 36 primary production visuals as reviewed high-resolution PNG/WebP/JPEG assets; SVG review candidates are legacy-only and cannot be released as production visuals.
4. Complete human scientific/editorial/assessment/accessibility/compliance review records, then collect real pilot/practical/calibration evidence and perform formal standard setting.
5. Finalize credential privacy/security/issuance governance, verify deployed learner and credential surfaces, and only then advance the fail-closed production release gates.

## Important boundary

A visible pathway is not necessarily an available credential. The public catalog should make planned and in-development pathways discoverable while clearly showing that issuance remains unavailable until explicit release approval is recorded.
