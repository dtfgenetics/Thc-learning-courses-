# Form-Level Psychometric Evidence

Item statistics are not enough to understand how a complete certification form behaves. The repository now supports **aggregate, de-identified form-level pilot evidence** for each conventional final.

The builder accepts a private participant-level response file and writes only aggregate evidence. Participant IDs and item-response rows are never copied into repository evidence.

## Private input shape

The private file contains:

- exact course and final assessment IDs;
- an opaque form ID and revision;
- a pilot cohort ID;
- an analyst-defined minimum sample size for reliability estimation;
- whether reliability should be computed;
- optional candidate/provisional cut scores for classification-impact analysis;
- pseudonymous participant rows with duration and one boolean correctness result for every current item.

## Generated evidence

The aggregate record includes:

- exact course/final versions and item count;
- sample size;
- mean, median, standard deviation, minimum and maximum score;
- 10-point score histogram;
- median, 90th-percentile, minimum and maximum completion time;
- pass/fail counts and pass rate for each supplied cut score;
- KR-20 reliability only when requested and when the analyst-specified minimum usable sample is met.

Reliability has three explicit states:

- `computed`
- `insufficient-data`
- `not-computed`

The system never invents a reliability coefficient for a small or degenerate sample. A computed coefficient is descriptive pilot evidence, not automatic authorization of the form or the credential.

## Commands

- `npm run psychometrics:form:build -- --input <PRIVATE-RESULTS.json> [--complete] [--write]`
- `npm run psychometrics:form:validate`
- `npm run psychometrics:form:readiness`
- `npm run psychometrics:form:test`

Cut-score analyses must label their source. A configured provisional score or sensitivity cut remains non-authoritative until formal standard setting/governance adopts a production decision.
