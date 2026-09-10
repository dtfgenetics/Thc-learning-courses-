# Pixel-Perfect Visual QA Skill

## Purpose
Use this skill to make customer-facing pages, games, tools, cards, dashboards, learning surfaces, and shared UI visually production-ready against approved design intent.

This skill owns visual fidelity, responsive composition, asset correctness, and image/reference comparison. It does not require a browser automation framework during routine development.

## Relationship to other skills
- `skills/dev-debugger/SKILL.md` owns root-cause debugging and deterministic web QA.
- `skills/lighthouse-site-auditor/SKILL.md` owns performance/accessibility/best-practices/SEO measurement.
- This skill owns alignment, typography, spacing, sizing, responsive composition, image quality, and visual acceptance.

A Lighthouse 100 does not prove visual correctness. Customer-facing work is not visually complete until the strongest available approved reference has been checked.

## Visual acceptance hierarchy
Use the strongest available reference in this order:
1. explicitly approved design or screenshot;
2. current design-system tokens/components plus approved page pattern;
3. known-good production baseline;
4. documented visual specification;
5. a best-fit implementation consistent with the rest of the product when no stronger reference exists.

Never invent a mismatched visual language merely to make a page look different.

## Verification loop
1. Identify the exact reference and target route/component.
2. Match viewport, theme, state, content, and device assumptions as closely as practical.
3. Stabilize nondeterministic content before comparison where possible.
4. Use supplied/current screenshots or other approved renders as evidence.
5. Compare reference and implementation with deterministic image diff/overlay tools when stable captures are available.
6. Classify differences by shared token, layout, typography, asset, or component cause.
7. Repair the causal shared layer instead of patching isolated pixels.
8. Recompare affected surfaces.
9. Repeat across the required viewport matrix.
10. Accept a new baseline only when the visual change is intentional and approved.

## Required visual checks
Inspect relevant surfaces for:
- grid alignment, spacing, padding, margins, gaps, and section rhythm;
- typography family, weight, size, line-height, letter spacing, wrapping, truncation, and hierarchy;
- borders, radii, shadows, outlines, separators, and focus treatment;
- icon sizing and alignment;
- image crop, aspect ratio, object position, resolution, loading state, and missing assets;
- design-token consistency and contrast;
- container width, gutters, centering, header/footer/navigation geometry;
- repeated-grid and card consistency;
- control sizing and touch targets;
- modal/popover/dropdown/toast/overlay placement when evidence is available;
- z-index, clipping, overflow, accidental scrollbars, and fixed/sticky collisions;
- loading/empty/error/success states;
- animation start/end composition and layout-shift side effects;
- canvas/game HUD alignment and readable safe areas.

## Viewport matrix
For customer-facing changes validate, when evidence or rendering access permits:
- narrow mobile around 360px;
- common mobile around 390–430px;
- tablet around 768px when breakpoints apply;
- laptop around 1280–1440px;
- large desktop around 1920px for wide-layout/game/tool surfaces.

Do not claim a viewport passed if it was not actually inspected.

## Deterministic image comparison policy
For stable high-value surfaces, use image-diff or overlay comparison against approved captures.

Rules:
- baselines are test evidence, not decoration;
- never update a baseline automatically because a comparison fails;
- investigate changed regions before accepting them;
- baseline updates require intentional visual change;
- mask only genuinely nondeterministic regions;
- never mask broken UI, missing content, layout shifts, or first-party defects;
- prefer focused component comparisons plus selected full-page references over an unmaintainable snapshot explosion.

Target zero unexplained visual difference. If a non-zero tolerance is genuinely necessary because of rasterization/rendering noise, document it and keep it minimal.

## Design-system repair rule
When the same visual defect appears across multiple pages, fix the shared token/component/layout primitive and recheck affected consumers rather than patching every route separately.

## Production verification
After deployment, compare changed production surfaces with the approved reference and validated source/staging state. Verify fonts, CDN assets, compression, caching, environment-specific styles, and production data have not changed the intended appearance.

## Routine-tool policy
Routine QA should use deterministic source/build checks, route/asset validation, approved screenshot/reference inspection, image-diff tools when available, and Lighthouse. Do not add a browser automation dependency to this skill or make one a normal completion gate.

An isolated final-release interactive/browser check can be considered only when explicitly requested for that release; it is not part of routine development.

## Completion standard
Visual QA is complete only when the implementation matches the strongest approved reference or documented design intent, no unexplained reference difference remains on protected surfaces, required viewport classes that were available for inspection have been checked, assets/typography/spacing/alignment are correct, deterministic route and Lighthouse checks still pass, and production is rechecked when deployed.

## Reporting
Report the routes/components checked, reference used, viewports actually inspected, visual defects repaired, intentional baseline changes, remaining mismatches and their cause, and whether production matches the validated design. Never call a page pixel-perfect from one unchecked assumption or from Lighthouse alone.
