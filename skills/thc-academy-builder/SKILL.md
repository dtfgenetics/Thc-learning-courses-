# THC Academy Builder

Use this workflow for THC Academy curriculum, occupational roles, courses, modules, lessons, assessments, practicals, simulations, credentials, employer-facing evidence, learner progress, and requests to continue or expand Academy work.

## 1. Resume before branching

Before creating any branch or PR:
1. inspect open Academy PRs and their head branches;
2. identify the active unfinished milestone;
3. continue on that branch when it is still the correct integration point;
4. fetch the branch head immediately before each write;
5. if another actor advances the branch, preserve that commit and reapply your work onto the new head;
6. never force-push merely to recover from concurrent work.

Create a new branch only for a genuinely separate milestone or when the current PR is no longer an appropriate integration point.

## 2. Architecture source of truth

Maintain the alignment chain:

`occupation → role → job task → competency → learning objective → lesson/activity → knowledge assessment + performance assessment → evidence → credential`

Use the THC Knowledge Base for canonical science, Academy lessons for instruction, assessments for measurement, and credentials only for claims supported by defined evidence.

## 3. Employment-credential standard

For employment-facing credentials, do not rely on a multiple-choice final alone. Require three evidence layers where appropriate:
- knowledge: understands the underlying concepts and SOP rationale;
- application: diagnoses, prioritizes, or decides from realistic evidence;
- performance: executes or demonstrates the job task safely and correctly.

Performance assessments should be standardized, scored with explicit rubrics, preserve role boundaries, and define critical errors that cannot be offset by a high total score.

## 4. Content object discipline

Prefer existing content types and schemas. Before adding a new object type:
1. inspect `content/`, `schemas/`, validation scripts, and registry behavior;
2. confirm the existing schema cannot represent the object without distortion;
3. add a dedicated schema and validator when the object has materially different semantics.

Do not force hands-on practicals into the item-bank exam schema.

## 5. Practical-assessment design

Every credential-bearing practical or capstone should define:
- stable ID and version;
- target occupational role;
- mapped job tasks and competencies;
- permitted delivery modes;
- candidate evidence outputs;
- scoring domains and total points;
- criterion-referenced passing rule;
- non-compensable critical errors;
- source specification/document;
- explicit escalation and authorization boundaries.

Use realistic ambiguity. Include incomplete, conflicting, or low-quality evidence where the job requires data-quality judgment. Do not reward unsupported certainty.

## 6. Safety and legal boundaries

Keep the Academy educational and job-competency focused. Practical scenarios may teach legal cultivation operations, SOP use, PPE, sanitation, biosecurity, regulated recordkeeping, quality systems, and escalation. Do not imply a learner is authorized to perform a regulated action merely because a course describes it. Pesticide application, electrical/pressure-system repair, product release/disposition, and other controlled actions must stay inside stated role and jurisdictional boundaries.

## 7. Quality gates

Before considering a curriculum increment complete:
- schema validation passes;
- curriculum cross-references resolve;
- occupational role/task references resolve;
- performance-assessment references and scoring totals validate;
- registry and existing release checks remain green;
- no credential claims exceed the evidence actually assessed;
- learner-facing and employer-facing wording distinguish certificates of learning from independent personnel certification where applicable.

## 8. Concurrent GitHub work

For any write batch:
1. read current branch head and tree;
2. prepare a cohesive tree rather than many tiny commits when practical;
3. create the commit with the current head as parent;
4. update the existing branch ref with `force=false`;
5. if the ref moved, fetch the new head, rebuild the tree on that head, and commit again;
6. verify PR head and CI after the update.

Do not replace another actor's changes, rewrite shared history, or open duplicate PRs to avoid reconciliation.

## 9. Definition of done for an Academy milestone

A milestone is not done merely because prose exists. It is done when the required source objects, schemas, validation, instructional content, assessments, practical evidence, credential mappings, and delivery/runtime surfaces needed by that milestone are internally consistent and verifiable.
