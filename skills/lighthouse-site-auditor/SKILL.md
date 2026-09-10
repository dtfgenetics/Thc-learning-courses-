# Lighthouse Site Auditor Skill

## Purpose
Use Lighthouse and Lighthouse CI to continuously measure and improve every discoverable public page on `https://dtfseeds.com`.

Primary quality target: **100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO on every audited public page.** Results must remain truthful; never suppress a valid audit or misreport a score merely to obtain 100.

## Use this skill when
- auditing dtfseeds.com;
- changing shared layout, navigation, assets, routing, rendering, or SEO metadata;
- changing games/tools/content surfaces that affect page quality;
- preparing `dev -> staging -> main` promotion;
- validating production deployment;
- investigating a Lighthouse regression.

## Route inventory
Before Lighthouse runs, build the page inventory from available first-party sources:
1. XML sitemap and sitemap indexes;
2. repository route definitions;
3. internal links returned in first-party HTML;
4. header/footer/navigation links;
5. game/tool/content registries;
6. canonical URLs and known public landing pages.

Use `scripts/discover-public-routes.mjs` as the canonical route-discovery implementation and `scripts/check-public-route-health.mjs` for deterministic HTTP/HTML and asset validation.

Normalize same-origin URLs, remove fragments, deduplicate trailing-slash equivalents, avoid destructive/account-mutation URLs, prevent query/pagination explosions, and preserve meaningful canonical public routes.

## Required Lighthouse categories
Collect and assert:
- Performance;
- Accessibility;
- Best Practices;
- SEO.

Inspect underlying diagnostics and metrics rather than relying only on category numbers.

## 100-score policy
For every category below 100:
1. identify the exact failing audits;
2. separate deterministic first-party causes from third-party/environment causes;
3. repair deterministic first-party causes;
4. rerun the affected page;
5. rerun the representative/full route set after shared changes;
6. document remaining external limitations with evidence.

Never disable a valid Lighthouse audit merely to increase a score, remove meaningful functionality to manipulate a score, claim 100 without report evidence, or accept a new regression because a page remains "high enough."

## Priority order
Fix in this order:
1. broken functionality, failed requests, and missing assets;
2. accessibility blockers;
3. security and Best Practices failures;
4. severe performance/Core Web Vitals risks;
5. SEO/crawlability issues;
6. remaining deterministic deductions;
7. documented third-party/environment limitations.

## Performance review
When Performance is below 100 inspect LCP bottlenecks, layout shift, long tasks/main-thread work, JavaScript execution/unused code, render-blocking resources, image sizing/compression/loading, fonts, caching, TTFB, and third-party script cost. Preserve usability and correctness while optimizing.

## Accessibility review
Lighthouse accessibility is a baseline, not proof of complete accessibility. Pair it with deterministic source/markup checks and human inspection where needed for semantic headings/landmarks, accessible names, form labels/errors, contrast, image alternatives, responsive zoom/reflow, and interactive focus/keyboard behavior during an explicitly authorized final interactive review.

## Best Practices review
Treat browser-reported errors surfaced by Lighthouse, insecure/mixed content, unsafe/deprecated APIs, image quality/aspect findings, and security-related concerns as defects unless evidence proves otherwise.

## SEO review
Check indexability/crawlability, titles/descriptions, canonical URLs, meaningful link text, robots behavior, mobile usability, and status/redirect correctness. Lighthouse SEO is a deterministic technical baseline, not a complete SEO strategy.

## Lighthouse CI
Prefer Lighthouse CI for repeatable collection, assertions, and regression tracking. The expected workflow is:
1. produce the URL manifest;
2. run Lighthouse CI over all URLs or controlled batches;
3. assert category thresholds and critical audits;
4. retain reports as CI artifacts;
5. summarize routes below target;
6. block promotion for unexplained material regressions according to release policy;
7. rerun production verification after deployment.

Install Chrome independently for Lighthouse. Do not make a separate browser automation framework a Lighthouse dependency.

## CI scaling
Manage comprehensive audits with batching/sharding, representative PR checks plus mandatory broader release checks, retained reports, and shared-template regression coverage. Never silently shrink the declared page inventory merely to make CI faster.

## Regression handling
Treat any new category deduction, material metric degradation, newly failing critical audit, newly unauditable route, or unexpected route removal as a regression until explained.

## Production verification
After deployment rebuild the live route inventory, rerun deterministic route/asset checks and Lighthouse against actual production URLs, and record CDN/cache/third-party differences from staging.

## Suggested command
Use repository-defined scripts/config when present. Otherwise use `lhci autorun`. Do not create a competing Lighthouse configuration when the repository already has a canonical one.

## Routine-tool policy
Lighthouse may use its required Chrome runtime, but routine project QA must not install or invoke a separate browser automation framework. An isolated final-release interactive/browser check may be considered only when explicitly requested for that release.

## Completion standard
Lighthouse auditing is complete only when every normalized public route is accounted for, every auditable route has a current result, scores and failing audits are recorded truthfully, deterministic first-party defects are repaired or tracked, no unexplained regression remains, reports are retained where needed, and production is re-audited after production-affecting releases.

## Report format
Report route counts, skipped/failed routes and reasons, score ranges by category, all routes below target, exact failing audits, completed fixes, remaining external blockers, and the next highest-impact optimization.
