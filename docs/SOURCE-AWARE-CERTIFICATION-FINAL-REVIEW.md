# Source-Aware Certification Final Review

The 13 conventional Technician finals already have exact-version human review packets. Those packets now expose the academic/public-source provenance needed to review the keyed reasoning instead of showing only a reference ID.

For every current final item the packet includes:

- exact source ID and title;
- review status and evidence level;
- source type and publisher;
- public URL when recorded;
- source verification timestamp and source revision date when recorded;
- whether the repository classifies the source as authoritative for review;
- item-level source-health counts and unresolved-source warnings.

## Structural source check

Run:

`npm run certification:final-review-packets:source-check`

This fails only on structural item-source problems:

- a current final item has no item-level references; or
- a referenced source ID does not resolve to a repository reference object.

The packet also surfaces softer review concerns such as a source not yet marked reviewed or a current item lacking an authoritative source. The regression suite currently requires every exact current final item to expose at least one authoritative source to the reviewer.

## Human review boundary

Source availability does not automatically approve an assessment item. The reviewer still evaluates:

- whether the current course actually teaches the tested claim;
- whether the source supports the keyed reasoning at the level used;
- whether distractors are plausible without becoming deceptive;
- whether the language is clear, fair and accessible;
- whether role, legal and safety boundaries are correct;
- whether the rationale introduces untaught or unsupported material.

A verified public source can support an item, but it cannot replace exact-version human assessment review, pilot evidence, psychometrics, standard setting or secure-form review.
