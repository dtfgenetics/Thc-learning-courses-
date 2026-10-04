# Certification Final Assessment Review Packets

The 13 conventional certification finals already have a machine-generated exact-version review queue. This workflow adds reviewer-facing packets so the remaining human assessment review does not require manually collecting item files.

Commands:

- npm run certification:final-review-packets
- npm run certification:final-review-packets:json
- npm run certification:final-review-packets:write
- npm run certification:final-review-packets:test

Each generated packet contains the current final definition/version, blueprint, current item versions, stem, choices, answer key, rationale, competency/objective mapping, evidence references, current review state, and exact create-review-record.mjs commands for recording decisions.

These are internal review packets because they contain answer keys and rationales. They are not learner-facing artifacts and must not be published as course content.

Approval remains exact-version locked. Any later change to a final or item version requires fresh review evidence for that changed object.
