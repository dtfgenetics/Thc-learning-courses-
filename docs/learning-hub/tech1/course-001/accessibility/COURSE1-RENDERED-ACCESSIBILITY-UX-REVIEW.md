# Course 1 Rendered Accessibility & Manual Learner-UX Review

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Target:** WCAG 2.2 Level AA for the deployed learner-facing web experience, plus manual usability review across supported mobile, tablet and desktop layouts.  
**Boundary:** this is a human review packet. Automated checks support it but do not by themselves establish WCAG conformance or close the project accessibility gate.

## Current standards basis

Use the current W3C WCAG 2.2 Recommendation and the W3C How to Meet WCAG 2 quick reference as the controlling accessibility references for this review.

- https://www.w3.org/WAI/standards-guidelines/wcag/
- https://www.w3.org/WAI/WCAG22/quickref/
- https://www.w3.org/TR/WCAG22/

The project review target is Level AA: all applicable Level A and Level AA success criteria must be satisfied for the reviewed course surface. Do not make a public conformance claim until the documented human review is complete and unresolved failures are closed.

## Review scope

At minimum, review the deployed Course 1 experience covering:

- `/courses/` catalog entry and Course 1 route;
- Course 1 orientation/course-map page;
- six module pages;
- all 18 lesson pages;
- the current governed Course 1 raster instructional layer, including 23 reviewed PNG learner assets and all lesson placements that use them;
- workbook and workbook-template surfaces;
- integrated practical learner surface;
- six module-test surfaces;
- 36-item academic final surface;
- completion/progress controls and Course Record where exposed to the learner;
- error, empty, loading, completed, failed and reassessment states that a learner can encounter.

## Required test environments

Record the exact browser/OS/device for each review session. The minimum manual matrix should include:

1. desktop keyboard-only review in a current Chromium- or Firefox-class browser;
2. desktop screen-reader review using a supported combination such as NVDA + Firefox/Chromium or VoiceOver + Safari;
3. iOS or Android mobile review at normal text size and enlarged text;
4. tablet-width responsive review;
5. 200% browser zoom and 400% zoom/reflow review where applicable;
6. narrow viewport/reflow review down to approximately 320 CSS px without horizontal scrolling for ordinary content, except content that legitimately requires two-dimensional layout.

If the production support matrix changes, extend this list rather than replacing valid prior evidence.

## Evidence record

For every tested page/state, capture:

| Field | Required value |
| --- | --- |
| Page / state | Route plus state being tested |
| Course object | Lesson/module/test ID where applicable |
| Date | Review date |
| Reviewer | Reviewer identity/role |
| Browser / version | Exact browser |
| OS / device | Exact environment |
| Viewport / zoom | Width/height or zoom level |
| Assistive technology | Product/version or `none` |
| WCAG criterion / UX check | Criterion or checklist row |
| Result | pass / fail / not applicable / needs follow-up |
| Evidence | notes, screenshot/video/file reference where useful |
| Issue / correction | issue ID or change reference for failures |
| Retest | date/result after correction |

## A. Structure, semantics and navigation

- Page title identifies the current course/lesson/test context.
- Heading levels form a meaningful hierarchy; visual styling is not substituted for semantic headings.
- Main, navigation and complementary regions/landmarks are understandable and not duplicated confusingly.
- Repeated navigation has a consistent order and naming.
- A keyboard user can bypass repeated blocks when needed.
- Current lesson/module position is communicated in text, not by color alone.
- Breadcrumb/course-outline links have meaningful accessible names.
- Link text makes sense in context; repeated generic labels such as “click here” are avoided.
- Focus order follows the reading and task order.
- Course navigation does not trap focus or unexpectedly move it.

## B. Keyboard operation and focus

- Every learner action is operable from the keyboard without pointer-only gestures.
- No keyboard trap occurs in menus, dialogs, tests, progress controls or embedded components.
- Focus is visibly discernible against surrounding colors.
- Focus is not fully hidden behind sticky headers, drawers, banners or overlays.
- Opening/closing a dialog or expandable region moves/restores focus predictably.
- Skip links or equivalent mechanisms work where provided.
- Custom controls expose keyboard behavior expected for their role.
- Drag-only interactions have a non-drag alternative when used.
- Pointer targets meet the project’s WCAG 2.2 AA minimum target-size expectations unless an applicable exception is documented.

## C. Reflow, zoom and responsive layout

- Text remains readable at 200% zoom without loss of content or functionality.
- At 400% zoom/reflow, ordinary lesson content can be consumed without two-dimensional scrolling.
- No heading, button, field, alert or important instructional text is clipped or overlapped.
- The three-column desktop lesson layout collapses to a logical single-column reading order on narrow screens.
- Course outline/navigation remains reachable without covering the primary lesson content.
- Visuals scale within the content column and do not overflow the viewport.
- Tables remain understandable on small screens through responsive presentation, controlled scrolling, or an accessible equivalent.
- Enlarged mobile text does not obscure controls or force text truncation.
- Orientation is not unnecessarily restricted.

