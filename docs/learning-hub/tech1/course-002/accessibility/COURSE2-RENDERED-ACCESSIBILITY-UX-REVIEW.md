# Course 2 Rendered Accessibility & Learner UX Review

**Course:** `COURSE-LH-TECH1-002 — Plant Observation, Growth Stages & Crop Records`  
**Target:** WCAG 2.2 Level AA plus project learner-UX requirements  
**State:** review packet prepared; rendered human review not yet approved  
**Date:** 2026-09-15

## Critical rule

The existence of this packet does **not** mean accessibility review has passed. Approval requires a reviewer to test the rendered learner surface and record evidence/disposition against the current deployed build.

## Surfaces in scope

- course landing and lesson navigation;
- four dedicated applied lessons;
- embedded Course 2 visuals;
- three downloadable practice worksheets;
- scenarios, tables, callouts and resource links;
- formative assessment interaction;
- final academic assessment interaction;
- progress/completion feedback where enabled;
- mobile, tablet and desktop layouts.

## A. Structure and navigation

- [ ] Heading levels create a logical hierarchy without skipped/visual-only structure.
- [ ] Landmark regions and page titles identify the current course/lesson.
- [ ] Keyboard users can reach all interactive controls in a predictable order.
- [ ] Visible focus is never clipped or hidden.
- [ ] Skip/navigation mechanisms work where provided.
- [ ] Lesson progress/navigation does not rely only on color or position.

## B. Text and readability

- [ ] Body copy remains readable at 200% zoom.
- [ ] Reflow at narrow viewport widths does not require two-dimensional scrolling for ordinary text.
- [ ] Tables remain understandable through responsive treatment or an equivalent accessible presentation.
- [ ] Link text describes purpose without relying on surrounding visual context alone.
- [ ] Vocabulary and instructional language remain understandable without diluting required technical meaning.

## C. Course 2 visuals

Audit every asset in `visuals/COURSE2-ASSET-REGISTRY.json`.

For each produced visual:

- [ ] the public learner path resolves;
- [ ] title/caption match the instructional claim;
- [ ] learner text alternative communicates the teaching purpose rather than merely file appearance;
- [ ] text embedded in the graphic is legible at responsive sizes;
- [ ] contrast is sufficient for instructional text/meaningful marks;
- [ ] meaning is not conveyed by color alone;
- [ ] complex diagrams have an equivalent text explanation in the lesson;
- [ ] factual/copy review has not been invalidated by later edits.

Special checks:

- morphology diagrams must distinguish structures without requiring color recognition alone;
- spatial-pattern graphics must remain interpretable when zoomed/reflowed;
- photo-evidence guidance must not depend on tiny visual examples;
- worksheet labels/fields must remain usable when printed or viewed digitally.

## D. Downloadable learner practice

Check:

- `/assets/course2/crop-walk-room-map-practice.webp`
- `/assets/course2/observation-handoff-practice.webp`
- `/assets/course2/photo-evidence-audit-practice.webp`

For each:

- [ ] file opens through the learner-facing route;
- [ ] information is not lost when printed in grayscale;
- [ ] instructions and labels remain legible;
- [ ] an equivalent accessible activity is available if direct interaction with the visual worksheet is not usable with assistive technology;
- [ ] downloadable status is communicated clearly.

## E. Scenarios and assessment interactions

- [ ] All response options are keyboard operable.
- [ ] Programmatic labels/names match visible prompts.
- [ ] Selection state is exposed to assistive technology.
- [ ] Validation/errors identify the problem in text.
- [ ] Feedback is announced/readable without requiring a pointer device.
- [ ] Randomization does not create focus loss or inaccessible reordering.
- [ ] Extended-time accommodations do not break attempt state.
- [ ] Alternative accessible presentation can be provided without changing the construct being measured.

For image-dependent items, document whether visual interpretation is itself the competency. Where it is not, provide equivalent information. Where it is, document an accommodation path that preserves the intended decision skill as far as feasible.

## F. Responsive learner UX

Test at representative mobile, tablet and desktop widths.

- [ ] Course/lesson navigation remains discoverable.
- [ ] No important action is pushed off-screen or hidden behind overlapping UI.
- [ ] Tables/cards/images do not overflow their container.
- [ ] Tap/pointer targets meet the project WCAG 2.2 AA target-size policy unless a documented exception applies.
- [ ] Sticky headers/footers do not obscure focused content.
- [ ] Landscape/portrait changes do not lose state.

## G. Manual screen-reader review

At minimum, test one current desktop screen reader/browser combination and one current mobile screen reader/browser combination.

Record:

- reviewer;
- date;
- browser/version;
- assistive technology/version;
- route/build/SHA;
- issue;
- severity;
- affected objective/task;
- disposition/retest evidence.

## H. Approval record

| Field | Value |
|---|---|
| Rendered build/SHA | **OPEN** |
| Reviewer | **OPEN** |
| Review date | **OPEN** |
| Mobile review | **OPEN** |
| Tablet review | **OPEN** |
| Desktop review | **OPEN** |
| Keyboard review | **OPEN** |
| Screen-reader review | **OPEN** |
| Visual/worksheet review | **OPEN** |
| Assessment interaction review | **OPEN** |
| Final disposition | **NOT APPROVED — REVIEW PENDING** |

## Release boundary

Machine tests can detect some markup/path regressions, but they cannot close this packet. Course 2 may remain published for academic use, but rendered accessibility approval and professional credential release remain fail-closed until actual review evidence is recorded and approved.
