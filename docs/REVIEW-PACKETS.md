# Reviewer packets

The review queue identifies what needs review. Reviewer packets make each task self-contained enough to review without manually traversing the repository.

Use `npm run review:packets:check` in CI to verify that every queue task can be resolved into a packet and that all direct evidence references resolve. Use `npm run review:packet -- --object=<ID>` for JSON, or add `--format=markdown` for a human-readable packet.

Each packet contains the queued task state, complete source object, competency/objective traceability, directly relevant claims, evidence metadata, prior version-specific review history, and a lane-specific checklist. Scientific lesson review emphasizes evidence scope and non-universalization of treatment-specific findings. Editorial review remains blocked until scientific approval for the exact lesson version. Assessment packets cover blueprint/security/standard-setting controls, while item packets use the assessment item review rubric.

Packet generation does not approve, promote, activate, publish, or issue anything. Human reviewers must create version-specific review records through the governed review workflow. Draft, technical-review, editorial-review and pilot items remain ineligible for production forms until the required review and activation gates are satisfied.

Examples:

```bash
npm run review:packets:check
npm run review:packet -- --object=LESSON-WATER-001 --format=markdown
npm run review:packet -- --object=ITEM-WATER-009 --format=markdown
node scripts/build-review-packets.mjs --lane=lesson-scientific
```
