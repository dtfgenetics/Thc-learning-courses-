# THC Academy Item Bank Review and Activation

The Cultivation Foundations summative blueprint draws five scored items per competency. Production use requires at least 15 active candidates per competency and targets 30 bank items per competency so forms can rotate without repeatedly exposing the same questions.

## Status lifecycle

`draft -> technical-review -> editorial-review -> pilot -> active -> flagged -> retired`

No item moves directly from AI-assisted drafting to `active`.

## Technical / assessment review

Reviewers verify that each item:
- measures the mapped competency and learning objective;
- has one defensible key or scoring rule for its item type;
- is answerable from the approved instructional/evidence scope;
- has plausible distractors without tricks or accidental clues;
- uses an appropriate Bloom level and difficulty label;
- has a rationale that explains why the key is correct;
- cites the evidence supporting the keyed conclusion;
- avoids testing jurisdiction-specific legal claims unless the item is explicitly scoped and reviewed for that jurisdiction.

## Editorial and fairness review

Check plain language, unnecessary reading load, grammatical clues, negative phrasing, cultural assumptions, accessibility, and whether distractors are comparable in length and construction.

## Pilot and activation

Pilot items should collect response statistics before activation where feasible. Track difficulty, discrimination, distractor performance, exposure, flags, and reviewer notes in the runtime assessment system. Items with ambiguous performance or evidence changes move to `flagged` until reviewed.

## Bank-depth gates

The repository reports two separate measures:
- **draft depth**: enough candidate items exist to begin review and pilot work;
- **production depth**: at least the configured minimum number of items are actually `active` for every competency.

Only production depth can satisfy the credential exam's approved-item-pool gate. Candidate count alone is never sufficient.

## Form security

Correct answers and secure production bank contents must not be shipped to a public client. Production form assembly, item version selection, scoring, and attempt records belong on the server/runtime side. Repository fixtures may support development and review, but a public Academy frontend must receive presentation data only.
