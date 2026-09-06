# Development Debugger Skill

## Purpose
Use this skill to diagnose, reproduce, repair, and verify development defects in this repository and the deployed DTF Seeds web experience. It is the source/runtime/browser-quality specialist that complements the GitHub Orchestrator and GitHub Actions Doctor.

Use it for:
- application build or runtime failures;
- broken pages, routes, links, forms, tools, games, or interactive features;
- browser console errors and unhandled exceptions;
- failed or malformed network requests;
- layout/rendering regressions;
- responsive/mobile defects;
- accessibility failures;
- performance regressions;
- SEO or best-practice regressions;
- flaky UI behavior;
- visual regressions;
- production-vs-repository mismatches;
- requests to debug, test, audit, or improve dtfseeds.com.

## Relationship to other repository skills

- `skills/github-orchestrator/SKILL.md` owns repository lifecycle, branch/PR convergence, merges, promotion, and broad repo execution.
- `skills/github-actions-doctor/SKILL.md` owns GitHub Actions workflow diagnosis, jobs, logs, reruns, permissions, triggers, and CI plumbing.
- `skills/dev-debugger/SKILL.md` owns source/runtime/browser reproduction and product-quality diagnosis.
- `skills/github-post-push-cleanup/SKILL.md` must run after every repository write.

When a CI failure is caused by a real application defect, Actions Doctor identifies the failing job and Dev Debugger reproduces and repairs the application defect. When Dev Debugger changes repository files, return control to the Orchestrator and run post-push cleanup.

## Core debugging loop

1. Identify the exact failing surface: commit, branch, route, component, API, game, page, device, or deployment.
2. Reproduce before changing code whenever practical.
3. Capture evidence: error text, stack trace, console output, failed request, DOM state, screenshot, trace, Lighthouse audit, or test failure.
4. Reduce the failure to the smallest deterministic reproduction.
5. Classify the root cause.
6. Repair the source of the defect, not the symptom.
7. Add or improve regression coverage.
8. Re-run the narrow test first.
9. Run the wider relevant suite.
10. Run browser and Lighthouse verification when web-facing behavior changed.
11. Push only coherent fixes to the canonical branch/PR.
12. Invoke post-push cleanup and validate the newest SHA.

## Failure classes

Classify defects as one or more of:
- syntax/type/module error;
- build/bundle error;
- dependency/runtime mismatch;
- route/navigation error;
- hydration/rendering error;
- state-management bug;
- event/interaction bug;
- async/race/timing defect;
- API contract or data-shape mismatch;
- authentication/authorization/session defect;
- persistence/database contract defect;
- browser compatibility defect;
- responsive/layout/overflow defect;
- visual asset/font/image defect;
- accessibility defect;
- performance/Core Web Vitals defect;
- SEO/metadata/crawlability defect;
- broken link or missing asset;
- console warning/error;
- network failure or unexpected status;
- caching/service-worker/CDN defect;
- environment/configuration mismatch;
- production-vs-source drift;
- flaky test or unstable external dependency.

## Playwright is the default browser debugger

Use Playwright for real-browser validation. Prefer Playwright locators and web-first assertions over arbitrary sleeps. Run the same critical user journeys on Chromium, Firefox, and WebKit when browser compatibility matters, and include mobile emulation for responsive surfaces.

Playwright duties:
- load every audited page;
- fail on uncaught page errors;
- record browser console errors;
- detect failed document/script/style/image/font/fetch/XHR requests;
- verify HTTP navigation status where observable;
- verify major headings and primary content render;
- exercise navigation, forms, controls, games, and tools;
- detect links that lead to 4xx/5xx or broken internal routes;
- capture traces/screenshots/videos on failures where configured;
- test desktop and mobile layouts;
- test critical flows across Chromium, Firefox, and WebKit;
- add regression tests for every repaired browser defect that can be automated.

Do not treat a page as healthy merely because it returns HTTP 200. A page that throws client-side exceptions, fails key requests, renders blank content, or cannot complete its primary task is broken.

## DTF Seeds site-wide route discovery

For `https://dtfseeds.com`, audit every discoverable first-party page, not only the homepage.

Build the route inventory from all available sources:
1. XML sitemap and sitemap indexes;
2. repository route definitions;
3. rendered internal links discovered by Playwright crawling;
4. navigation/footer links;
5. known game/tool/content registries;
6. canonical URLs referenced by the site;
7. redirects that intentionally resolve to another first-party route.

Normalize URLs before auditing:
- same-origin only unless explicitly testing an external integration;
- remove fragments;
- deduplicate equivalent trailing-slash forms;
- avoid logout/destructive/account mutation URLs;
- do not recursively crawl query-string explosions, calendars, faceted navigation, or infinite pagination;
- preserve meaningful canonical query routes only when they represent distinct product surfaces.

The final audit report must include the discovered route count and identify any route that could not be audited.

## Lighthouse on every page

Run Lighthouse against every normalized public page in the DTF Seeds route inventory. Use Lighthouse CI where practical so results can be asserted and compared over time.

Required categories:
- Performance;
- Accessibility;
- Best Practices;
- SEO.

Target score: **100 in every Lighthouse category on every audited public page.**

The target is aspirational but enforcement must remain truthful:
- never hide or disable a valid Lighthouse audit simply to show 100;
- never remove meaningful functionality solely to raise a score;
- never label a run "100" unless the actual report is 100;
- if a third-party dependency makes 100 impossible, document the exact audit, route, dependency, measured score, and remediation path;
- fix deterministic first-party issues before accepting exceptions;
- compare against previous results and treat material regressions as defects even when a score remains high.

