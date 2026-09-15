# Course 1 Final Human Review Worklist

**Course:** `COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows`  
**Purpose:** final human review control surface for the published academic Course 1 package.  
**Important boundary:** this worklist organizes real human review. It does not create approval evidence, close certification gates, or authorize professional credential issuance.

## Authoritative task source

The authoritative review-task inventory is generated from the current repository objects and versioned review records by:

```bash
npm run review:lh:course1
```

Integrity is checked by:

```bash
npm run review:lh:course1:check
node scripts/audit-course1-review-inventory.mjs
node scripts/audit-course1-objective-coverage.mjs
```

Do not maintain a second hand-edited 166-row task list. The generated queue is authoritative because it expands automatically when valid lessons, assessments, questions, practicals, or versions are added. This document is the durable reviewer index and operating procedure.

## Current minimum review inventory

The current Course 1 package contains the following minimum review workload:

| Review lane | Current tasks | Required reviewer decision |
| --- | ---: | --- |
| Lesson scientific/technical review | 18 | approve or require revision |
| Lesson editorial/instructional review | 18 | approve or require revision; blocked until corresponding scientific review is approved |
| Assessment-definition review | 7 | approve or require revision |
| Scored public knowledge-item review | 120 | approve or require revision |
| Integrated performance-assessment review | 1 | approve or require revision |
| Rendered accessibility review | 1 | approve or require revision |
| Legal/compliance review | 1 | approve or require revision |
| **Current total** | **166** | all required tasks must reach valid human dispositions before final Course 1 approval |

These numbers are a current baseline, not a ceiling. The generated queue must grow when the course grows.

## Review order

### 1. Scientific and technical lesson review

Review all 18 canonical lessons against the current evidence dossier and source set. Confirm:

- factual accuracy;
- safety and authorization boundaries;
- terminology consistency;
- claims are supported at the level stated;
- examples do not overstate jurisdiction-specific requirements as universal rules;
- visuals do not contradict the lesson or source evidence;
- no unsupported diagnosis, repair, pesticide, compliance, or credential claims are introduced.

Record each decision with the controlled lesson ID and exact object version. A scientific approval is required before the corresponding editorial task can be treated as open for approval.

### 2. Editorial and instructional review

For each scientifically approved lesson, confirm:

- the stated learning objective is actually taught;
- explanations are clear enough for the intended Technician I learner;
- worked examples and applied blocks teach the intended decision rule;
- lesson structure, headings, vocabulary, summaries and transitions are coherent;
- duplicate material is purposeful rather than accidental;
- examples and scenarios do not accidentally reveal assessment keys;
- the lesson remains editable and extensible rather than artificially locked to a fixed size.

### 3. Assessment-definition review

Review the six module tests plus the academic Course 1 final for:

- blueprint fit;
- intended purpose and stakes;
- item-count appropriateness;
- objective coverage;
- scoring logic;
- remediation routing;
- separation from the future secure professional credential examination.

The public academic final threshold remains provisional until human review and later standard-setting evidence support a final decision.

### 4. Scored knowledge-item review

Review every current `ITEM-LH-TECH1-001-*` item. For each item confirm:

- one defensible keyed answer;
- distractors are plausible but clearly inferior;
- no trick wording or irrelevant trivia;
- stem and options are understandable without hidden assumptions;
- the item measures its mapped objective;
- evidence supports the keyed reasoning;
- safety/compliance wording is not overbroad;
- the item does not depend on a vendor-specific interface unless the objective explicitly requires it;
- accessibility/readability is acceptable;
- item exposure is acceptable for this **public academic** bank.

Course 1 currently contains 84 module-test items and 36 academic-final items, for 120 scored public items total.

### 5. Integrated performance-assessment review

Review `PRACTICAL-LH-TECH1-001-WORKFLOW` for:

- observable performance criteria;
- assessor instructions;
- critical-error rules;
- evidence capture;
- scoring consistency;
- candidate Form A/B equivalence plan;
- remediation and reassessment boundaries;
- no requirement for an assessor to infer unobservable competence.

Calibration and inter-rater evidence remain separate real human studies and are not closed by this review.

### 6. Rendered accessibility and learner-UX review

Use `accessibility/COURSE1-RENDERED-ACCESSIBILITY-UX-REVIEW.md`. Record browser, device/viewport, assistive technology where used, result, issue reference, reviewer and date. Machine tests are supporting evidence only; the rendered human review must be performed on the deployed learner surface.

### 7. Legal/compliance review

Confirm the public course:

- distinguishes general cultivation practice from jurisdiction-specific legal requirements;
- does not represent training completion as professional certification;
- does not claim accreditation that has not been obtained;
- does not imply public academic tests are the secure credential examination;
- preserves privacy and evidence boundaries for later candidate/credential records;
- uses appropriate safety escalation language without authorizing work outside the Technician I role.

## Recording a review decision

Use the repository review-record tooling rather than editing queue state by hand:

```bash
npm run review:record
```

Each review record must identify:

- reviewed object ID;
- exact object version;
- review type;
- reviewer identity/role according to project governance;
- review date;
- status (`approved` or revision required under the repository schema);
- findings or rationale;
- issue/change reference when revision is required.

A later content-version change must not inherit an earlier version's approval automatically.

## Completion rule

Course 1 can advance to versioned final course approval only when:

1. the generated queue passes structural integrity checks;
2. every required human review task for the candidate course version has a valid disposition;
3. all revision-required findings are resolved and the affected version is re-reviewed;
4. rendered accessibility/manual learner-UX review is completed;
5. the practical has completed the required calibration/equivalence work;
6. controlled pilot evidence is available;
7. formal course standard-setting decisions are recorded;
8. a versioned final approval explicitly identifies the approved Course 1 package.

None of these Course 1 academic approvals substitutes for the separate Technician I professional credential release gates, secure operational exam bank, credential standard setting, issuance workflow approval, or program release approval.
