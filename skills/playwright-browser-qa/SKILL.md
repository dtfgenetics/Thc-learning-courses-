# Playwright Browser QA Skill

## Purpose
Use Playwright as the repository's primary real-browser testing and debugging tool for customer-facing web pages, games, tools, navigation, forms, and interactive flows.

Use this skill when:
- a browser-visible defect is reported;
- a page, game, tool, form, navigation flow, or route changes;
- console/network failures need reproduction;
- responsive behavior must be checked;
- cross-browser behavior matters;
- a regression test should be added for a repaired UI defect;
- the development debugger delegates browser validation.

## Relationship to visual QA
Playwright is also the execution engine for `skills/pixel-perfect-visual-qa/SKILL.md`. For customer-facing visual work, functional assertions alone are insufficient. Capture deterministic screenshots and run visual comparison at the required viewports/states so visible regressions are detected as test failures.

## Operating sequence
1. Select the exact environment and base URL.
2. Reproduce the issue in the narrowest relevant Playwright test.
3. Capture page errors, console errors, failed requests, unexpected status codes, and screenshots/traces on failure.
4. Repair the source defect.
5. Add a deterministic regression assertion.
6. Re-run the narrow test.
7. Run the relevant broader browser suite.
8. Run Chromium plus Firefox/WebKit when compatibility risk exists.
9. Run mobile/responsive projects for customer-facing layout changes.
10. Run pixel-perfect screenshot comparison for stable changed surfaces.
11. Return results to `skills/dev-debugger/SKILL.md` and then repository lifecycle handling.

## Required browser signals
Every audited page should be observed for:
- uncaught `pageerror` events;
- `console.error` messages;
- failed document/script/style/image/font/fetch/XHR requests;
- unexpected first-party 4xx/5xx responses;
- blank or obviously incomplete primary content;
- broken internal navigation;
- inaccessible or non-operable primary controls.

Do not globally suppress any of these. Allowlists must be narrow, documented, and justified.

## Test design rules
- Prefer role/text/label/test-id locators that represent user-visible semantics.
- Prefer web-first assertions.
- Do not use arbitrary long sleeps as a flake fix.
- Keep tests isolated and independently repeatable.
- Stabilize known dynamic data rather than weakening assertions.
- Test the user's outcome, not implementation internals, unless diagnosing a lower-level failure.
- Add regression coverage for deterministic repaired bugs.
- Capture traces/screenshots only as needed to make failure evidence useful and CI artifacts manageable.

## Pixel-perfect screenshot rules
For stable, high-value customer-facing surfaces:
- use Playwright screenshot assertions or an equivalent deterministic image-diff workflow;
- render reference and implementation at the same viewport, state, theme, and content conditions;
- check full-page composition plus focused high-value components where appropriate;
- target zero unexplained visual difference against the strongest approved reference;
- use only minimal, documented tolerance for genuine cross-platform rasterization noise;
- never raise a visual-diff threshold merely to make a real regression pass;
- mask only truly nondeterministic regions, never broken UI or missing first-party content;
- do not automatically accept/update baselines after failures;
- investigate changed pixels first and approve a new baseline only for an intentional visual change.

Visual comparison must cover, where relevant:
- spacing, padding, gaps, margins, grids, and alignment;
- typography family, weight, size, line-height, wrapping, and hierarchy;
- button/control dimensions and icon alignment;
- cards, containers, borders, radii, shadows, and separators;
- image crop/aspect ratio/resolution;
- headers, navigation, footers, modals, overlays, dropdowns, and tooltips;
- clipping, overflow, stacking, accidental scrollbars, and sticky/fixed collisions;
- loading, empty, error, selected, focused, expanded, and disabled states;
- games/canvas/HUD safe areas and control placement.

## Browser matrix
Default development pass:
- Chromium desktop.

Expanded compatibility pass when relevant:
- Chromium;
- Firefox;
- WebKit.

Responsive pass for public/customer-facing surfaces:
- narrow mobile around 360px;
- common mobile around 390-430px;
- tablet around 768px when breakpoint behavior exists;
- laptop/desktop around 1280-1440px;
- large desktop around 1920px for wide-layout, game, or tool surfaces.

When the project has exact device profiles or CSS breakpoint values, use those and add checks immediately below/above risky breakpoints.

## Site crawling and link QA
When performing a site-wide DTF Seeds audit:
1. seed URLs from sitemap(s), repository routes, navigation, footer, known game/tool registries, and canonical links;
2. crawl rendered first-party internal links;
3. normalize and deduplicate URLs;
4. skip destructive/account mutation/logout URLs;
5. prevent query-string and pagination explosions;
6. record every page that could not be loaded or tested;
7. test internal destinations and first-party static assets for accidental failures.

## Game/tool QA
For interactive games and tools, additionally verify:
- initial load completes;
- primary controls are visible and actionable;
- keyboard/pointer/touch paths as appropriate;
- canvas/HUD/UI does not overlap or clip at target sizes;
- reset/restart flows work;
- state transitions complete without console errors;
- core loop can progress beyond the first interaction;
- navigation back to the hub/site remains functional;
- screenshots at target viewport classes show intentional composition and readable safe areas.

## Production verification
For `dtfseeds.com`, a green local/staging test is not proof of deployment. After promotion/release, re-run the critical production Playwright checks against the live URL and verify the actual deployed behavior and representative production screenshots.

## Suggested commands
Use repository-defined scripts when available. Otherwise:
- `npx playwright test`
- `npx playwright test --project=chromium`
- `npx playwright test --project=firefox --project=webkit`
- `npx playwright test --ui`
- `npx playwright test --update-snapshots` only after an intentional visual change has been reviewed and approved;
- `npx playwright install --with-deps` during supported bootstrap/CI setup when browser binaries are absent.

## Completion standard
Playwright QA is complete only when:
- the target behavior is exercised in a real browser;
- no unexplained page/console/network failure remains;
- critical assertions pass;
- repaired deterministic defects have regression coverage where practical;
- required browser/device projects pass;
- pixel-perfect visual QA passes for stable changed customer-facing surfaces;
- no unexplained screenshot diff remains against approved references/baselines;
- typography, spacing, alignment, responsive composition, clipping/overflow, and interactive states are visually correct;
- failure artifacts are retained when useful;
- results are handed back to the development debugger/orchestrator for the remaining repo lifecycle.
