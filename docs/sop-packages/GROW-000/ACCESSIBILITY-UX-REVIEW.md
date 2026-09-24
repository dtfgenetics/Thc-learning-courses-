# GROW-000 Rendered Accessibility & Learner UX Review

**Package:** `GROW-000 — Manual overview, purpose, scope, document control`  
**Version:** `0.1.0`  
**Target:** WCAG 2.2 Level AA plus project learner-document usability requirements  
**State:** automated preflight prepared; rendered/manual review not yet approved

## Critical rule

This packet does **not** mean accessibility has passed. Manual review must be performed against the rendered learner-facing SOP, guide, handoff and records experience for the exact version under review.

## Surfaces in scope

- scientific SOP: `docs/sop-packages/GROW-000/SCIENTIFIC-SOP-DRAFT.md`
- learner guide: `docs/sop-packages/GROW-000/LEARNER-GUIDE-DRAFT.md`
- implementation handoff: `docs/sop-packages/GROW-000/IMPLEMENTATION-HANDOFF.md`
- records template: `apps/web/public/downloads/sop-packages/grow-000-records-template.csv`
- any future HTML/PDF/print projection generated from these controlled sources

## A. Structure and navigation

- [ ] One clear primary heading identifies the document.
- [ ] Heading levels form a logical hierarchy.
- [ ] Ordered procedure steps remain understandable without visual styling.
- [ ] Links, controls and downloads have descriptive names.
- [ ] Web renderings provide predictable reading and focus order.

## B. Text, zoom and reflow

- [ ] Text remains readable at 200% and 400% zoom.
- [ ] Ordinary text reflows without two-dimensional scrolling.
- [ ] Long IDs/references do not break mobile layout.
- [ ] Draft/blocked/hold/quarantine/approved states do not rely on color alone.

## C. Procedure usability

- [ ] Actions, evidence boundaries, stop/escalate rules and release limitations are distinguishable.
- [ ] Ordered steps retain their reading order for assistive technology.
- [ ] Warnings and boundaries remain understandable without icons or color.
- [ ] Tables/matrices have explicit headers and a usable linear reading order.

## D. Records template

- [ ] Column headers are unique and descriptive.
- [ ] Required fields are identified without color alone.
- [ ] Date/time, identity, status and free-text expectations are explained.
- [ ] Spreadsheet/form implementation supports keyboard navigation and accessible names.
- [ ] An equivalent accessible HTML/form/document activity is available if the CSV is not usable with assistive technology.
- [ ] Grayscale/print output preserves field meaning.

## E. Keyboard and assistive technology

- [ ] Every interactive control is keyboard operable.
- [ ] Focus order follows reading/procedure order.
- [ ] Focus visibility is not obscured.
- [ ] One current desktop screen-reader/browser combination is tested.
- [ ] One current mobile screen-reader/browser combination is tested.
- [ ] Status, validation and error messages are announced in text.

## F. Responsive and print review

- [ ] Mobile, tablet and desktop layouts preserve all content and controls.
- [ ] Sticky elements do not cover focused content.
- [ ] Procedure numbering/page breaks remain understandable in print/PDF.
- [ ] Critical instructions are not clipped at normal print margins.
- [ ] Records templates remain legible when printed or exported.

## G. Review evidence

Record reviewer, date, rendered route/build/SHA, browser/version, assistive technology/version, viewport/device, issue, severity, affected task, remediation and retest evidence.

## H. Approval record

| Field | Value |
|---|---|
| Exact package version | `0.1.0` |
| Rendered build/SHA | **OPEN** |
| Reviewer | **OPEN** |
| Review date | **OPEN** |
| Keyboard review | **OPEN** |
| Desktop screen reader | **OPEN** |
| Mobile screen reader | **OPEN** |
| 200%/400% zoom and reflow | **OPEN** |
| Mobile/tablet/desktop review | **OPEN** |
| Records-template review | **OPEN** |
| Print/PDF review | **OPEN** |
| Final disposition | **NOT APPROVED — MANUAL REVIEW PENDING** |

## Release boundary

Automated preflight can detect source-structure problems but cannot establish rendered WCAG 2.2 AA conformance. Operational release remains blocked until manual review evidence is completed and approved for the exact package version.
