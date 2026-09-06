---
name: thc-academy-builder
description: Build, expand, audit, repair, and ship the THC / Teaching Healthy Cultivation Academy as an employment-oriented cannabis cultivation education and credential ecosystem. Use for curriculum, occupational roles, competencies, lessons, question banks, practicals, simulations, credentials, learner/employer workflows, repo integration, or broad requests such as "continue the THC Academy work".
---

# THC Academy Builder

## Mission

Build THC Academy into a rigorous, useful cannabis cultivation education and workforce-credential system. Optimize for what learners can understand and demonstrate, and for what employers can verify—not for raw page, course, quiz, or certificate counts.

The operating chain is:

`Occupation -> Job Role -> Job Task -> Competency -> Required Proficiency -> Learning Objective -> Instruction -> Practice -> Assessment -> Performance Evidence -> Credential -> Employment Use`

Read `resources/project-scope.md` when scope, credential ladder, or system boundaries matter. Read `resources/repo-map.md` before repository changes. Read `resources/production-standards.md` before creating content, questions, practicals, or credentials. Read `resources/continuation-protocol.md` for broad "continue", "next", "keep working", audit, or recovery requests.

## Core operating principles

1. **Build aggressively.** Create the needed content, questions, assessments, practicals, simulations, credentials, schemas, runtime support, and documentation. Accreditation and external review are quality targets, not default blockers to production.
2. **Reuse canonical knowledge.** Search existing courses, modules, lessons, competencies, claims, references, encyclopedia entries, and advanced tracks before creating parallel science content.
3. **Add the missing job layer.** Existing science often needs workplace application: work orders, measurements, records, scenarios, troubleshooting, practicals, portfolio evidence, and proficiency evidence.
4. **Prefer competence over completion.** Important credentials should show what the learner can do, not only what they watched or read.
5. **Keep role boundaries meaningful.** Technician I executes and escalates. Technician II verifies, interprets, and troubleshoots. Lead coordinates and coaches. Operations roles design/manage systems. Specialists deepen technical domains.
6. **Do not create bureaucracy for its own sake.** Enforce structural integrity, valid mappings, useful tests, and truthful credential claims. Do not invent approval gates that prevent content creation.
7. **Do not duplicate branches or work.** Resume the relevant open branch/PR when one exists. Do not create `-v2`, `-v3`, `-temp`, or replacement branches merely because work is difficult or CI changed.
8. **Finish coherent milestones.** Prefer a complete role/course/assessment slice over many half-created objects.
9. **Keep source and runtime aligned.** When adding IDs or object types, update schemas, registries, validators, generators, APIs/UI, and tests where required.
10. **State facts at the right confidence.** Evidence-backed science should be clear; emerging or context-dependent claims should not be presented as universal cultivation laws.

## Start every task by establishing current state

Before editing:

1. Inspect `main`, relevant open PRs/issues, and the most likely active branch.
2. Read the nearest project direction, curriculum map, production plan, or registry related to the requested area.
3. Search for existing objects before inventing IDs or content.
4. Check whether automation or another agent has recently moved the branch.
5. Determine the smallest coherent milestone that advances the project substantially.

If the user says only "continue", "next", "keep working", or equivalent, do **not** ask what they mean when repository state reveals the answer. Follow `resources/continuation-protocol.md`.

## Work selection order

When several needs are available, prefer this order unless the current milestone dictates otherwise:

1. repair broken mappings/tests that block the active workstream;
2. finish an already-started role/course/credential slice;
3. create missing instructional/job-practice units;
4. expand question/scenario banks to target density;
5. create practical assessments and rubrics;
6. create capstone/simulation cases;
7. wire credential eligibility, transcript, portfolio, and public verification;
8. add learner/employer UX;
9. expand specialist or next-level credentials;
10. improve evidence, visuals, accessibility, analytics, accreditation mapping, and external-recognition material in parallel.

Do not stop after writing a plan if repository writes are available and the requested work can be implemented.

## Curriculum workflow

For a new or incomplete credential/role:

1. Define or verify the occupation/job role and role boundary.
2. Define job tasks with competency and proficiency mappings.
3. Reuse existing courses and science wherever possible.
4. Create a curriculum map showing reuse vs upgrade vs new content.
5. Create a machine-readable production plan.
6. Build job-practice units that connect science to real work.
7. Build the assessment bank in batches.
8. Build integrated practicals.
9. Build a capstone when the credential represents integrated performance.
10. Define portfolio artifacts and competency transcript output.
11. Wire credential requirements and runtime behavior.
12. Run validation, update the PR, and merge a complete milestone before opening the next dependent branch when practical.

## Content workflow

When writing a job-practice unit or lesson, connect the learner to realistic work. Favor:

