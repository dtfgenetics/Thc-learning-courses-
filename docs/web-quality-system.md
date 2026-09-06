# DTF Seeds Web Quality System

This repository uses one coordinated web-quality system for source/runtime debugging, browser behavior, pixel-perfect visual QA, accessibility/performance/SEO measurement, and production verification.

## Goals

- Discover every public first-party route on `dtfseeds.com` without crawling destructive or unbounded URLs.
- Detect browser exceptions, console errors, failed first-party requests, broken navigation responses, blank/incomplete rendering, and missing semantic primary content.
- Capture repeatable responsive visual evidence and compare approved stable surfaces pixel-for-pixel.
- Audit Lighthouse Performance, Accessibility, Best Practices, and SEO with a target of 100/100/100/100.
- Preserve artifacts so defects can be reproduced instead of argued from memory.
- Scale across marketing/genetics pages, THC Academy and encyclopedia content, games, tools, dashboards, infographics, document viewers, and future product surfaces.

## Files

- `web-qa.config.mjs` — shared target, route limits, viewport matrix, enforcement and visual modes.
- `scripts/discover-public-routes.mjs` — sitemap plus same-origin rendered-link inventory.
- `playwright.config.mjs` — Chromium projects for 360, 412, 768, 1366, and 1920 pixel widths.
- `tests/web-qa/site-health.spec.mjs` — browser/runtime health checks.
- `tests/web-qa/visual-regression.spec.mjs` — screenshot candidate capture and approved-baseline comparison.
- `lighthouserc.cjs` — per-route Lighthouse collection and 100-score assertions.
- `.github/workflows/web-quality.yml` — PR, staging/main, scheduled, and manual orchestration.

## Local execution

1. `npm ci`
2. `npm run web:qa:install`
3. `npx playwright install --with-deps chromium`
4. `npm run web:routes`
5. `npm run web:qa:health`
6. `npm run web:qa:visual`
7. `npm run web:qa:lighthouse`

`npm run web:qa:install` deliberately uses pinned, no-save packages with `--package-lock=false` so this specialist runtime can execute without creating dependency-lock drift in the curriculum repository. The pinned versions must be reviewed periodically and upgraded intentionally.

## Modes

### Observation

Default PR mode. Existing production defects are reported and retained as evidence while the system is being established. Observation is not approval and must not be described as a pass for pixel-perfect quality.

### Visual candidate capture

`WEB_QA_VISUAL_MODE=capture` saves responsive screenshots into the artifact directory. Candidate screenshots are evidence for review and baseline selection; they are not automatically approved references.

### Visual comparison

`WEB_QA_VISUAL_MODE=compare` uses Playwright screenshot assertions against committed approved baselines. The default comparison policy is zero differing pixels. Non-zero tolerances are allowed only for documented renderer noise and must not hide real defects.

### Enforcement

`WEB_QA_ENFORCE=1` converts browser findings and Lighthouse category deductions into hard failures. Main/manual enforcement should only be treated as trustworthy after the relevant current-state debt is repaired and stable visual baselines are approved.

## Route strategy

Route discovery combines sitemap sources and same-origin links reachable from discovered pages. URLs are normalized, marketing tracking parameters are stripped, destructive paths are excluded, static assets are excluded, fragments are removed, and a maximum route count prevents infinite crawl growth.

The route inventory is a build artifact and should be inspected when counts unexpectedly rise or fall. Future route sources can be added for framework route manifests, game/tool registries, Academy registries, canonical-link maps, or authenticated test fixtures.

## CI scope strategy

Pull requests keep feedback practical: broad desktop health over a bounded route inventory, responsive visual candidates over a smaller representative set, and a bounded Lighthouse sample. Staging/main and scheduled runs expand the route count. This prevents expensive browser audits from slowing unrelated curriculum-only validation while still giving promotion/release work a broad quality gate.

When route counts or runtime grow significantly, shard jobs by route hash/category rather than reducing coverage permanently.

## Baseline approval workflow

1. Generate candidate screenshots in the same CI/browser environment used for future comparisons.
2. Review candidates against the strongest approved design reference and the pixel-perfect skill checklist.
3. Repair visible defects before baseline approval.
4. Commit approved screenshot baselines only after intentional acceptance.
5. Switch protected stable surfaces to compare mode.
6. Review every later baseline diff; never auto-update because a test failed.

Current production is not automatically a correct baseline.

## Surface-specific expansion

### Marketing/genetics/gallery
Add hero, navigation, CTA, product/card grid, imagery, promotional state, and footer snapshots.

### Academy/encyclopedia/certification
Add long-form reading, lesson nav, progress, quizzes, tables, callouts, infographics, download/print controls, and credential-state snapshots.

### Games
Add boot/loading, active play, HUD, touch/keyboard controls, pause, win/loss/game-over, restart, modal/overlay, and responsive/orientation snapshots. Test the core loop, not only the opening screen.

### Tools/forms/dashboards
Add input, validation, loading, results, empty, error, success, filter/menu, dense-data, and mobile stacking states.

### Infographics/print/document viewers
Add thumbnail, full-view, zoom/readability, aspect ratio, resolution, captions, download/print controls, and mobile handling.

## Defect priority

1. Broken functionality, page exceptions, navigation failures, first-party 4xx/5xx, missing assets.
2. Accessibility blockers and unusable controls.
3. Severe visual corruption, overlap, clipping, unreadable content, canvas/HUD collisions.
4. Security/best-practice failures.
5. Performance/Core Web Vitals risks.
6. SEO/crawlability failures.
7. Remaining deterministic visual or Lighthouse deductions.
8. External/third-party limitations with evidence and remediation path.

## Definition of done

A changed customer-facing surface is not complete merely because code merged. Completion requires appropriate source tests, real-browser verification, pixel-perfect evidence for stable visual surfaces, Lighthouse coverage, no unexplained browser/network failures, post-push repository convergence, and production re-verification after release when production is affected.
