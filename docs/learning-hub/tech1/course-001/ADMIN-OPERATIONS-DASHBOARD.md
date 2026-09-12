# Course 1 Admin Operations Dashboard

## Purpose

The Course 1 Admin Operations Dashboard is a role-gated Academy view for operational oversight of the published Course 1 practical. It does not control publication of academic content and does not issue the THC Cultivation Technician I credential.

The Admin tab is hidden by default. The Academy exposes it only after the authenticated session succeeds against the existing `admin:read` diagnostics boundary.

## Dashboard views

The dashboard consumes the privacy-bounded Course 1 practical report and presents:

- total learners in the operational cohort;
- not-evaluated, in-progress, not-passed, passed and voided practical states;
- open remediation/reassessment count;
- unassigned practical count;
- learner/evaluator search;
- practical-status filtering;
- evaluator-assignment filtering;
- follow-up/reassessment filtering;
- evaluator assignment/reassignment controls;
- privacy-bounded CSV export;
- refreshable cohort state.

These are runtime operational views. They do not impose a maximum cohort size, practical count, content count or curriculum ceiling.

## Assignment authority

Assignment changes use the server-side administrator practical-assignment endpoint. The browser supplies only the learner subject and target evaluator subject. The server remains responsible for authorization, persistence and assignment audit events.

Evaluator ownership is stored separately from learner evidence in `practical_evaluation_assignments`.

## Privacy boundary

The admin dashboard intentionally works from the privacy-bounded operational report. It does not request or render:

- private evaluator notes;
- detailed practical evidence references;
- evidence-output notes;
- learner response payloads;
- credential-exam answer keys;
- credential signing or issuance data.

Detailed evaluation evidence remains in the authorized assessor workflow. Public Course 1 academic content remains public independently of this dashboard.

## Export

CSV export uses the existing administrator report endpoint with `format=csv`. The export contains the same privacy-bounded cohort fields as the JSON report and does not add hidden evaluator evidence.

## Accessibility and responsive behavior

The dashboard uses semantic labels and tables, keyboard-focusable horizontal table overflow, 44-pixel minimum action targets, live status regions, compact two-column filters on tablets and single-column controls on small screens. The report table remains horizontally scrollable when its operational columns cannot be compressed safely.

## Quality gate

`scripts/test-course1-admin-dashboard.mjs` is part of the root test chain. It checks:

- hidden-by-default Admin navigation;
- admin authorization boundary;
- Course 1 practical report and assignment endpoints;
- privacy-bounded CSV export;
- absence of private evaluator-note/evidence-detail rendering;
- safe DOM construction without `innerHTML`;
- same-origin authenticated requests;
- responsive/touch/print contracts;
- Node-safe browser initialization guard.

No Playwright dependency is used.
