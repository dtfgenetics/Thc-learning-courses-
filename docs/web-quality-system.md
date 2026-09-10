# DTF Seeds Web Quality System

This repository uses a coordinated, deterministic web-quality system for source/runtime debugging, route and asset health, visual fidelity, accessibility/performance/SEO measurement, and production verification.

## Goals

- Discover every public first-party route on `dtfseeds.com` without crawling destructive or unbounded URLs.
- Detect navigation failures, unexpected non-HTML responses, blank/incomplete server output, missing semantic primary content, and broken first-party assets.
- Compare customer-facing surfaces against approved visual references with deterministic image-diff or overlay methods when stable captures are available.
- Audit Lighthouse Performance, Accessibility, Best Practices, and SEO with a target of 100/100/100/100.
- Preserve artifacts so defects can be reproduced from evidence.
- Keep routine QA lightweight enough to run frequently across Academy, genetics pages, games, tools, dashboards, infographics, and future surfaces.

## Routine QA policy

Routine development, CI, project skills, and repository dependencies use deterministic Node/static/build/API/persistence/HTTP/HTML checks plus Lighthouse. A separate browser automation framework is not part of the normal toolchain.

An interactive browser check may be considered only as an isolated final-release verification when explicitly requested for that release. It must not become a repository dependency, project skill, or normal CI requirement.

## Files

- `web-qa.config.mjs` — shared target, route limits, artifact locations, and enforcement mode.
- `scripts/discover-public-routes.mjs` — sitemap plus same-origin server-returned link inventory.
- `scripts/check-public-route-health.mjs` — deterministic HTTP/HTML, semantic-content, and first-party asset validation.
- `lighthouserc.cjs` — per-route Lighthouse collection and category assertions.
- `.github/workflows/web-quality.yml` — deterministic health and Lighthouse orchestration for PRs, staging/main, scheduled, and manual runs.
- `scripts/check-routine-qa-policy.mjs` — fail-closed guard preventing the removed browser-automation toolchain from being reintroduced into routine project files.

## Local execution

1. `npm ci`
2. `npm run web:qa:install`
3. `npm run web:routes`
4. `npm run web:qa:health`
5. `npm run web:qa:lighthouse`

`npm run web:qa:install` installs only the pinned Lighthouse CI runtime without changing the dependency lock. Chrome required by Lighthouse should be installed independently by the environment or CI workflow.

## Modes

### Observation

During active repair, findings may be collected without making every current production defect a hard failure. Observation is evidence collection, not approval.

### Deterministic health enforcement

`WEB_QA_ENFORCE=1` converts route-health findings into failures. The health checker validates navigation responses, expected HTML, meaningful server content, primary semantics, and first-party assets.

### Lighthouse enforcement

Lighthouse assertions remain independent of route-health checks. Category deductions and critical audits must be reported truthfully. Never suppress a valid audit merely to manufacture a perfect score.

### Visual-reference review

Approved screenshots, mockups, or known-good renders may be compared using deterministic image-diff or overlay tools. Baselines are accepted only after intentional review; current production is not automatically a correct baseline.

## Route strategy

Route discovery combines sitemap sources and same-origin links returned by discovered HTML pages. URLs are normalized, tracking parameters are stripped, destructive paths and static assets are excluded, fragments are removed, and a maximum route count prevents unbounded crawl growth.

The route inventory is a build artifact and should be inspected when counts unexpectedly rise or fall. Additional deterministic sources may include framework route manifests, game/tool registries, Academy registries, canonical-link maps, and controlled authenticated fixtures.

## CI scope strategy

Pull requests use bounded deterministic route-health and Lighthouse coverage for practical feedback. Staging/main and scheduled runs expand route counts. When route counts grow significantly, shard jobs by route hash or product category rather than permanently reducing declared coverage.

The curriculum quality workflow also runs the routine-QA policy guard so prohibited browser-automation dependencies, configs, skills, or stale references fail before the rest of certification validation proceeds.

## Visual baseline workflow

1. Obtain a stable current render or approved supplied reference using an authorized rendering path.
2. Review it against the strongest approved design reference and the pixel-perfect skill checklist.
3. Repair visible defects before accepting it as a baseline.
4. Store only intentionally approved reference evidence.
5. Compare later stable captures using deterministic image diff or overlay.
6. Investigate every changed region before approving a baseline update.

Do not auto-approve a changed baseline because a comparison failed.

## Surface-specific expansion

### Marketing/genetics/gallery
Review hero, navigation, CTA, product/card grids, imagery, promotional states, and footer composition.

### Academy/encyclopedia/certification
Review long-form reading surfaces, lesson navigation, progress, quizzes, tables, callouts, infographics, download/print controls, and credential states.

### Games
Review boot/loading, active play, HUD, controls, pause, win/loss/game-over, restart, modal/overlay, and responsive/orientation states. Validate the underlying game loop through deterministic game/state tests wherever practical rather than relying on opening-screen appearance.

### Tools/forms/dashboards
Review input, validation, loading, result, empty, error, success, filtering, dense-data, and mobile stacking states.

### Infographics/print/document viewers
Review thumbnails, full-view readability, aspect ratio, resolution, captions, download/print controls, and mobile handling.

## Defect priority

1. Broken functionality, navigation failures, first-party 4xx/5xx, and missing assets.
2. Accessibility blockers and unusable controls.
3. Severe visual corruption, overlap, clipping, unreadable content, or canvas/HUD collisions.
4. Security/Best Practices failures.
5. Performance/Core Web Vitals risks.
6. SEO/crawlability failures.
7. Remaining deterministic visual or Lighthouse deductions.
8. External/third-party limitations with evidence and a remediation path.

## Definition of done

A changed customer-facing surface is not complete merely because code merged. Completion requires the relevant source/unit/build/API tests, deterministic route and asset validation, appropriate approved-reference visual evidence, Lighthouse coverage, post-push repository convergence, and production re-verification after release when production is affected. An isolated final interactive browser check is optional only when explicitly requested for that release.
