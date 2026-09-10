# Development Debugger Skill

## Purpose
Use this skill to diagnose, reproduce, repair, and verify source, runtime, route, API, deployment, asset, accessibility, performance, and visual defects in the DTF Seeds repositories and deployed web experience.

## Required QA policy
Routine QA is deterministic and lightweight. Prefer Node-based tests, static/package validation, build checks, API and persistence tests, HTTP/HTML route checks, asset validation, approved-reference image inspection, and Lighthouse.

Do not add a browser automation framework to routine development, repository dependencies, project skills, or CI. A final-release browser check is optional only when explicitly requested for that release and must remain isolated from the normal toolchain.

## Relationship to other skills
- `skills/github-orchestrator/SKILL.md` owns branch, PR, merge, promotion, and repository lifecycle.
- `skills/github-actions-doctor/SKILL.md` owns GitHub Actions diagnosis and CI plumbing.
- `skills/pixel-perfect-visual-qa/SKILL.md` owns visual fidelity and reference comparison.
- `skills/lighthouse-site-auditor/SKILL.md` owns Lighthouse measurement.
- `skills/github-post-push-cleanup/SKILL.md` runs after every repository write.

## Core debugging loop
1. Identify the exact failing commit, route, component, API, game, page, asset, or deployment.
2. Reproduce with the smallest deterministic test practical.
3. Capture concrete evidence: error text, stack trace, HTTP response, failed asset, test output, screenshot/reference mismatch, or Lighthouse audit.
4. Classify the root cause before editing.
5. Repair the causal layer rather than suppressing the symptom.
6. Add the smallest stable regression test that would have caught the defect.
7. Run the narrow test, then the wider relevant suite.
8. For web-facing work, run route/asset health checks and Lighthouse; perform visual-reference review when appearance changed.
9. Push only coherent fixes through the normal branch/PR flow.
10. Run post-push cleanup and verify the newest SHA.

## Failure classes
Classify defects as one or more of:
- syntax/type/module or build error;
- dependency/runtime mismatch;
- route/navigation or broken-link error;
- rendering/hydration/state/interaction defect;
- API/data-shape/auth/session defect;
- persistence/database contract defect;
- responsive/layout/overflow defect;
- visual asset/font/image defect;
- accessibility defect;
- performance/Core Web Vitals defect;
- SEO/metadata/crawlability defect;
- failed first-party request or missing asset;
- caching/CDN/environment mismatch;
- production-vs-source drift;
- flaky or unstable test/dependency.

## Site-wide deterministic route audit
For `https://dtfseeds.com`, build the route inventory from sitemap data, repository routes, server-returned internal links, navigation/footer links, known game/tool/content registries, canonical URLs, and intentional redirects.

Use `scripts/discover-public-routes.mjs` followed by `scripts/check-public-route-health.mjs`.

The deterministic health pass should detect at minimum:
- failed navigation/status responses;
- non-HTML responses where HTML is expected;
- empty or implausibly thin server output;
- missing `main`, `role=main`, or `h1` semantics in server HTML;
- failed first-party image/script/style/source assets;
- accidental public 4xx/5xx routes.

Do not call a page healthy merely because the top-level request returned HTTP 200.

## Lighthouse
Run Lighthouse against the normalized public route inventory. Required categories are Performance, Accessibility, Best Practices, and SEO. The project target is 100 in every category on every audited public page, but results must be reported truthfully. Never disable a valid audit to manufacture a score.

Prioritize repairs in this order:
1. broken functionality, failed requests, and missing assets;
2. accessibility blockers;
3. security/best-practice defects;
4. severe performance/Core Web Vitals risks;
5. SEO/crawlability defects;
6. remaining deterministic Lighthouse deductions;
7. documented third-party/environment limitations.

## Accessibility
Automated checks are a floor. Review semantic landmarks/headings, accessible names, form labels and errors, keyboard/focus behavior when a final interactive check is explicitly authorized, contrast, meaningful image alternatives, and responsive zoom/reflow behavior.

## Visual and responsive QA
Use the strongest approved reference available. Inspect mobile, tablet when relevant, laptop, and wide desktop layouts for clipping, overflow, typography, spacing, image crop/aspect ratio, hidden actions, HUD/canvas collisions, touch targets, and layout shifts.

Use deterministic image comparison or overlay when stable captures are available. Never approve a baseline change solely because a diff exists; understand the changed region first.

## Production verification
When a defect is reported on production:
1. confirm the production symptom with available HTTP, content, asset, Lighthouse, or supplied visual evidence;
2. identify the repository source expected to own it;
3. distinguish source, deployment, cache/CDN, environment, and routing causes;
4. validate the repair on the development/staging target;
5. promote through repository lifecycle;
6. rerun deterministic production route/asset checks and Lighthouse;
7. confirm the deployed version contains the intended fix.

Never assume a merged commit is live merely because GitHub is green.

## Discipline
- Prefer evidence over guesses.
- Do not suppress warnings or failed assertions without proving they are invalid.
- Do not broadly upgrade unrelated dependencies during a focused repair.
- Do not modify generated artifacts by hand when a generator exists.
- Do not replace a failing quality gate with a weaker check merely to get green CI.
- Keep final-release interactive/browser checking separate from routine development unless the user explicitly authorizes it.

## Completion standard
Debugging is complete only when the root cause is identified, the correct layer is repaired, regression coverage exists where practical, relevant deterministic tests pass, web-facing route/asset and Lighthouse checks pass or have explicit findings, the newest pushed SHA is verified, post-push cleanup is complete, and production is rechecked when affected.

## Report format
Report the defect/root cause, files or systems changed, regression coverage added, deterministic route count and findings when relevant, Lighthouse results, remaining blockers, production verification state, and the next highest-priority defect.