For performance, also inspect the underlying metrics and opportunities rather than relying only on the category number. Address avoidable render blocking, image inefficiency, JavaScript cost, layout shift, long tasks, caching, unused code, and slow server response where applicable.

## 100-score improvement order

When scores are below 100, prioritize:
1. broken functionality, console exceptions, failed requests, or missing assets;
2. accessibility violations that block users;
3. security/best-practice defects;
4. severe performance bottlenecks and Core Web Vitals risk;
5. SEO/crawlability defects;
6. remaining deterministic Lighthouse deductions;
7. third-party or environment-limited deductions with explicit evidence.

Do not chase a cosmetic score while the page's primary task is broken.

## Accessibility standard

Treat automated accessibility checks as a floor, not complete proof of accessibility. Verify at minimum:
- semantic landmarks and heading structure;
- accessible names for interactive controls;
- keyboard operability and visible focus;
- labels and error messaging for forms;
- color contrast;
- image alternatives where meaningful;
- dialog/menu focus behavior;
- responsive zoom/reflow behavior;
- no obvious keyboard traps.

Use Lighthouse findings plus Playwright behavior tests. Add axe or another dedicated accessibility engine when the repository adopts it.

## Visual and responsive QA

For every web-facing change, inspect at representative viewport classes:
- mobile phone;
- tablet/small desktop when relevant;
- desktop.

Check:
- clipping/overflow;
- unreadable text;
- overlapping controls;
- broken images/aspect ratios;
- misplaced modals/tooltips;
- hidden primary actions;
- game canvas/HUD collisions;
- layout shifts;
- unusable touch targets.

Use screenshot comparisons for stable, high-value surfaces. Do not create brittle visual snapshots for highly dynamic content without masking/stabilizing expected variability.

## Network and console policy

A browser test should capture and classify:
- `pageerror`/uncaught exceptions;
- `console.error`;
- failed network requests;
- unexpected 4xx/5xx for first-party resources;
- CORS/CSP/mixed-content failures;
- missing source assets;
- API responses that violate expected contracts.

Allowlists must be narrow, documented, and justified. Do not globally ignore console errors or failed requests.

## Broken-link policy

Every internal navigation link discovered during the audit should resolve intentionally:
- 2xx success;
- a documented redirect to the correct canonical page;
- or an intentionally unavailable/authenticated route that the public page should not expose.

Public links to accidental 404/410/5xx pages are defects. Validate image/script/style/font assets as well as document links.

## Production-vs-repository verification

When a defect is reported on dtfseeds.com:
1. reproduce on production;
2. identify the repository source expected to own the surface;
3. determine whether the defect exists in source, deployment, cache/CDN, environment, or routing;
4. validate the fix against the development/staging target;
5. promote through the repository lifecycle;
6. re-run the production Playwright/Lighthouse audit after deployment;
7. verify the deployed version actually contains the intended fix.

Never assume a merged commit is live merely because GitHub is green.

## Regression-test requirement

For each repaired deterministic defect, add the smallest stable automated regression test that would have caught it, unless automation is genuinely impractical. If no automated test is added, record why and provide a repeatable manual verification procedure.

## Debugging discipline

- Prefer evidence over guesses.
- Change one causal layer at a time when narrowing a defect.
- Do not "fix" flaky tests by adding arbitrary long sleeps.
- Do not suppress exceptions, warnings, or failed assertions without proving they are invalid.
- Do not disable accessibility, Lighthouse, or browser checks to get green CI.
- Do not broadly upgrade unrelated dependencies during a focused defect repair.
- Do not modify generated artifacts by hand when a generator exists.
- Do not test only Chromium when the defect could be browser-specific.
- Do not test only desktop when the surface is customer-facing and responsive.

## Suggested execution commands

Use repository-provided scripts when present. Otherwise the expected toolchain is:
- `npx playwright test` for E2E/browser suites;
- `npx playwright test --ui` for interactive local diagnosis;
- `npx playwright test --project=chromium` for a narrow browser pass;
- `npx playwright test --project=firefox --project=webkit` for compatibility follow-up;
- `npx playwright install --with-deps` in CI/bootstrap when browsers are not already installed;
- Lighthouse CI (`lhci autorun`) for repeatable Lighthouse collection/assertions.

Follow the exact repository config once Playwright/Lighthouse files exist; do not invent parallel test frameworks.

## CI expectations

The long-term CI architecture should have separable jobs for:
- fast source/unit/schema validation;
- browser smoke/E2E validation;
- site-wide route/link/console/network audit;
- Lighthouse CI;
- release/deployment verification.

Keep expensive full-site audits controllable so ordinary iteration remains practical, but require them before staging/main promotion and after production releases. PRs that change shared layout, navigation, routing, games/tools, or global assets should trigger the relevant browser/Lighthouse suite.

## Completion standard

Debugging is complete only when:
- the failure is reproduced or its evidence is understood;
- root cause is identified;
- the repair is implemented at the correct layer;
- regression coverage exists where practical;
- relevant local/source tests pass;
- relevant Playwright browser tests pass;
- affected public pages have been included in Lighthouse/site-wide QA;
- new console/network/broken-link failures are absent;
- the newest pushed SHA passes required checks;
- post-push cleanup has completed;
- when production was affected, the deployed site is re-verified.

## Report format

Report factual results:
- defect/root cause;
- files or systems changed;
- regression tests added;
- Playwright coverage and browsers run;
- route count audited;
- Lighthouse scores by route or summarized with attached artifacts;
- remaining pages below 100 and exact reasons;
- unresolved external/admin/third-party blockers;
- next highest-priority defect.

Never report "all pages are 100" without actual per-page Lighthouse evidence.