- why the skill matters;
- role and authorization boundary;
- prerequisite retrieval;
- measurable objectives;
- evidence-linked science;
- measurements and data quality;
- worked examples;
- common mistakes/misconceptions;
- guided practice;
- decision/troubleshooting scenarios;
- calculations or data interpretation where useful;
- documentation/traceability exercise;
- practical or simulation mapping;
- portfolio evidence;
- summary and next-step retrieval.

Do not turn every lesson into an identical template. Use only the elements that improve learning.

## Question-bank workflow

Questions should map to an existing competency and objective whenever possible.

Prefer credible distractors based on common cultivation errors. Avoid trivia, jokes, arbitrary universal target numbers, and questions answered by superficial keyword matching.

Difficulty progression:

- Foundations: understand/apply;
- Technician I: apply plus routine operational scenarios;
- Technician II: apply/analyze/evaluate, data quality, troubleshooting, next-test selection;
- Specialist/Lead: deeper diagnosis, design tradeoffs, prioritization, QA, system interactions, and decision justification.

For employment credentials, create enough items for randomized forms; never design the entire credential around one fixed test.

## Practical and simulation workflow

For performance-relevant competencies, create practical evidence rather than relying only on recall questions.

A practical should define:

- scenario/work order;
- supplied evidence/data;
- actions or decisions required;
- records the candidate must produce;
- scoring criteria/rubric;
- critical errors where appropriate;
- allowed delivery modes: simulation, supervised lab, and/or approved workplace equivalent;
- portfolio artifact;
- linked tasks/competencies/proficiency.

Capstones should integrate multiple systems and require prioritization, documentation, and handoff—not simply repeat isolated practicals.

## Credential workflow

A credential should communicate:

- role or technical capability;
- required competencies and proficiency levels;
- knowledge/scenario assessment requirements;
- practical/performance requirements where appropriate;
- capstone/practicum requirements where appropriate;
- portfolio/evidence outputs;
- credential ID/version/status;
- public verification information;
- what the credential does **not** authorize or license when relevant.

Use "certificate" or role-oriented internal credential language for Academy education/assessment. Do not claim government licensure, ANAB accreditation, or independent personnel certification unless actually granted.

## Research workflow

Use current external research when it materially improves occupational relevance, standards alignment, scientific accuracy, current job requirements, competitor comparison, or regulatory context.

Research should feed production. Convert findings into one or more of:

- job-task/competency updates;
- curriculum gaps;
- lesson briefs;
- question/scenario briefs;
- practical/capstone cases;
- employer-facing mappings;
- evidence/reference objects;
- standards/accreditation crosswalks.

Do not let research become an endless prerequisite to creating useful content.

## Repository workflow

Follow `resources/repo-map.md`.

Branch discipline:

- use one branch per coherent milestone;
- resume an existing relevant branch/PR;
- merge completed milestones before creating dependent work when practical;
- never force-overwrite bot/agent work just to avoid reconciling it;
- if the generated curriculum registry bot moves the branch, rebase/recreate the new commit on the bot head rather than force pushing;
- keep PR descriptions updated as scope grows;
- coordinate active IDs and object names through issue/PR comments when parallel agents are working.

## Validation

Use targeted checks during development and `npm test` before merging major architecture/runtime changes when feasible.

Minimum targeted checks for content/occupational work usually include:

```bash
npm run schema:validate
npm run validate
npm run occupational:validate
npm run registry:validate
```

When question IDs are added and automation has not already synchronized them:

```bash
npm run registry:build
npm run registry:validate
```

Use the relevant assessment, credential, Academy web, accessibility, runtime, API, persistence, staging, or production checks when those systems are changed. The full command inventory is in `resources/repo-map.md` and `package.json`.

## Definition of done for a milestone

A milestone is not done merely because files were created. Confirm:

- IDs are unique;
- references resolve;
- existing canonical content was reused where appropriate;
- role/course/credential mappings are coherent;
- question and practical coverage matches the intended proficiency;
- registries are synchronized;
- relevant tests pass or any failure is clearly identified and repaired if within scope;
- PR description reflects the actual current scope;
- parallel-agent handoffs are updated when needed;
- completed PRs are merged rather than abandoned;
- the next workstream starts from the merged source of truth.

## Avoid these failure modes

- planning repeatedly instead of implementing;
- creating duplicate courses because existing content was not searched;
- treating more pages as progress when instruction/assessment is missing;
- fixed-answer memorization as a credential strategy;
- universal cultivation claims without context/evidence;
- creating a new branch to escape merge conflicts;
- force-pushing over registry automation;
- adding governance gates that stop ordinary content development;
- calling Academy certificates externally accredited or licensed without basis;
- leaving a finished milestone in an unmerged branch while starting its successor.

## User-facing progress

For substantial work, report concrete progress: what was created/fixed, current counts/coverage, tests/CI result, branch/PR/merge state, and the next implementation block. Keep updates concise and continue doing the work rather than asking permission for each obvious next step.
