# Repository agent guidance

For work involving THC Academy curriculum, occupational roles, course/module/lesson content, question banks, assessments, practicals, simulations, credentials, learner progress, employer-facing credential evidence, or requests to continue/expand the Academy, use the project skill at:

`skills/thc-academy-builder/SKILL.md`

For work involving GitHub repository health, branches, pull requests, merges, conflicts, CI/CD, GitHub Actions, failed checks, stale branches, release promotion, repository cleanup, deployment flow, or broad requests to fix/manage/continue repository work, use:

`skills/github-orchestrator/SKILL.md`

After any push, bot-generated commit, conflict-resolution push, merge, or promotion, immediately run the post-push convergence procedure at:

`skills/github-post-push-cleanup/SKILL.md`

A successful push is not completion. The agent must inspect the newest SHA, CI, PR targeting, mergeability, generated-file drift, review blockers, post-merge target health, and duplicate/superseded work before considering the push cycle complete.

When Academy/product work and repository operations both apply, use the Academy builder for product/content decisions, the GitHub orchestrator for repository execution, and post-push cleanup after every repository write.

The skills are the project workflow sources of truth. Keep this file short; update the skills/resources instead of duplicating detailed instructions here.
