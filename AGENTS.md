# Repository agent guidance

For work involving THC Academy curriculum, occupational roles, course/module/lesson content, question banks, assessments, practicals, simulations, credentials, learner progress, employer-facing credential evidence, or requests to continue/expand the Academy, use the project skill at:

`skills/thc-academy-builder/SKILL.md`

For broad GitHub repository health, branches, pull requests, merges, conflicts, CI/CD, GitHub Actions, failed checks, stale branches, release promotion, repository cleanup, deployment flow, or requests to fix/manage/continue repository work, use:

`skills/github-orchestrator/SKILL.md`

Use specialist GitHub skills when the failure class is clear:

- Application/source/runtime/browser defects, broken pages/routes/features/games/tools, console/network failures, Playwright E2E, responsive QA, broken links, production-vs-source drift, and Lighthouse audits for every discoverable `dtfseeds.com` page: `skills/dev-debugger/SKILL.md`
- GitHub Actions failures, missing/stuck checks, logs, reruns, workflow configuration: `skills/github-actions-doctor/SKILL.md`
- Conflicts, stale branches, wrong PR bases, duplicate/superseded work, difficult merges: `skills/github-branch-pr-surgery/SKILL.md`
- `dev -> staging -> main` promotion, release gates, deployment verification: `skills/github-release-promotion-manager/SKILL.md`

After any push, bot-generated commit, conflict-resolution push, merge, or promotion, immediately run the post-push convergence procedure at:

`skills/github-post-push-cleanup/SKILL.md`

A successful push is not completion. The agent must inspect the newest SHA, CI, PR targeting, mergeability, generated-file drift, review blockers, post-merge target health, and duplicate/superseded work before considering the push cycle complete.

When Academy/product work and repository operations both apply, use the Academy builder for product/content decisions, the GitHub orchestrator for repository execution, the relevant specialist skill for the failure class, and post-push cleanup after every repository write.

For customer-facing web changes, use the development debugger before declaring the work complete. The web quality target is 100 in Lighthouse Performance, Accessibility, Best Practices, and SEO on every audited public page, but valid failures must be repaired or explicitly documented rather than suppressed.

The skills are the project workflow sources of truth. Keep this file short; update the skills/resources instead of duplicating detailed instructions here.
