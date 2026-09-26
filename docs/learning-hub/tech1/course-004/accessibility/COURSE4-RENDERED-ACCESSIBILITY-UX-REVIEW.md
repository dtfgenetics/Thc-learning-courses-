# Course 4 Rendered Accessibility & Learner UX Review

**Course:** `COURSE-LH-TECH1-004 — Water, Root Zone, Nutrition & Irrigation Fundamentals`  
**Status:** prepared for manual review; **not approved**  
**Target:** WCAG 2.2 AA for the rendered learner surface where applicable, plus usable phone/tablet/desktop delivery.

## Scope

Review the actual rendered learner experience for all four lessons, rich content blocks, eight governed WebP assets, both downloadable worksheets, practice/assessment flows, errors/status states and navigation. Source-file existence is not accessibility evidence.

Automated source and route checks support this review, but they do not constitute rendered accessibility or learner-UX approval.

## Required viewport review

Test and record at least:
- small phone (~320–375 CSS px);
- large phone (~390–430 CSS px);
- tablet (~768–1024 CSS px);
- desktop (≥1280 CSS px).

Check for clipping, unreadable labels, forced two-dimensional scrolling, broken tables/forms, missing controls, excessive line length and loss of instructional relationships.

## Keyboard/focus review

Verify all lesson controls, progressive-disclosure panels, links, worksheet downloads and assessment interactions are reachable/operable by keyboard, with visible focus and logical focus order. No control may rely on pointer-only operation.

Reviewer/browser/OS/findings: **pending**

## Semantic and screen-reader review

Verify:
- logical heading hierarchy and landmarks;
- visual order matches semantic reading order;
- tables expose headers/relationships;
- form/assessment controls have programmatic labels;
- errors/feedback are not color-only;
- status and target/actual/deviation distinctions are conveyed in text, not color alone.

## Governed visual review

### Sample pH/EC context
Alternative content must communicate sample identity → meter readiness → measurement/context → verification/escalation, including the boundary that a value is evidence rather than a nutrient-specific diagnosis.

### Root-zone dryback trend
Alternative content must convey repeated saturation/drainage/dryback behavior and that one point or elapsed interval is insufficient.

### Nutrition-context differential
Alternative content must preserve symptom pattern, stage, pH/EC method, root-zone, irrigation and environment before bounded interpretation.

### Irrigation work-order/delivery visual
Alternative content must make clear that controller/event completion differs from representative verified crop delivery.

### Irrigation fault/handoff workflow
Alternative content must preserve observed fault, verification, permitted action, unresolved condition, escalation and next step.

### Downloadable worksheets
For assets `006` and `007`, verify labels/fields remain readable when zoomed/printed and provide an accessible text/HTML-equivalent practice route when SVG-only access would block a learner.

## Zoom, reflow, contrast and non-color cues

Review browser zoom/reflow through at least 200%, and higher where practical. Inspect body text, controls, links, focus indicators, SVG labels, tables, status badges, error/success states and target/actual/deviation cues for adequate contrast and non-color meaning.

## Course-specific UX checks

A learner should be able to determine without guessing:
- which sample/work order is being discussed;
- what is a supplied target versus an actual measurement;
- where the relevant worksheet/visual is located;
- how to document units/method/context;
- what constitutes representative delivery verification;
- where operator authority stops;
- what remains unresolved and must be handed off;
- what practice/remediation follows a missed objective.

## Findings log

| ID | Surface | Viewport / AT | Severity | Finding | Required fix | Retest | Status |
|---|---|---|---|---|---|---|---|
| _pending_ | | | | | | | |

Severity: Blocker / High / Medium / Low.

## Approval gate

- [ ] responsive phone/tablet/desktop review completed
- [ ] keyboard/focus review completed
- [ ] screen-reader/semantic review completed
- [ ] visual alternatives reviewed
- [ ] zoom/reflow/contrast reviewed
- [ ] assessment interaction reviewed
- [ ] worksheets have an accessible usable route
- [ ] blocker/high findings resolved/retested or formally dispositioned
- [ ] reviewer, date and exact source/deployment version recorded

**Reviewer:** pending  
**Reviewed commit/release:** pending  
**Decision:** pending
