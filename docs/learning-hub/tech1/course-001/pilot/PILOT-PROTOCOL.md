# Course 1 Controlled Pilot Protocol

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Pilot plan:** `PILOTPLAN-LH-TECH1-001`  
**Status:** Draft / preparation only

## Purpose

The Course 1 pilot tests whether the instructional package, formative practice, final course assessment, and integrated practical function as intended with representative learners and assessors before production release.

The pilot is not a certification exam administration and does not award the THC Cultivation Technician I credential.

## Preconditions

Do not open the controlled pilot until:

1. the exact Course 1 version has completed required scientific, editorial, assessment, accessibility, and legal/compliance review for pilot use;
2. known critical review findings are resolved or explicitly accepted for pilot observation;
3. practical assessors have completed the calibration exercise in `../practical/CALIBRATION-PROTOCOL.md`;
4. candidate-facing materials and accommodations have been checked for pilot use;
5. the private results collection location has been designated outside the public repository;
6. pilot participants receive the consent/privacy notice appropriate to the pilot setting.

## Pilot population

Recruit learners reasonably representative of the intended entry-level cultivation-technician audience. Record only the minimum background variables needed to interpret the pilot, using non-identifying categories when possible.

Avoid treating a convenience group of experienced growers, employees from one facility, or the course authors as representative of the final learner population without documenting that limitation.

## Knowledge-assessment evidence target

The internal Course 1 pilot target is **50 usable responses per knowledge item**, with **30 usable responses per item** as the minimum threshold for preliminary item-statistic review.

These values are project planning thresholds, not universal psychometric standards and not evidence by themselves that an item or test is valid. Items below the minimum are marked **insufficient evidence** rather than passed or failed.

The current pilot inventory includes **84 formative items and 36 final course-test items**. The pilot should collect response-level data privately for every item in the exact version being piloted. Participant-level response data must not be committed to GitHub.

The bank is intentionally extensible. If items are added, replaced, retired, or revised before a pilot version is frozen, the pilot plan and analysis should follow that exact version rather than a historical item count.

## Required item-level analysis

Use the existing private-results aggregation pipeline to calculate, where data permit:

- number of usable responses;
- proportion correct;
- point-biserial discrimination;
- distractor selection;
- omit rate;
- median response time;
- response-time anomaly rate;
- challenge history.

Item statistics are diagnostic evidence. No statistic automatically activates, retires, or validates an item.

## Practical pilot

Before candidate pilot use, complete calibration with at least two qualified assessors scoring at least three common standardized performances independently.

For the initial candidate practical pilot, target at least **12 completed candidate performances** across both Form A and Form B. This is an internal operational target for detecting obvious rubric/form problems, not a reliability claim.

For each practical administration, collect:

- form used;
- assessor identifier;
- dimension scores;
- total score;
- critical-error decisions;
- prompts used;
- accommodation used, if any;
- scoring uncertainty or challenge;
- completion time;
- candidate feedback on clarity and accessibility.

## Learner feedback

Administer `PARTICIPANT-FEEDBACK-INSTRUMENT.md` after the instructional and assessment experience. Analyze both scaled responses and open-text comments. Accessibility or safety concerns receive priority regardless of frequency.

## Data handling

Participant-level pilot data are private research/QA records and must stay outside this repository. Repository content may contain only de-identified aggregate evidence objects, approved review records, controlled methods, and non-identifying pilot summaries.

Use pseudonymous participant IDs for analysis. Do not place names, emails, employee IDs, medical information, disability details, or other direct identifiers in repository pilot evidence.

## Analysis sequence

1. Verify data completeness and version identity.
2. Aggregate item statistics using `scripts/build-pilot-evidence-from-results.mjs`.
3. Apply the triage rules in `PILOT-DECISION-RULES.md`.
4. Review every flagged item with assessment and subject-matter reviewers.
5. Review participant comments, timing, accessibility reports, and challenge history.
6. Review practical assessor consistency and form equivalence qualitatively and quantitatively where the sample permits.
7. Record revisions with new object versions when content changes.
8. Re-pilot changed items or practical elements when the change could affect difficulty, meaning, scoring, accessibility, or construct coverage.
9. Conduct standard setting only after the assessment form is stable enough for defensible panel judgment.

## Methodological basis

Course 1 uses classical item-analysis outputs as diagnostics and keeps standard setting as a separate documented judgment process. This follows established assessment-development practice in which item difficulty, discrimination, distractor behavior, reliability, fairness, and standard setting contribute different forms of evidence rather than one statistic serving as proof of validity.

Reference resources:

- NCME, *Planning and Conducting Standard Setting*: https://ncme.org/resources/professional-learning/items/planning-and-conducting-standard-setting/
- NCME, *Setting Passing Scores / Traditional Methods*: https://ncme.org/wp-content/uploads/2025/10/Module-18-Standard-setting-I-Traditional-Methods-1.pdf
- ETS, *Item Analysis*: https://www.ets.org/research/policy_research_reports/publications/chapter/2006/icae.html

## Exit condition

A completed pilot does not automatically release Course 1. Release still requires documented human disposition of pilot findings, approved accessibility/legal/compliance gates, practical calibration evidence, documented standard setting, and final versioned release approval.
