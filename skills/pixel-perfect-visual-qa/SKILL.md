# Pixel-Perfect Visual QA Skill

## Purpose
Use this skill to make customer-facing pages, games, tools, and shared UI visually production-ready and as close to the approved design intent as practical across supported viewports. "Pixel-perfect" means deliberate visual fidelity verified by repeatable evidence, not subjective eyeballing.

Use this skill when:
- implementing or refining UI;
- fixing visual regressions;
- validating dtfseeds.com pages, games, tools, cards, dashboards, learning surfaces, or navigation;
- comparing implementation to an approved reference, mockup, screenshot, design system, or known-good baseline;
- the development debugger or Playwright QA identifies a layout/rendering defect.

## Relationship to other skills
- `skills/dev-debugger/SKILL.md` owns root-cause debugging and coordinates web QA.
- `skills/playwright-browser-qa/SKILL.md` owns real-browser execution and screenshot capture.
- `skills/lighthouse-site-auditor/SKILL.md` owns performance/accessibility/best-practices/SEO scores.
- This skill owns visual fidelity, alignment, consistency, responsive composition, and screenshot-diff acceptance.

A Lighthouse 100 does not prove visual correctness. A passing functional E2E test does not prove visual correctness. Customer-facing work is not visually complete until this skill's checks pass.

## Visual acceptance hierarchy
Use the strongest available reference in this order:
1. explicitly approved design or screenshot;
2. current design-system tokens/components plus approved page pattern;
3. known-good production baseline;
4. documented visual spec;
5. best-fit implementation consistent with the rest of the product when no stronger reference exists.

Never invent a mismatched visual language merely to make a page look different.

## Pixel-perfect verification loop
1. Identify the reference and exact target route/component.
2. Render at the same viewport, device scale assumptions, theme, state, and content conditions.
3. Stabilize nondeterministic content such as timestamps, rotating banners, animations, random seeds, ads, and network-driven placeholders where possible.
4. Capture a full-page screenshot plus focused component screenshots for high-value regions.
5. Compare reference and implementation using image diff or overlay.
6. Classify mismatches by cause rather than patching individual pixels blindly.
7. Repair design tokens, layout rules, typography, assets, or component logic at the correct shared layer.
8. Re-capture and compare.
9. Repeat across the required viewport matrix.
10. Retain/update the baseline only when the new appearance is intentionally approved.

## Required visual checks
Inspect all relevant surfaces for:
- exact alignment and consistent grid placement;
- spacing, padding, margins, gaps, and section rhythm;
- typography family, weight, size, line-height, letter spacing, wrapping, truncation, and hierarchy;
- border width, radius, shadows, outlines, separators, and focus rings;
- icon size, stroke/weight consistency, baseline alignment, and button/icon centering;
- image crop, aspect ratio, object position, resolution, loading state, and missing assets;
- color/token consistency and contrast;
- container width, max-width, gutters, and centering;
- header/footer/navigation geometry;
- card heights, alignment, repeated-grid consistency, and orphaned items;
- control sizing and touch targets;
- modal, popover, tooltip, dropdown, toast, and overlay positioning;
- z-index/stacking errors;
- clipping, overflow, accidental scrollbars, and off-canvas content;
- sticky/fixed element collisions;
- loading/skeleton/empty/error states;
- hover, focus, active, selected, disabled, validation, and expanded states;
- animation starting/ending positions and layout-shift side effects;
- canvas/game HUD alignment and readable safe areas.

## Viewport matrix
For customer-facing web changes, validate at minimum:
- narrow mobile around 360px width;
- common mobile around 390-430px width;
- tablet around 768px width when the layout has breakpoint behavior;
- laptop around 1280-1440px width;
- large desktop around 1920px width for wide-layout or game/tool surfaces.

Use exact project device definitions when they exist. Add additional breakpoint-edge tests just below and above CSS breakpoints when visual failures are likely.

## Screenshot regression policy
Use Playwright screenshot assertions or an equivalent deterministic visual-diff workflow for stable, high-value surfaces.

Rules:
- baseline images are test evidence, not decoration;
- do not update baselines automatically just because a test failed;
- investigate every changed pixel region before accepting a new baseline;
- baseline updates require an intentional visual change;
- use tight masks only for truly nondeterministic regions;
- do not mask broken UI, missing content, layout shifts, or first-party rendering defects;
- prefer component-level snapshots plus selected full-page snapshots over an unmaintainable screenshot explosion;
- keep screenshot naming tied to route/component, state, browser, and viewport.

## Diff threshold policy
Target zero unexplained visual difference against an approved deterministic reference.

Small rasterization differences can occur across operating systems, browsers, font renderers, and GPU environments. If a non-zero image-diff tolerance is required:
- keep it as small as the environment genuinely needs;
- document why;
- use a consistent CI rendering environment;
- never raise tolerance merely to make a real regression pass.

The standard is not "under the threshold." The standard is "no unexplained visual defect." Thresholds exist only to absorb known rendering noise.

## Typography stability
Typography is a major source of false and real visual regressions. Verify:
- intended webfont files load successfully;
- fallback fonts do not unexpectedly replace the intended family;
- font weights actually exist rather than being browser-synthesized when avoidable;
- font-display behavior does not leave persistent layout changes;
- line wrapping matches design intent at required widths;
- text remains readable at zoom and responsive breakpoints.

## Responsive visual quality
Pixel-perfect does not mean freezing one desktop screenshot. The implementation must preserve design intent responsively.

At each supported width verify:
- hierarchy is preserved;
- components reflow intentionally;
- spacing scales consistently;
- content remains visible and operable;
- images crop intentionally;
- no important control falls below/behind fixed chrome;
- tables, cards, games, diagrams, and infographics have a deliberate small-screen strategy;
- horizontal scrolling exists only where it is an intentional interaction pattern.

## Interactive-state coverage
For important components capture/inspect the states users actually see:
- default;
- hover when applicable;
- keyboard focus;
- active/pressed;
- selected/current;
- open/expanded;
- disabled;
- loading;
- empty;
- validation/error;
- success/confirmation.

## Design-system repair rule
When the same visual defect appears across multiple pages, prefer fixing the shared token/component/layout primitive rather than patching every route separately. Re-run visual regression tests on all affected consumers after shared fixes.

## Production verification
After deployment, sample the changed production routes with the same viewport/state checks. Verify that fonts, CDN assets, compression, caching, environment-specific styles, and production data did not change rendering relative to the validated build.

## Completion standard
Visual QA is complete only when:
- the implementation matches the strongest available approved reference or documented design intent;
- no unexplained screenshot diff remains on protected surfaces;
- required viewport classes pass;
- typography, spacing, alignment, sizing, assets, states, and responsive behavior are correct;
- no clipping/overflow/overlap defect remains;
- baseline updates, if any, are intentional and explained;
- Lighthouse/accessibility/functionality checks still pass after visual fixes;
- production is re-verified when the change is deployed.

## Reporting
Report:
- routes/components visually checked;
- reference/baseline used;
- viewports/browsers tested;
- visual diffs repaired;
- intentional baseline changes;
- remaining visual mismatches and why;
- whether production matches the validated build.

Never call a page pixel-perfect based only on manual inspection of one screenshot or one viewport.