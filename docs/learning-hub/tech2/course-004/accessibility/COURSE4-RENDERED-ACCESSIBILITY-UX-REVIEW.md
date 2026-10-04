# Course 4 Rendered Accessibility & Learner UX Review

**Course:** `COURSE-LH-TECH2-004 — Plant Health, IPM & Biosecurity Troubleshooting`  
**Target:** WCAG 2.2 Level AA plus practical learner usability on the deployed academic surface  
**State:** review packet prepared; rendered/manual approval open

## Evidence boundary

This packet prepares a real human review. Passing automated tests, repository checks, route readback, or asset validation does **not** equal rendered accessibility approval. Record findings against an exact deployed build/source identity and do not mark approval complete without reviewer evidence.

## Required surfaces

Review every learner-facing surface used by this course:

- course/catalog entry and course overview;
- all dedicated lesson pages and lesson navigation;
- embedded instructional raster images, captions and text alternatives;
- tables, comparisons, callouts, scenarios and step sequences;
- lesson practice and formative interactions;
- course final or readiness-check surface where applicable;
- practical/simulation preparation and learner evidence instructions;
- published learner download/job-aid links;
- completion/progress/status messaging shown to learners;
- error, validation, empty, loading, retry and unavailable states that can occur in normal use.

## Device and viewport matrix

Record browser, operating system, viewport/device, zoom level, assistive technology where used, reviewer and date for each run.

Minimum review set:

| Context | Minimum check |
| --- | --- |
| Mobile | narrow portrait layout, touch targets, text reflow, navigation, tables, images and downloads |
| Tablet | portrait and/or landscape reflow, controls, reading order and assessment usability |
| Desktop | full navigation, long-form lesson reading, assessment/practical flows and downloads |
| 200% zoom | no loss of content or functionality; no required two-dimensional scrolling except where intrinsically necessary |
| Text spacing | learner content remains readable and operable when text spacing is increased |

## Keyboard review

Verify:

- all interactive controls are reachable without a pointing device;
- focus order follows the visual/logical task order;
- focus is visible and is not obscured by sticky or fixed UI;
- menus, accordions, dialogs and assessment controls can be opened, used and dismissed by keyboard;
- no keyboard trap exists;
- download links and next/previous lesson controls have understandable accessible names;
- focus returns to a sensible location after errors, submissions and modal/dialog actions.

## Screen-reader and semantic review

Verify with at least one supported screen reader/browser combination:

- one meaningful page title and logical heading hierarchy;
- landmarks and navigation are understandable;
- current lesson/course position is conveyed programmatically;
- lists, tables and form groups are announced with useful structure;
- validation/error messages are associated with the affected control;
- status changes that matter are announced without relying only on visual color/state;
- image alternatives communicate the instructional purpose without duplicating excessive surrounding prose;
- decorative imagery is not announced as instructional content.

## Visual, color and reflow review

Check:

- text and essential UI contrast against the rendered background;
- non-text controls and focus indicators remain perceivable;
- meaning is not conveyed by color alone;
- raster instructional assets remain legible at supported widths and at zoom;
- labels/callouts inside images have adequate size/contrast or equivalent text nearby;
- responsive reflow does not clip tables, equations, captions, assessment choices or action controls;
- horizontal scrolling is limited to content that genuinely requires it.

## Forms, practice and assessment usability

Verify:

- every input has a programmatic label;
- required state and validation instructions are conveyed accessibly;
- answer choices and selected state are understandable without color alone;
- autosave/save/submit status is clear;
- errors preserve learner-entered work where technically possible;
- rationale/remediation feedback is reachable and logically ordered;
- attempt, threshold and academic/professional credential boundaries are understandable;
- timing or retry controls, when configured, do not create inaccessible dead ends.

## Practical, simulation and learner-evidence review

For practical or integrated activities, verify:

- preparation steps and authority/safety boundaries appear before action requirements;
- evidence-output requirements are readable and distinguishable;
- stop/hold/escalate conditions are not conveyed solely by color/icon;
- scenario injects or changing conditions are announced and remain keyboard/screen-reader reachable;
- learner-facing feedback does not expose private evaluator notes or restricted evidence;
- equivalent reassessment instructions remain understandable.

## Download/job-aid review

For every published learner resource mapped to this course:

- link name describes the file purpose;
- file type is disclosed when useful;
- CSV/table headers are meaningful and usable with assistive technology after import into common spreadsheet software;
- the learner is told that the job aid is educational and does not replace a facility SOP, regulated record or credential scoring instrument;
- broken/missing download states are handled clearly.

## Issue log

| ID | Surface | Viewport / AT | Finding | WCAG / usability reference | Severity | Fix owner | Fix commit/build | Retest result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | — | — |

## Approval record

Do not fill approval from machine evidence.

- Reviewer:
- Review date:
- Exact deployed build/source:
- Browsers/devices/assistive technology:
- Open issue IDs:
- Approved for rendered academic accessibility/UX use: **OPEN**
- Notes:

## Professional credential boundary

A completed rendered accessibility review can support course quality and accessibility evidence. It does not by itself validate the professional credential, practical/capstone scoring, assessor reliability, secure operational exams, standard setting, privacy/security controls or credential issuance.
