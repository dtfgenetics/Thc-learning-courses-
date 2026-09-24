# Structured Job-Task-Analysis Evidence

The public O*NET/BLS occupational baseline gives the two Technician credentials a documented starting point, but it is not a cannabis-specific JTA. The repository now supports a second step: aggregate evidence from actual cannabis cultivation SME/employer ratings.

## Private rating input

Use a private JSON file containing pseudonymous reviewer IDs and one rating for every baseline task family. Each rating includes:

- frequency: 1–5;
- importance: 1–5;
- criticality: 1–5;
- whether the task is essential;
- disposition: `keep`, `adapt`, or `reject`.

The input also records whether a reviewer contributes an employer perspective and/or current cultivation-role perspective. Real names, contact information, employer-confidential notes, and response-level records stay outside the public repository.

Reviewers may also nominate cannabis-specific task families missing from the public baseline.

## Build aggregate JTA evidence

`npm run evidence:build:jta -- --input <PRIVATE-JTA-RATINGS.json> --complete --write`

The aggregate record contains:

- exact credential-program version;
- current public occupational baseline ID/date;
- panel size and perspective counts;
- target population and operating contexts;
- mean frequency, importance and criticality by task family;
- essentiality rate;
- keep/adapt/reject counts and consensus disposition;
- proposed cannabis-specific missing task families.

The builder defaults to at least three usable ratings per baseline task family. If `--complete` is requested but any task family falls below the declared minimum, the record remains `preliminary`.

## Occupational-validation dependency

Occupational-program validation can no longer become `evidence-complete` merely because a reviewer checks a JTA confirmation flag. It must find a current `complete` structured JTA record matching:

- the exact credential program/version;
- the current public occupational-source baseline ID/date.

The occupational evidence then references that JTA record explicitly.

A complete aggregate JTA record still does not approve the credential. It supplies the structured evidence that the program-validation authority reviews together with technical curriculum review, SME/employer scope validation, assessment blueprint review, and practical/capstone validation.
