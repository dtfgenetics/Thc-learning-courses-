# Course 1 Admin Operations Dashboard

## Purpose

The Course 1 Admin Operations Dashboard is a role-gated Academy view for operational oversight of the published Course 1 academic-completion and practical workflows. It does not control publication of academic content and does not issue the THC Cultivation Technician I credential.

The Admin tab is hidden by default. The Academy exposes it only after the authenticated session succeeds against the existing `admin:read` diagnostics boundary.

## Dashboard views

The dashboard consumes the privacy-bounded Course 1 practical report, enriched with minimal academic-enrollment transition metadata, and presents:

- total learners in the operational cohort;
- current academic-complete enrollment count;
- learners whose academic requirements have ever been reopened;
- total audited academic completion/reopen transitions represented in the current report;
- not-evaluated, in-progress, not-passed, passed and voided practical states;
- open remediation/reassessment count;
- unassigned practical count;
- learner/evaluator search;
- academic-status filtering for currently complete, requirements open, withdrawn, any transition history, or ever reopened;
- practical-status filtering;
- evaluator-assignment filtering;
- follow-up/reassessment filtering;
- evaluator assignment/reassignment controls;
- privacy-bounded CSV export for the existing practical report fields;
- refreshable cohort state.

The academic-history column shows only transition count, reopen count and the latest academic transition/time. It does not expose the full learner audit event payload in the administrator table.

These are runtime operational views. They do not impose a maximum cohort size, practical count, content count or curriculum ceiling.

## Academic completion operations

The dashboard treats academic enrollment state as separate from professional credential status.

Current enrollment state comes from the authoritative Course 1 enrollment row. Completion/reopen history comes from the immutable academic transition events produced by the Course 1 enrollment-completion synchronizer.

Operational filters therefore answer distinct questions:

- **Currently complete** — the current Course 1 enrollment is `completed`;
- **Requirements open** — the current Course 1 enrollment is `active`;
- **Has completion history** — at least one automatic academic completion or reopen transition exists;
- **Ever reopened** — at least one audited `course-enrollment-academic-reopened` transition exists;
- **Withdrawn** — the administrative enrollment state is withdrawn and is not changed by academic automation.

A learner may appear as currently complete and also ever reopened. That represents a valid historical sequence such as Completed → Reopened → Completed.

## Assignment authority

Assignment changes use the server-side administrator practical-assignment endpoint. The browser supplies only the learner subject and target evaluator subject. The server remains responsible for authorization, persistence and assignment audit events.

Evaluator ownership is stored separately from learner evidence in `practical_evaluation_assignments`.

## Privacy boundary

The admin dashboard intentionally works from the privacy-bounded operational report. It does not request or render:

- private evaluator notes;
- detailed practical evidence references;
- evidence-output notes;
- learner response payloads;
- full academic audit-event payloads;
- credential-exam answer keys;
- credential signing or issuance data.

The academic report enrichment is limited to current enrollment status, transition count, reopen count and latest transition type/time. Detailed learner academic history remains in the authenticated learner Course Record and underlying controlled audit system.

Detailed evaluation evidence remains in the authorized assessor workflow. Public Course 1 academic content remains public independently of this dashboard.

## Export

CSV export uses the existing administrator report endpoint with `format=csv`. The existing CSV remains privacy-bounded and does not add hidden evaluator evidence. Academic metrics and filters are calculated from the JSON operational report rows in the role-gated dashboard; they do not require a second admin endpoint.

## Accessibility and responsive behavior

The dashboard uses semantic labels and tables, keyboard-focusable horizontal table overflow, 44-pixel minimum action targets, live status regions, compact two-column filters on tablets and single-column controls on small screens. The report table remains horizontally scrollable when its operational columns cannot be compressed safely.

## Quality gate

`scripts/test-course1-admin-dashboard.mjs` is part of the root test chain. It checks:

- hidden-by-default Admin navigation;
- admin authorization boundary;
- Course 1 practical report and assignment endpoints;
- academic completion/reopen metrics and filters;
- transition/reopen metadata rendering;
- privacy-bounded CSV export;
- absence of private evaluator-note/evidence-detail rendering;
- safe DOM construction without `innerHTML`;
- same-origin authenticated requests;
- responsive/touch/print contracts;
- Node-safe browser initialization guard.

The Course 1 enrollment-completion runtime and PostgreSQL persistence tests separately verify the audit-backed transition metadata that feeds the dashboard.

No Playwright dependency is used.
