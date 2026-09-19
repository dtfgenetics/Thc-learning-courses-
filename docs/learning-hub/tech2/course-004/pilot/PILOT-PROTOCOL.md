# Pilot Protocol — Plant Health, IPM & Biosecurity Troubleshooting

**Course:** `COURSE-LH-TECH2-004`  
**Status:** controlled development protocol; pilot evidence not yet complete  
**Boundary:** this protocol authorizes evidence collection only after the listed entry gates are satisfied. It does **not** establish technical approval, assessment validity, a final cut score, credential eligibility, or release authorization.

## 1. Purpose

Run a controlled learner pilot that tests whether the current course instruction, formative/summative academic assessment, remediation flow, learner assets, and mapped performance evidence function as intended for the target occupational level.

The pilot must preserve the distinction between:
- academic course completion;
- performance/practical evidence;
- future private operational credential assessment; and
- final credential issuance.

## 2. Canonical material freeze

Before enrollment, record one immutable pilot-freeze record containing:
- exact course ID and version: `COURSE-LH-TECH2-004`;
- source commit SHA;
- deployed build ID/source SHA when testing the public learner surface;
- all lesson/module versions used;
- every academic assessment ID/version referenced by the canonical course object/package manifest;
- question/item-bank version or item IDs used for the pilot form;
- practical/rubric/form versions used;
- accessibility accommodation version;
- reviewer approvals that permitted pilot entry.

Do not combine pilot results across materially different course, assessment, practical, rubric, or scoring versions without a documented comparability decision.

## 3. Entry gates

Pilot enrollment may begin only when:
1. technical/curriculum review has no unresolved critical safety or factual defect;
2. assessment review has no known answer-key, scoring, ambiguity, or security defect that would invalidate interpretation;
3. learner-facing accessibility materials and accommodation procedures are available for pilot use;
4. the current deployed learner surface has machine QA tied to an exact build/source SHA when web delivery is part of the pilot;
5. assessors have completed the applicable calibration exercise before collecting scored performance evidence;
6. candidate-facing instructions, timing rules, permitted resources, remediation rules, and data-use notice are frozen for the pilot;
7. secure/private storage exists for learner records, assessor notes, response data, and any operational credential-purpose evidence.

## 4. Academic item pilot

### Planning target

Use **50 usable responses per scored knowledge item** as the default development target and **30 usable responses per item** as the minimum for preliminary item-statistic review, unless an approved prospective course-specific analysis plan sets a different target.

These are evidence-collection targets, not automatic activation thresholds and not final standard-setting rules.

### Capture for every scored item

Record:
- item ID and exact version;
- objective/competency mapping;
- number presented and number answered;
- keyed response;
- difficulty/proportion correct;
- upper/lower or point-biserial discrimination where appropriate;
- distractor selection counts;
- omission/non-response rate;
- median and distribution of response time when available;
- learner comments/confusion flags;
- accessibility/accommodation observations;
- suspected cueing, ambiguity, duplicate-content, or answer-key issues.

Do not activate or retire an operational credential item solely from one statistic. Item decisions require content review plus the planned pilot evidence.

## 5. Course-level learner evidence

Capture:
- enrollments, starts, completions, withdrawals, and usable pilot records;
- lesson/module completion patterns;
- checkpoint and final-assessment attempt counts;
- completion time and unusually long/short sessions;
- remediation triggers and successful/unsuccessful reassessment;
- navigation or content-location failures;
- broken links/assets/downloads;
- learner-reported unclear instructions;
- accessibility barriers and accommodation use;
- technical incidents that could affect score interpretation.

Separate product/runtime defects from learner-performance findings.

## 6. Performance evidence

**Mapped performance evidence:** PRACTICAL-TECH2-D-IPM-TREND-TREATMENT-FOLLOWUP

For each scored practical/simulation/capstone administration, preserve:
- exact practical/rubric/form version;
- scenario/form identifier;
- assessor identity in the private evaluator system;
- candidate/pilot record identifier;
- criterion-level ratings;
- critical-failure observations;
- evidence references and permitted evaluator notes;
- completion time;
- remediation/reassessment status;
- deviations from standard administration;
- accommodations used;
- safety stops or authority-boundary interventions.

Where feasible, double-score a planned subset with independent assessors. Report agreement by criterion and overall using an appropriate statistic for the scale (for example percent agreement plus weighted kappa or ICC where justified). Do not invent a reliability threshold after results are seen.

## 7. Fairness and accessibility evidence

Review results for:
- barriers caused by language, layout, interaction, timing, media, color, zoom/reflow, keyboard use, or assistive technology;
- differential omission or failure patterns that may indicate an unintended barrier;
- accommodation effectiveness;
- tasks that require knowledge/authority beyond the stated occupational level;
- assessment content that rewards undocumented facility-specific practice instead of the controlled learning objective.

Potential fairness findings require human review before any high-stakes interpretation.

## 8. Stop / invalidate criteria

Pause the affected pilot activity and preserve evidence if any of the following occurs:
- safety event or unsafe instruction;
- exposed answer key or compromised secure item;
- materially wrong scoring key/rubric;
- identity/genealogy or record-integrity failure in a practical;
- learner task requiring authority outside the stated role;
- inaccessible required interaction with no equivalent path;
- broken deployment or data-loss condition affecting interpretation;
- unapproved material change after the pilot freeze;
- privacy/security incident involving learner or evaluator data.

A stopped record must not be silently deleted. Mark whether it is excluded, partially usable, or retained only for defect analysis and why.

## 9. Data and privacy boundary

Do not store learner PII, raw response files, private evaluator notes, protected evidence uploads, or secure operational assessment keys in this public curriculum repository.

The public repo may contain only:
- blank templates;
- de-identified aggregates;
- approved summary evidence;
- version references;
- reviewer decisions suitable for public release.

Operational pilot data belongs in the approved private data store with access control, retention, backup, and audit logging.

## 10. Analysis package required after collection

Produce a versioned pilot report containing:
1. material/version freeze;
2. sample and administration summary;
3. usable/excluded record accounting;
4. item statistics and content-review decisions;
5. practical criterion distribution and assessor agreement;
6. timing/completion/remediation results;
7. accessibility/fairness findings;
8. technical/deployment defects;
9. unresolved risks;
10. proposed revisions with traceability to evidence;
11. re-pilot requirements after material changes;
12. explicit statement of what the evidence does **not** yet support.

## 11. Decision boundary

Pilot evidence may support revision, additional review, re-pilot, calibration, and later standard-setting. It does not by itself:
- approve a final passing standard;
- validate a professional credential;
- authorize production credential issuance;
- convert public development items into secure operational credential items;
- replace technical, assessment, accessibility, security/privacy, or release approval.

## 12. Pilot record

Complete these fields only with real evidence:

- Pilot cohort / study ID: **pending**
- Material freeze SHA/version: **pending**
- Pilot dates: **pending**
- Enrolled participants: **pending**
- Usable course records: **pending**
- Usable item responses by item: **pending**
- Practical administrations: **pending**
- Double-scored practical subset: **pending**
- Assessor agreement summary: **pending**
- Accessibility/fairness findings: **pending**
- Critical defects: **pending**
- Revisions required: **pending**
- Re-pilot required: **pending**
- Human approval to advance: **pending**
