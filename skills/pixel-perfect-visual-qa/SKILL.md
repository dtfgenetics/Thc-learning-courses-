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

## Surface profiles
Do not audit every product surface identically. Apply additional checks by surface type.

### Marketing, genetics, gallery, and landing pages
Verify hero composition, CTA hierarchy, image quality/cropping, card-grid rhythm, section transitions, navigation/footer consistency, promotional banners, metadata-driven share previews when visible, and long-page spacing.

### Academy, lessons, encyclopedia, and certification pages
Verify reading width, heading hierarchy, lesson navigation, progress indicators, diagrams/infographics, tables, callouts, quiz controls, code/math/science blocks when present, printable/downloadable assets, sticky course navigation, and long-form mobile readability.

### Games and canvas/WebGL surfaces
Verify canvas fit, HUD safe areas, score/status readability, touch controls, keyboard focus, overlays, pause/restart/game-over states, orientation changes, aspect-ratio behavior, loading states, and no game UI hidden behind site chrome.

### Interactive tools, calculators, forms, and dashboards
Verify input sizing, labels, validation, results panels, dense tables/cards, filters, menus, empty/loading/error/success states, keyboard navigation, mobile stacking, and data visualization clipping.

### Infographics, printables, image libraries, and document viewers
Verify asset resolution, aspect ratio, zoom/readability, download controls, captions, thumbnail consistency, print-safe layout where applicable, and no low-resolution or stretched imagery.

### Shared shell and design-system primitives
Verify header, footer, nav, buttons, form controls, cards, badges, dialogs, spacing tokens, typography tokens, breakpoints, and shared container geometry across representative consumers before patching individual routes.

## Executable repository implementation
The repository implementation for this skill is intentionally shared with Playwright and Lighthouse:
- `web-qa.config.mjs` defines base URL, route limits, enforcement mode, visual mode, and viewport matrix;
- `scripts/discover-public-routes.mjs` builds the first-party route inventory;
- `playwright.config.mjs` defines deterministic browser projects and evidence retention;
- `tests/web-qa/site-health.spec.mjs` captures browser/runtime defects;
- `tests/web-qa/visual-regression.spec.mjs` captures candidate screenshots or compares approved baselines;
- `lighthouserc.cjs` audits Performance, Accessibility, Best Practices, and SEO;
- `.github/workflows/web-quality.yml` runs PR, staging/main, scheduled, and manual quality passes.

Use repository scripts when present. Install the pinned web-QA runtime with `npm run web:qa:install`, discover routes with `npm run web:routes`, then use `npm run web:qa:health`, `npm run web:qa:visual`, and `npm run web:qa:lighthouse` as appropriate.

## Quality maturity modes
The QA system has explicit maturity modes so existing site debt can be surfaced without being silently accepted.

### Observe
Use while first inventorying a legacy or under-tested surface. Capture findings and artifacts without pretending the current state is correct. Observation is not completion.

### Repair
Work through browser, visual, accessibility, SEO, and performance findings in priority order. Shared defects should be fixed at the shared layer.

### Baseline
After a surface has been reviewed and intentionally accepted, establish deterministic visual references. Do not auto-approve screenshots simply because they are current production.

### Enforce
Set hard failure behavior only after the relevant baseline and known defects have been resolved or explicitly approved. Enforced routes must fail on unexplained browser errors, broken requests, screenshot differences, or configured Lighthouse deductions.

### Production watch
Re-run scheduled and post-release audits so later deployments, CDN changes, fonts, dependencies, data, or third parties cannot quietly degrade previously approved surfaces.

A route may never be promoted from Observe directly to "pixel-perfect" without the Repair and Baseline steps.

## Evidence contract
Every visual QA run should retain enough evidence to reproduce the result:
- exact URL and environment;
- commit/release SHA when applicable;
- browser and viewport/project;
- screenshot candidate or visual diff;
- Playwright trace/video for behavioral failures when useful;
- console/network failure details;
- Lighthouse report for audited routes;
- baseline identity/reference;
- classification of intentional versus unintended change.

Do not report a route as passing if evidence is missing for a required dimension.

## Baseline governance
Approved visual baselines are controlled test assets.
- Candidate screenshots may be generated automatically.
- Candidate generation is not baseline approval.
- Review the candidate against the strongest approved design/reference first.
- Commit or update a baseline only for an intentional accepted appearance.
- Keep the CI rendering environment consistent with baseline generation.
- If a baseline is invalid because the design itself is wrong, repair the design and create a new approved baseline; do not preserve a bad screenshot merely because it existed first.

## Scale strategy for all future work
As the DTF Seeds/THC system grows, protect quality without exploding test cost:
- every customer-facing route participates in route discovery and health auditing;
- shared shell/design-system changes receive broad regression coverage;
- high-value and visually stable surfaces receive committed visual baselines;
- interactive games/tools receive state-specific component or region screenshots in addition to page captures;
- PRs run focused/representative checks;
- staging/main promotion and scheduled production runs expand toward the full public route set;
- expensive audits retain artifacts rather than being duplicated in unrelated fast curriculum jobs;
- repeated defect classes should become reusable assertions/helpers instead of one-off manual checks.

When new product categories appear, add a surface profile and reusable coverage rather than inventing a separate QA system.

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