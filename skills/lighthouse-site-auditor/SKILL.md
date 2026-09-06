# Lighthouse Site Auditor Skill

## Purpose
Use Lighthouse and Lighthouse CI to continuously measure and improve every discoverable public page on `https://dtfseeds.com`.

Primary quality target: **100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO on every audited public page.**

The target must remain truthful. Never suppress a valid audit or misreport results merely to obtain 100.

## Use this skill when
- auditing dtfseeds.com;
- changing shared layout, navigation, assets, routing, rendering, or SEO metadata;
- changing games/tools/content surfaces that can affect page quality;
- preparing `dev -> staging -> main` promotion;
- validating a production deployment;
- investigating a Lighthouse regression;
- the development debugger delegates performance/accessibility/SEO/browser-quality measurement.

## Route inventory
Before Lighthouse runs, build the page inventory from all available first-party sources:
1. XML sitemap and sitemap indexes;
2. repository route definitions;
3. rendered internal links discovered by browser crawling;
4. header/footer/navigation links;
5. game/tool/content registries;
6. canonical links and known public landing pages.

Normalize:
- same origin only unless explicitly requested;
- remove fragments;
- deduplicate trailing slash equivalents;
- avoid destructive/logout/account mutation URLs;
- cap or exclude infinite faceting/pagination/query explosions;
- preserve meaningful distinct public routes.

Report the total discovered route count and list any route that could not be audited.

## Required Lighthouse categories
Collect and assert:
- Performance;
- Accessibility;
- Best Practices;
- SEO.

Also inspect underlying diagnostic metrics and audits rather than using category numbers alone.

## 100-score policy
For every category below 100:
1. identify the exact failing audits;
2. distinguish first-party deterministic causes from third-party/environmental causes;
3. repair deterministic first-party causes;
4. re-run the affected page;
5. re-run the representative/full route set after shared changes;
6. document any remaining non-first-party limitation with evidence.

Never:
- disable a valid Lighthouse audit just to increase the number;
- remove important content/functionality just to score higher;
- claim 100 without the generated report evidence;
- accept a new regression because the page still scores "high enough".

## Priority order
Fix in this order when multiple categories fail:
1. broken functionality, page exceptions, failed critical requests, missing assets;
2. accessibility blockers;
3. security and Best Practices failures;
4. severe performance/Core Web Vitals risks;
5. SEO/crawlability issues;
6. remaining deterministic score deductions;
7. documented third-party/environment-limited deductions.

## Performance review
When Performance is below 100, inspect at minimum:
- Largest Contentful Paint-related bottlenecks;
- layout shift sources;
- long tasks/main-thread work;
- JavaScript execution and unused code;
- render-blocking resources;
- image sizing, format, compression, and lazy loading;
- font loading;
- caching/static asset policy;
- server/TTFB issues;
- third-party script cost.

Do not optimize only the Lighthouse number; preserve usability and correctness.

## Accessibility review
Automated Lighthouse accessibility is only a baseline. Pair Lighthouse with Playwright/manual semantics checks for:
- keyboard operation;
- focus visibility/order;
- accessible names;
- form labels/errors;
- headings/landmarks;
- contrast;
- meaningful image alternatives;
- responsive zoom/reflow;
- dialog/menu focus behavior.

## Best Practices review
Treat findings involving:
- browser errors;
- insecure/mixed content;
- unsafe/deprecated APIs;
- image quality/aspect issues;
- security-related browser concerns;
as real defects unless disproven.

## SEO review
Check:
- indexability/crawlability where intended;
- page titles/descriptions;
- canonical URLs;
- meaningful link text;
- valid robots behavior;
- mobile usability;
- status/redirect correctness.

Lighthouse SEO is not a complete SEO strategy; use it as a deterministic technical baseline.

## Lighthouse CI
Prefer Lighthouse CI for repeatable collection, assertions, and regression tracking.

Expected workflow shape:
1. discover/produce URL manifest;
2. run Lighthouse CI collection for all URLs or controlled batches;
3. assert category thresholds and critical audits;
4. retain reports as CI artifacts;
5. summarize routes below target;
6. block staging/main promotion for unexplained material regressions according to repository policy;
7. run production verification after deployment.

## CI scaling
A full every-page audit can be expensive. Keep it comprehensive while managing runtime by:
- batching/sharding URLs;
- using representative fast PR checks plus mandatory full audits before staging/main when needed;
- caching only where it cannot invalidate measurements;
- keeping full reports as artifacts;
- comparing shared-template changes across all affected routes.

Never reduce the declared page inventory merely to make CI faster without documenting the coverage tradeoff.

## Regression handling
For each run, compare current results with the last trusted baseline when available. Treat these as regressions:
- any new category deduction;
- material metric degradation;
- newly failing critical audit;
- newly unauditable route;
- page removed from inventory unexpectedly.

## Production verification
After a deployment to dtfseeds.com:
- rebuild the live route inventory;
- rerun Lighthouse against the actual production URLs;
- verify the deployed pages, not just repository/staging artifacts;
- record any CDN/cache/third-party differences from staging.

## Suggested command
Use repository-defined scripts/config when present. Otherwise Lighthouse CI's expected runner is:
- `lhci autorun`

Do not create a second competing Lighthouse configuration once the repository has a canonical one.

## Completion standard
Lighthouse auditing is complete only when:
- every discoverable normalized public route is accounted for;
- every auditable route has a current Lighthouse result;
- scores and failing audits are recorded truthfully;
- deterministic first-party defects are repaired or tracked as explicit unresolved work;
- no unexplained new regression remains;
- reports are retained where needed for verification;
- production is re-audited after production-affecting releases.

## Report format
Report:
- route count discovered;
- route count successfully audited;
- routes skipped/failed and why;
- min/median/max scores per category;
- all routes below 100;
- exact failing audits for those routes;
- fixes completed;
- remaining third-party/environmental blockers;
- next highest-impact optimization.