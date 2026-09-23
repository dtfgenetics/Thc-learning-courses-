# Certification Rendered Accessibility & Learner-UX QA

**Scope:** all 15 canonical Technician certification courses  
**Target:** WCAG 2.2 Level AA plus practical learner usability  
**Current state:** 15/15 course-specific review packets prepared; rendered/manual approval remains open until human evidence is recorded.

## Why this layer exists

Automated accessibility tests, route readback, static HTML/CSS checks, raster integrity checks, and build identity verification are useful defect detectors. They do not substitute for reviewing the deployed learner experience with keyboard input, assistive technology, zoom/reflow, real responsive layouts, assessment interactions, practical/simulation workflows, and downloadable learner tools.

Academic publication may continue under owner approval while this review remains open. Professional credential validation and issuance remain separate.

## Packet inventory

Technician I:

- Courses 1–7: `docs/learning-hub/tech1/course-00N/accessibility/COURSEN-RENDERED-ACCESSIBILITY-UX-REVIEW.md`

Technician II:

- Courses 1–8: `docs/learning-hub/tech2/course-00N/accessibility/COURSEN-RENDERED-ACCESSIBILITY-UX-REVIEW.md`

The invariant is enforced by:

`npm run certification:rendered-qa-packets:test`

## Review order

Use the recorded deployment build/source identity as the version anchor. For each course:

1. review catalog/course entry and course overview;
2. review every dedicated lesson and lesson-navigation state;
3. review raster instructional assets, captions and text alternatives;
4. review tables, comparisons, scenarios, activities and downloads;
5. review formative assessment interactions;
6. review final/readiness surfaces where applicable;
7. review practical/simulation preparation and learner-evidence workflows;
8. review progress, completion, validation-error, empty, loading, retry and unavailable states;
9. retest every corrected issue against the same or explicitly superseding build.

## Minimum environment matrix

Record exact browser, OS/device, viewport, zoom, assistive technology, reviewer and date.

At minimum include:

- current desktop Chromium- or Firefox-class browser with keyboard-only operation;
- at least one desktop screen-reader/browser combination;
- Android or iOS mobile;
- tablet-width layout;
- 200% zoom;
- narrow reflow around 320 CSS px where applicable;
- increased text spacing.

Use additional environments when the supported learner population or product support matrix requires them.

## Evidence rules

A review record must identify:

- canonical course ID;
- exact deployed build/source;
- page/surface and state;
- device/browser/assistive technology;
- WCAG criterion or learner-UX check;
- pass/fail/not-applicable result;
- issue reference and evidence when needed;
- correction commit/build;
- retest result;
- reviewer and review date.

Do not infer or auto-fill human approval from CI.

## Raster-specific checks

Production instructional visuals are raster-first:

- Technician I Course 1: reviewed PNG layer;
- Technician I Courses 2–6: approved WebP layer;
- Technician II: 36/36 approved primary WebPs.

Legacy SVG files are provenance/reference sources only where retained. Rendered QA should evaluate the learner-facing raster asset, its lesson-level text alternative/caption, responsive behavior, contrast, legibility, and instructional equivalence.

## Download/job-aid checks

The current Academy exposes 15 course-owned public academic CSV job aids. Review:

- accessible link names;
- disclosed purpose/file type where useful;
- meaningful headers after import into common spreadsheet software;
- usable reading/order at zoom and with assistive technology;
- clear educational/non-SOP/non-credential boundaries;
- understandable handling of missing or failed downloads.

Eight generic/SOP-oriented CSV tools remain draft/internal-preview and are outside the public academic download surface until separately released.

## Closure rule

A course's rendered accessibility/manual UX gate may be marked complete only after actual human review evidence exists for the deployed surface and unresolved Level A/AA failures are corrected, formally resolved, or explicitly dispositioned through the controlled review process.

A completed rendered review still does not prove:

- practical/capstone validity;
- evaluator reliability;
- secure credential-exam validity;
- formal standard setting;
- privacy/security approval;
- professional credential issuance authorization.
