# Certification Completion Matrix

This file is a human-readable projection of the canonical credential architecture. It must not be used to authorize credential issuance.

Snapshot: 2026-09-20. Repository registries/readiness ledgers are authoritative for certification state; Drive registers are controlled supporting archives and production-asset sources. The legacy 420-course catalog is reconciled as a resource/reference library rather than 420 credential-bearing certification courses.

## Inventory Matrix

| Area | Current inventory | Complete | Needs revision | Missing | Integration / QA |
| --- | ---: | --- | --- | --- | --- |
| Courses | 32 courses; 31 draft, 1 published | Course catalog and staging learner graph exist | Draft courses need review, publication state, release packages | Tech I Course 7 and Tech II Course 8 intentionally still lack ordinary finals because they are integrated-practical/capstone courses | Five noncredential public courses now have draft academic finals wired into catalog metadata |
| Lessons | 204 lessons; 18 published, 186 draft | Public/searchable lesson endpoints and owner-approved scientific/editorial content snapshot exist | Seven changed formative items require renewed assessment approval; content changes invalidate their prior object-scoped approval automatically | No current missing lesson files detected by repo validation | Route/data checks and object-scoped approval checks required after each content expansion |
| SOPs / resources | Controlled Drive register tracks 24 SOP targets; repo has 1 resource JSON and SOP-design lesson material | Full SOP topic packages exist in Drive for GROW-042, 050, 060, 070 | SOP packages need repo mapping, claim review, accessibility, release approval | Remaining controlled SOP targets are not all represented as repo resources | Need resource registry expansion and public download mapping |
| Assessments | 94 assessments; 17 canonical performance assessments; 7 published knowledge assessments | Module checkpoints, course finals, Technician I/II practical sets, and both integrated capstones are structurally present | Seven changed formative items, pilot statistics, evaluator calibration, form equivalence, and standard setting remain open | Secure operational credential forms remain private/not implemented in public repo | Integrated capstone courses are validated as performance pathways rather than being forced to use artificial ordinary finals |
| Question banks | 1,417 draft items | Object-scoped approval covers 1,410 unchanged items; deterministic duplicate and public credential-bank boundary checks exist | Seven changed formative items require renewed assessment approval; pilot evidence is not complete | Active operational item pools are missing by design | Changed objects automatically reopen approval without invalidating unchanged approved content |
| Certification logic | 11 credentials; 26 credential-bearing course paths | Eligibility, progress, transcript, test issuance, verification tooling, practical-evidence submission workflow, and all 26 structural course pathways exist | Production issuer identity/signing/revocation persistence and deployed practical-submission validation are not ready | Production deployment and operational credential-form evidence remain missing | `credential:coverage` reports 26/26 structural paths; C7/C8 correctly use practical-plus-capstone completion |
| Downloads / assets | Nineteen draft CSV learner tools, a searchable Academy Downloads view, course visual registries, and controlled asset routes | Download schema, Technician I seven-tool practical/capstone pack, Technician II eight-tool job-aid pack, global registry mapping, safe metadata API, accessible UI states, file routes, and production visibility boundary are deterministic | Templates need instructional/accessibility review before public release | Remaining SOP packages are not yet represented as learner downloads | `downloads:test` and `tech1:downloads:test` verify metadata, practical mapping, files, routes, privacy, responsive rules, traversal rejection, and draft isolation |
| Navigation / data | `registry/curriculum.json`, `/api/catalog`, lesson/module routes, governance summary exist | Staging navigation is usable | Catalog needs continued safe metadata expansion as courses mature | Production-only public catalog remains intentionally limited | Added safe `finalAssessment` catalog projection for visible courses |
| Deployment | Staging usable; production readiness false | Build identity endpoint and deployment evidence tests exist | Exact deployed build/source identity missing for Course 7/Tech II Course 8 evidence | Production DB, MFA/RLS/security review, monitoring, backups remain missing | Keep QA deterministic; no Playwright required for DTFSeeds checks |

## Completion Categories

| Category | Items |
| --- | --- |
| Complete / structurally present | Staging Academy runtime, global registry, catalog/lesson/module endpoints, Course 1 public academic package, 26/26 credential-bearing course paths, Technician I/II practical and capstone objects, test credential issuing/verifying, learner progress/enrollment/transcript APIs |
| Needs revision / human gates | Seven changed formative-item reviews, pilot evidence, practical/capstone calibration, standard setting, accessibility review, visual review, security/privacy review, release approval |
| Missing / machine work | Remaining SOP package ingestion, production issuer identity/signing/revocation persistence, deployed practical-submission validation, and exact deployment identity records |
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
2. Keep Technician I's seven machine-complete source packages, seven canonical performance objects, and seven-tool printable job-aid pack green while closing exact deployment identity, responsive/manual QA, raster asset replacement, and changed-object review evidence.
3. Finish Technician II's 36 primary production visuals as reviewed high-resolution PNG/WebP/JPEG assets; SVG review candidates are legacy-only and cannot be released as production visuals.
4. Complete human scientific/editorial/assessment/accessibility/compliance review records, then collect real pilot/practical/calibration evidence and perform formal standard setting.
5. Finalize credential privacy/security/issuance governance, verify deployed learner and credential surfaces, and only then advance the fail-closed production release gates.

## Important boundary

A visible pathway is not necessarily an available credential. The public catalog should make planned and in-development pathways discoverable while clearly showing that issuance remains unavailable until explicit release approval is recorded.
