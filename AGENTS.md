# Repository agent guidance

For work involving THC Academy curriculum, occupational roles, course/module/lesson content, question banks, assessments, practicals, simulations, credentials, learner progress, employer-facing credential evidence, or requests to continue/expand the Academy, use:

`skills/thc-academy-builder/SKILL.md`

For broad GitHub repository health, branches, pull requests, merges, conflicts, CI/CD, GitHub Actions, failed checks, stale branches, release promotion, repository cleanup, deployment flow, or requests to fix/manage/continue repository work, use:

`skills/github-orchestrator/SKILL.md`

Ordinary work must reach `dev` through a feature/content/fix/chore branch and pull request. Do not push ordinary commits directly to `dev`, `staging`, or `main`, even when server-side branch protection is absent. Direct integration-branch writes are reserved only for an explicitly documented emergency repair when the normal PR path is impossible; immediately run post-push cleanup and record the exception.

Use specialist skills when the failure class is clear:

- Application/source/runtime defects, broken pages/routes/features/games/tools, production-vs-source drift, deterministic route/asset checks, and end-to-end debugging coordination: `skills/dev-debugger/SKILL.md`
- Pixel-perfect visual fidelity, reference/image-diff validation, spacing/typography/alignment, responsive composition, visual state coverage, and design-system consistency: `skills/pixel-perfect-visual-qa/SKILL.md`
- Lighthouse CI, performance/accessibility/best-practices/SEO auditing, and every discoverable public `dtfseeds.com` page: `skills/lighthouse-site-auditor/SKILL.md`
- GitHub Actions failures, missing/stuck checks, logs, reruns, workflow configuration: `skills/github-actions-doctor/SKILL.md`
- Conflicts, stale branches, wrong PR bases, duplicate/superseded work, difficult merges: `skills/github-branch-pr-surgery/SKILL.md`
- `dev -> staging -> main` promotion, release gates, deployment verification: `skills/github-release-promotion-manager/SKILL.md`

After any push, bot-generated commit, conflict-resolution push, merge, or promotion, immediately run:

`skills/github-post-push-cleanup/SKILL.md`

A successful push is not completion. Inspect the newest SHA, CI, PR targeting, mergeability, generated-file drift, review blockers, post-merge target health, and duplicate/superseded work before considering the push cycle complete.

## QA policy

Routine development and repository QA must use deterministic Node-based tests, static route/package validation, build/runtime checks, targeted API/persistence tests, reference-image inspection where applicable, and Lighthouse. Do not add a browser automation framework to routine development, CI, project skills, or dependencies.

A final-release browser check may be considered only when explicitly requested for that release. It must remain isolated from the normal toolchain and must not become a required dependency or routine workflow.

For customer-facing web changes, use the development debugger before declaring work complete. Run deterministic route/asset validation, use Pixel-Perfect Visual QA against the strongest approved reference, and use Lighthouse for site-wide quality measurement. The target remains 100 in Lighthouse Performance, Accessibility, Best Practices, and SEO on every audited public page; valid failures must be repaired or explicitly documented rather than suppressed.

The skills are the project workflow sources of truth. Keep this file short; update the skills/resources instead of duplicating detailed instructions here.
