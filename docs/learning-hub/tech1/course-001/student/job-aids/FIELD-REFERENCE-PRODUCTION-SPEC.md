# Course 1 Field Reference Production Specification

## Purpose

Define a consistent production standard for Course 1 quick-reference/job-aid outputs across web, mobile, print and accessible alternate formats. This specification controls presentation quality only; it does not limit future content, number of aids, page count, examples or formats.

## Content architecture

Each field reference should use this order where applicable:

1. title and use case;
2. mapped Course 1 objective(s) and workbook activity links;
3. boundary statement identifying which controlled workplace sources override the aid;
4. fast decision sequence or pocket mnemonic;
5. core decision table/process;
6. stop/escalate or release-authority conditions;
7. one strong-vs-weak example;
8. record/handoff formula;
9. cross-shift/open-condition trigger;
10. compact pocket-use summary.

Not every future aid must contain every section when the topic does not need it. The structure is a quality pattern, not a hard content schema.

## Mobile-first requirements

For rendered web/mobile versions:

- use one primary reading column;
- avoid forcing horizontal scrolling for essential information;
- convert wide decision tables into stacked cards or responsive rows below the small-screen breakpoint;
- keep the pocket sequence visible near the top and again at the bottom;
- keep action verbs at the start of steps;
- use short headings and enough whitespace to scan while standing or working in a training lab;
- do not hide safety/stop conditions inside collapsed sections by default;
- preserve selectable text; do not rasterize essential instructions into images;
- make links and controls keyboard accessible with visible focus;
- maintain useful reading order when CSS is disabled or assistive technology linearizes the page.

## Print requirements

For printable versions:

- target a one- or two-page quick-reference layout when content can remain readable without deleting useful information;
- permit additional pages when necessary rather than shrinking type to fit an arbitrary page count;
- use at least a comfortably readable body size for the chosen format and printer conditions;
- avoid low-contrast gray body text;
- repeat table headers if a table spans pages;
- keep decision sequences and stop/escalate boxes together where practical;
- prevent isolated headings at the bottom of a page;
- include course ID, job-aid title and version/date in a footer or equivalent metadata area;
- provide enough margin for common office printers and binder use;
- do not rely on bleed-dependent graphics for essential meaning.

## Accessibility requirements

- Color may reinforce meaning but must never be the only status indicator.
- Use text labels such as **STOP**, **VERIFY**, **OPEN**, **RELEASED** or **OUT OF SERVICE** alongside visual styling.
- Tables require clear header relationships and a linear alternative when rendered responsively.
- Icons must have adjacent text or accessible names when they carry meaning.
- Any future diagrams require meaningful alt text and, for complex visuals, a nearby text explanation of the decision logic.
- Avoid visual-only comparisons where the learner must infer the correct response from color or spatial position alone.
- Maintain sufficient contrast for text, controls and non-text status indicators.
- Support zoom/reflow without losing instructions, table content or sequence order.

## Visual hierarchy

Recommended hierarchy:

- **Level 1:** title / task family;
- **Level 2:** immediate decision sequence;
- **Level 3:** decision table or process steps;
- **Level 4:** strong-vs-weak example;
- **Level 5:** documentation/handoff formula;
- **Level 6:** practice/objective mapping and source boundary.

Use visual emphasis to distinguish:

- action the learner can perform;
- condition that requires stop/hold;
- condition that requires escalation or another authorized role;
- factual observation versus hypothesis;
- completed versus unresolved work.

## Strong-vs-weak example pattern

Each example should show **why** one response is stronger rather than merely labeling one “wrong.” Strong responses should generally demonstrate:

- specific identity/location/status;
- correct authority boundary;
- preservation of evidence/history;
- clear task/equipment/material status;
- appropriate escalation;
- reconstructable documentation.

Weak examples should represent realistic mistakes—not absurd distractors—such as production pressure, memory-based shortcuts, premature record correction, unsupported diagnosis or incomplete handoff.

## Source and authority boundary

Every field reference must remain subordinate to the applicable current controlled information, including where relevant:

- employer SOP/work order;
- emergency plan;
- product label/SDS;
- equipment manual;
- approved sanitation procedure;
- site access/release controls;
- jurisdiction-specific requirements;
- role-specific qualification/authorization.

Do not turn a generic field reference into a claim that one facility procedure, software system, waste method or regulatory workflow is universal.

## Versioning and maintenance

When a field reference materially changes:

1. update the source Markdown;
2. verify objective/workbook mappings;
3. verify any cited/linked source boundary still applies;
4. update rendered print/mobile artifacts if maintained separately;
5. run accessibility and link checks;
6. record the new version/date in the rendered output metadata.

A field reference may be expanded, split, merged, translated, replaced or retired when better instructional design or evidence supports the change.

## Current Course 1 set

The current six aids cover:

1. hazard response / PPE / HazCom;
2. biosecurity / sanitation / status control;
3. controlled work instructions / authority;
4. traceability / event genealogy / reconciliation;
5. equipment readiness / operator-care boundary / faults;
6. data integrity / correction / shift handoff.

This list is a current snapshot, not a maximum.