## D. Color, contrast and non-color communication

- Normal text, large text, icons, controls, focus indicators and meaningful graphical objects meet applicable contrast requirements.
- Information is not communicated by color alone.
- Correct/incorrect assessment states include text/symbolic meaning in addition to color.
- Disabled and unavailable states remain understandable.
- Links can be identified in surrounding text without relying only on subtle color differences when another cue is required.
- High-contrast/forced-color modes do not remove essential state or control visibility where supported.

## E. Text alternatives and Course 1 visuals

For every one of the 19 canonical visual placements:

- the image source resolves publicly;
- meaningful images have accurate alternative text;
- alt text communicates the instructional purpose rather than repeating the filename;
- decorative graphics, if any, use an appropriate empty alternative;
- visible captions agree with the lesson and image;
- embedded text in the graphic is legible at responsive sizes and does not become the only available form of essential information;
- the visual does not introduce unsupported factual, safety, legal or authorization claims;
- screen-reader reading order places the visual/caption at a sensible point in the lesson;
- zoom/reflow does not crop instructional annotations.

Higher-resolution PNG candidates are out of scope for approval until they separately pass factual, copy, authorization-boundary, rendered-accessibility and responsive QA. The reviewed SVG baseline remains the production source until then.

## F. Forms, tests and input assistance

Review every question/control pattern used by the six module tests and final assessment:

- question prompts are programmatically associated with answer controls;
- grouped options communicate their group/question context;
- labels remain visible and understandable after selection;
- required state is announced in text/programmatic form;
- validation errors identify the problem and the affected field/question;
- focus moves to or can efficiently reach the error summary/problem after submission;
- correcting one response does not erase unrelated responses;
- instructions do not rely only on visual position, shape or color;
- answer feedback is announced when dynamically inserted;
- status messages are exposed without requiring focus to move unnecessarily;
- autosave/progress messages do not continuously interrupt assistive-technology users;
- time limits, if any, satisfy applicable adjustment/warning requirements;
- accessible authentication requirements are addressed for any sign-in/re-entry flow used to resume work.

## G. Reading, language and comprehension

- Page language is correctly identified.
- Unusual abbreviations and specialized terms are defined where the intended learner may not know them.
- Instructions use consistent terms for the same control/action.
- Safety-critical instructions are concise and distinguish observation from authorization.
- Error, remediation and reassessment messages explain the next learner action.
- Dense content is segmented with headings, lists, examples, tables or callouts without creating excessive navigation noise.
- Reading order remains logical with CSS disabled or content linearized where practical to inspect.

## H. Motion, media and sensory safety

- No essential instruction depends solely on motion, sound, spatial position or sensory characteristics.
- Automatically moving content can be paused/stopped when applicable.
- Flashing content does not violate seizure-related thresholds.
- Video/audio added in the future must have the required captions, transcripts/audio description or alternatives appropriate to the media and criterion.
- Motion caused by interaction can be disabled where required for users who request reduced motion.

## I. Learner workflow and manual UX

This section is not a substitute for WCAG review; it verifies the course remains understandable and usable in practice.

- A first-time learner can tell what Course 1 is, what it is not, and how to begin.
- The learner can identify the current module, lesson and remaining course path.
- Previous/next navigation behaves consistently.
- Completing a lesson provides understandable feedback and does not imply certification.
- Workbook/practical links are easy to find from the relevant instructional context.
- Module tests are clearly separated from lessons and from the final.
- The academic final is clearly distinguished from any future secure credential examination.
- Failed/pending assessment states provide remediation guidance without leaking hidden keys.
- Progress survives expected page navigation/reload according to the product design.
- Mobile learners can complete ordinary lesson and test actions without desktop-only assumptions.
- No page contains stale draft/TBD wording, broken images, broken anchors or dead-end navigation.

## J. Review closure rules

The rendered accessibility/manual UX gate may be closed only when:

1. the full required surface has been reviewed using the recorded environment matrix;
2. every applicable Level A/AA failure has either been corrected and retested or formally resolved under a documented standards interpretation;
3. all 18 lessons and all canonical raster teaching visuals have been represented in the evidence;
4. assessment interactions have been manually verified with keyboard and assistive technology;
5. responsive mobile/tablet/desktop layouts have been manually reviewed;
6. the reviewer signs a versioned review record tied to the exact Course 1 and deployed build being approved.

Machine tests, Lighthouse-style scans, static checks and green CI can identify defects and regressions, but they must never auto-create this human approval.
