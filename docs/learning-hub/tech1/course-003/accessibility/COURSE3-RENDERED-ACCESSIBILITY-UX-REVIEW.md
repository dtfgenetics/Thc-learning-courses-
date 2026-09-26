# Course 3 Rendered Accessibility & Learner UX Review

**Course:** `COURSE-LH-TECH1-003 — Environmental, Light & Sensor Fundamentals`  
**Status:** prepared for manual review; **not approved**  
**Target:** WCAG 2.2 AA for the rendered learner surface where applicable, plus practical learner usability on phone, tablet and desktop.

## Review boundary

This packet defines what must be inspected after the current Course 3 content and seven governed assets are rendered in the learner runtime. Source-file presence is not evidence that the rendered experience is accessible. Do not mark this review complete until a human reviewer inspects the actual rendered surface and records findings against the exact deployed/source version.

## Pages and states to inspect

At minimum inspect:

- Course 3 entry/catalog state;
- each of the four dedicated Course 3 lessons;
- expanded rich-content blocks: comparison, steps, tables, document fields, scenarios and resources;
- all five embedded Course 3 WebP learning boards;
- both downloadable Course 3 SVG practice worksheets;
- lesson practice flow;
- module assessment flow;
- course-final access/transition surface where exposed by the product;
- validation/error/empty states that a learner can encounter;
- keyboard-only and screen-reader reading order.

## Responsive viewport set

Record actual viewport/browser/device used. Include at least:

| Class | Suggested test width | Review focus |
|---|---:|---|
| Small phone | ~320–375 CSS px | text wrapping, table/resource access, controls, image scaling, no horizontal content loss |
| Large phone | ~390–430 CSS px | lesson navigation, cards, scenarios, assessment choices |
| Tablet | ~768–1024 CSS px | content width, side-by-side blocks, grid/table behavior |
| Desktop | ≥1280 CSS px | line length, hierarchy, asset legibility, excessive empty space |

Exact widths may vary; record what was actually tested.

## Keyboard and focus review

Verify:

- every interactive control is reachable and operable by keyboard;
- focus order follows the visual/semantic reading order;
- visible focus is not obscured or removed;
- expanding/collapsing content returns/preserves focus predictably;
- assessment choices and submission controls do not require pointer-only actions;
- downloadable worksheet/resource links are keyboard operable and clearly labeled;
- focus does not become trapped in panels or overlays.

### Reviewer record

- keyboard reviewer: **pending**
- browser/OS: **pending**
- findings: **pending**
- approval: **pending**

## Heading, landmark and reading-order review

Check the rendered semantic structure rather than visual font size alone:

- one clear page/lesson heading;
- headings follow a logical hierarchy;
- navigation, main content and supporting areas expose appropriate landmarks;
- lesson blocks are read in the intended instructional order;
- visual side-by-side comparison content remains understandable in DOM/screen-reader order;
- status labels such as `draft`, public academic state or assessment state are not conveyed by color alone.

## Course 3 visual accessibility review

The visual registry requires a title, description and learner text alternative for governed assets. Runtime QA must confirm those source controls become usable rendered alternatives.

### `VIS-LH-TECH1-003-001` — environmental measurement context

Confirm the alternative communicates:
- temperature and RH are paired before VPD interpretation;
- target, measured value and alarm are distinct roles;
- sensor/location/time/unit context is preserved.

### `VIS-LH-TECH1-003-002` — PPFD grid measurement

Confirm the alternative communicates:
- there are multiple canopy positions, not one representative center point;
- measurement plane/orientation/grid consistency matters;
- high/low spatial variation remains visible in the text alternative.

### `VIS-LH-TECH1-003-003` — sensor representativeness triage

Confirm the alternative communicates:
- sensor placement differs across crop/wall/outlet contexts;
- the workflow checks location, comparison, verification status and trend/context before escalation.

### `VIS-LH-TECH1-003-004` — alarm/trend/handoff workflow

Confirm the alternative communicates:
- an average may hide a repeated event;
- alarm/event evidence flows to verification, escalation, unresolved condition and next action rather than automatic root-cause diagnosis.

### Downloadable practice sheets

For `VIS-LH-TECH1-003-005` and `006`, verify:
- worksheet labels remain readable at common zoom levels;
- print/download does not clip fields;
- the worksheet has a usable text/HTML alternative or equivalent accessible practice route when SVG-only interaction would block access;
- required information is not communicated by color alone.

## Text, zoom and reflow review

Test browser zoom/reflow through at least 200% and, where practical for the rendered app, higher zoom/reflow behavior consistent with WCAG 2.2 AA expectations. Record any component that clips, overlaps, hides controls, forces two-dimensional scrolling unnecessarily or makes assessment content unusable.

Tables and PPFD grids may require deliberate responsive handling; preserve data relationships rather than simply shrinking text below readable size.

## Contrast and non-color cues

Manually inspect:

- body and secondary text;
- links and focus indicators;
- assessment states;
- callouts/status badges;
- chart/grid labels inside SVG assets;
- disabled/error/success states.

Where color distinguishes target/measurement/alarm, sensor status or high/low PPFD, verify labels, symbols, patterns or text also communicate the difference.

## Forms and assessments

Verify:

- each response control has a programmatic name/label;
- errors identify what needs correction and are announced/locatable;
- answer feedback is not color-only;
- choices remain readable when text wraps to multiple lines;
- shuffled choices preserve correct accessible labels and order;
- timed behavior, if later introduced, is not added without accessibility/accommodation review.

## Learner UX review

In addition to compliance, confirm the learner can answer these navigation questions without guessing:

- Which course and lesson am I in?
- What am I expected to learn/do?
- Where is the embedded visual relevant to the current concept?
- Where do I open/download the practice worksheet?
- How do I return from the worksheet/resource to the lesson?
- What practice or assessment comes next?
- When I miss an objective, where is corrective practice located?

Flag long uninterrupted content blocks that would be clearer behind progressive disclosure **only if** hiding content does not harm discoverability, keyboard access, deep links or screen-reader flow.

## Findings log

| ID | Surface | Viewport / AT | Severity | Finding | Required fix | Retest | Status |
|---|---|---|---|---|---|---|---|
| _pending_ | | | | | | | |

Suggested severity meaning:
- **Blocker:** prevents task completion or creates a serious accessibility barrier;
- **High:** major loss of meaning/operation for a supported learner path;
- **Medium:** meaningful friction or partial accessibility failure;
- **Low:** polish/readability improvement that does not block the task.

## Approval gate

Do not change this packet to approved until:

- [ ] rendered phone/tablet/desktop review completed;
- [ ] keyboard review completed;
- [ ] screen-reader/semantic review completed;
- [ ] governed visual alternatives reviewed;
- [ ] zoom/reflow and contrast reviewed;
- [ ] assessment interaction reviewed;
- [ ] blocker/high findings resolved and retested or formally dispositioned;
- [ ] reviewer, date, source/deployment version and final decision recorded.

**Reviewer:** pending  
**Date:** pending  
**Reviewed commit/release:** pending  
**Decision:** pending
