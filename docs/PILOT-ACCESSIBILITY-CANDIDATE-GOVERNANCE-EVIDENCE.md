# Pilot, Accessibility, and Candidate Governance Evidence

## Purpose

This layer standardizes three remaining evidence areas that were previously represented mostly by prepared packets, protocols, or manual gate flags:

- course-level pilot execution;
- rendered accessibility and learner-UX human review;
- candidate governance approval.

## Course pilot execution

The 15 pilot protocols remain the execution instructions. A pilot is not complete merely because a protocol exists.

A course-level pilot execution record must be pinned to the exact current course version and record cohort/participant scope, current-version knowledge evidence where required, performance execution where required, fairness/accessibility review, learner feedback, data-quality review, stop criteria, and final human decision state.

## Rendered accessibility / UX review

The repository already contains 15/15 human review packets. Evidence records are separate from those packets.

A completed review record must identify the exact course version and deployed build, target WCAG 2.2 AA, record multiple environments, cover the learner-facing course surface, and show zero unresolved Level A/AA failures before approval.

Automated tests and packet presence remain support evidence only.

## Candidate governance approval

The current candidate governance controls intentionally leave unresolved policy decisions unset. Approval records are version-locked to the controls registry and must explicitly approve:

- program, assessment, accessibility, privacy/legal, security and organizational governance;
- final attempt policy;
- retest waiting-period policy;
- fee policy;
- full retention schedule.

This prevents null/unapproved policy values from silently becoming operational rules.

## Commands

- `npm run pilot-execution:validate`
- `npm run accessibility-review:validate`
- `npm run candidate-governance:approval:validate`
- `npm run certification:human-evidence:readiness`

The certification reconciler derives pilot and accessibility gates from these exact-version records. Candidate-governance approval is a prerequisite for credential authorization.
