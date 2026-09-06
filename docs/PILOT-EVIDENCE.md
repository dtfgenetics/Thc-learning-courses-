# Assessment pilot evidence

Assessment items must not move from development into production solely because they look correct during authoring review. Pilot evidence captures how an item actually performs with learners before activation.

Pilot records live in `content/pilot-evidence/` and are version-specific to an immutable assessment item version. The model records sample size, percent correct, discrimination, distractor selection, omit rate, median response time, response-time anomaly rate, challenge history, analyst identity and completion time.

The statistics are **diagnostic evidence, not automatic approval thresholds**. This repository does not invent universal psychometric cut scores for item acceptance. Assessment reviewers interpret the statistics together with content quality, evidence alignment, security, accessibility and challenge history.

Promotion rules enforced by `npm run pilot:validate`:

- an item in `pilot` status must have a pilot evidence record for that exact version;
- an `active` item must have at least one `complete` pilot evidence record for that exact version;
- an `active` item must also have an approved assessment review record;
- draft, technical-review, editorial-review and pilot items remain unavailable to production exam generation;
- invalidated pilot records never satisfy the activation gate.

A complete pilot record requires observed response statistics and a valid completion timestamp. The schema intentionally permits a `draft` record with incomplete/null statistics so a pilot can be registered before data collection begins.
