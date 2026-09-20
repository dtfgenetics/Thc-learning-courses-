# Certification Completion Matrix

This file is a human-readable projection of the canonical credential architecture. It must not be used to authorize credential issuance.

Snapshot: 2026-09-20, from repository validation/status tooling plus the controlled Drive deliverable register.

## Inventory Matrix

| Area | Current inventory | Complete | Needs revision | Missing | Integration / QA |
| --- | ---: | --- | --- | --- | --- |
| Courses | 32 courses; 31 draft, 1 published | Course catalog and staging learner graph exist | Draft courses need review, publication state, release packages | Tech I Course 7 and Tech II Course 8 intentionally still lack ordinary finals because they are integrated-practical/capstone courses | Five noncredential public courses now have draft academic finals wired into catalog metadata |
| Lessons | 204 lessons; 18 published, 186 draft | Public/searchable lesson endpoints exist in staging | Scientific/editorial review remains open for draft lessons | No current missing lesson files detected by repo validation | Route/data checks required after each content expansion |
| SOPs / resources | Controlled Drive register tracks 24 SOP targets; repo has 1 resource JSON and SOP-design lesson material | Full SOP topic packages exist in Drive for GROW-042, 050, 060, 070 | SOP packages need repo mapping, claim review, accessibility, release approval | Remaining controlled SOP targets are not all represented as repo resources | Need resource registry expansion and public download mapping |
| Assessments | 94 assessments after this update; 7 published, 87 draft | Module checkpoints and many course finals exist | Review, pilot statistics, and standard setting remain open | Secure operational credential forms remain private/not implemented in public repo | Public catalog now exposes safe final-assessment metadata without item IDs |
| Question banks | 1,417 draft items | Deterministic schemas and public credential-bank boundary checks exist | Human assessment review and pilot evidence not complete | Active/approved operational item pools are missing by design | New noncredential finals preserve dedicated summative item banks and remain noncredential |
| Certification logic | 11 credentials; Tech I/II pathways modeled | Eligibility, progress, transcript, test issuance, verification tooling, and the private practical-evidence submission workflow exist in the repository | Production issuer identity/signing/revocation persistence and deployed practical-submission validation are not ready | No additional repository workflow is missing for learner practical-evidence references; production deployment evidence remains missing | Credential coverage reports complete 24/26 credential-bearing paths; C7/C8 are intentionally draft-gated |
| Downloads / assets | Four draft CSV learner logs, a searchable Academy Downloads view, course visual registries, and controlled asset routes | Download schema, global registry mapping, safe metadata API, accessible UI states, file routes, and production visibility boundary are deterministic | Templates need instructional/accessibility review before public release | SOP packages and additional printable packs are not yet represented | `npm run downloads:test` verifies metadata, UI contract, files, routes, responsive rules, traversal rejection, and draft isolation |
| Navigation / data | `registry/curriculum.json`, `/api/catalog`, lesson/module routes, governance summary exist | Staging navigation is usable | Catalog needs continued safe metadata expansion as courses mature | Production-only public catalog remains intentionally limited | Added safe `finalAssessment` catalog projection for visible courses |
| Deployment | Staging usable; production readiness false | Build identity endpoint and deployment evidence tests exist | Exact deployed build/source identity missing for Course 7/Tech II Course 8 evidence | Production DB, MFA/RLS/security review, monitoring, backups remain missing | Keep QA deterministic; no Playwright required for DTFSeeds checks |

## Completion Categories

| Category | Items |
| --- | --- |
| Complete / structurally present | Staging Academy runtime, global registry, catalog/lesson/module endpoints, Course 1 public academic package, credential pathway models, test credential issuing/verifying, learner progress/enrollment/transcript APIs |
| Needs revision / human gates | Scientific review, editorial review, assessment review, pilot evidence, standard setting, accessibility review, visual review, release approval |
| Missing / machine work | Remaining SOP package ingestion, production issuer identity/signing/revocation persistence, deployed practical-submission validation, and exact deployment identity records |
| Integration / QA | Course-final catalog projection, noncredential course-final guard, registry rebuild, schema/curriculum validation, credential coverage, web route tests |

| Offering | Type | Public visibility target | Current build state | Issuance state |
| --- | --- | --- | --- | --- |
| THC Safety & Responsible Practice Certificate | Foundational certificate | Visible | In development | Blocked |
| THC Cultivation Foundations Certificate | Foundational certificate | Visible | In development | Blocked |
| THC Cultivation Technician I | Professional credential | Visible | Active build; Course 1 public academic package, Courses 2–7 incomplete | Blocked |
| THC Cultivation Technician II | Professional credential | Visible | Active draft build | Blocked |
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

1. Finish Course 1 as the gold-standard course package.
2. Convert Course 1 quality/packaging rules into reusable generic validation.
3. Bring Technician I Courses 2–7 to that same course-package standard.
4. Complete Technician I credential-level practicals, capstone, secure assessment, validation, standard setting, policy and issuance work.
5. Use Technician I as the reusable credential-production pattern for the remaining programs.

## Important boundary

A visible pathway is not necessarily an available credential. The public catalog should make planned and in-development pathways discoverable while clearly showing that issuance remains unavailable until explicit release approval is recorded.
