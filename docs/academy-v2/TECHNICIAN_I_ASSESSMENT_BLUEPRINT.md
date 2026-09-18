# THC Academy V2 — Cultivation Technician I Assessment Blueprint

## Goal

The Technician I credential should measure whether a learner can perform entry-professional cultivation work, not simply whether they can recall cultivation vocabulary.

The assessment system therefore combines knowledge, interpretation, scenarios, documentation and integrated practical/simulation evidence. This file is a **development blueprint**. It does not authorize a live credential form, final cut score, public operational item bank or professional credential issuance.

## Assessment layers

### Layer 1 — Lesson and unit checks

Use low-stakes checks throughout learning.

Per job-practice unit target:
- 8–12 knowledge/application questions
- at least 2 visual/data interpretation items
- at least 1 decision/escalation scenario
- immediate feedback with reasoning

These are practice and readiness checks, not the primary employment proof and not secure credential items merely because they exist in the public repository.

### Layer 2 — Technician I written/scenario credential blueprint

**Development form target:** 72 scored items.

Target mix:
- 15% foundational knowledge
- 25% applied interpretation/calculation
- 45% scenarios and troubleshooting/escalation decisions
- 15% documentation/SOP/sequence questions

Avoid building the credential assessment as 72 fact-recall questions.

Suggested development task weighting:

| Task area | Items/form | Emphasis |
|---|---:|---|
| Safety | 7 | hazards, PPE, escalation |
| Sanitation/biosecurity | 7 | contamination pathways, controlled workflow |
| Crop observation | 5 | normal/abnormal observation |
| Environment | 6 | sensor/VPD interpretation |
| Water/pH/EC | 6 | measurements and data interpretation |
| Irrigation | 6 | SOP execution and delivery problems |
| IPM scouting | 7 | observation, documentation, escalation |
| Propagation | 5 | workflow, sanitation, identity |
| Canopy work | 5 | sequencing, plant response, sanitation |
| Harvest | 5 | workflow, identity, traceability |
| Postharvest | 5 | environment, handling, quality risks |
| Records/SOPs | 8 | documentation, deviations, handoff |
| **Total** | **72** | |

These weights are provisional until human occupational/assessment review and formal blueprint finalization. Safety, sanitation, IPM and records are intentionally prominent because errors can affect workers, crop integrity, compliance, quality or an entire facility.

## Secure item-bank production target

Initial development target: **300 high-quality Technician I items** before operational form construction and pilot/review pruning.

Recommended development distribution:
- Safety: 30
- Sanitation/biosecurity: 30
- Crop observation: 20
- Environment: 25
- Water/pH/EC: 25
- Irrigation: 25
- IPM scouting: 30
- Propagation: 20
- Canopy work: 20
- Harvest: 20
- Postharvest: 25
- Records/SOPs: 30

The **operational secure item bank must live in an approved private assessment store**. Public `ITEM-*` files are curriculum/development material and must not be promoted into live credential forms. Equivalent forms require controlled private item/form IDs, revisions and exposure history under `docs/academy-v2/credential/tech1/SECURE-ASSESSMENT-STORE-CONTRACT.md` and `EQUIVALENT-SECURE-FORM-RULES.md`.

## Required item types

The development bank should contain:

1. **Foundational multiple choice** — terminology/principles needed for safe work.
2. **Visual identification** — crop condition, pest/damage indicator, equipment or workflow image.
3. **Data interpretation** — temperature/RH/VPD, pH/EC, dry-room data, root-zone observations.
4. **Calculation** — simple conversions or cultivation calculations appropriate to Technician I.
5. **Sequence/order** — sanitation, propagation, irrigation, harvest and record workflows.
6. **Scenario** — choose the best routine action or escalation.
7. **Multiple response** — identify all relevant observations or hazards.
8. **Documentation** — identify complete/incomplete/incorrect record entries.
9. **Case set** — multiple questions from one realistic room/work-order scenario.

## Item-writing rules

- Ask about decisions a technician might actually make.
- Avoid trivia that does not change work quality.
- Do not use joke distractors.
- Wrong answers should reflect believable grower/technician mistakes.
- Avoid artificial absolutes when cultivation depends on context.
- State units clearly.
- Include enough context to make the question answerable without guessing undocumented facility policy.
- When a facility-specific SOP would control the answer, frame the question around following the supplied SOP rather than inventing a universal rule.
- Explanations should teach why the correct choice is best and why major distractors fail.
- Keep treatment selection, technical repair/bypass, product release and other out-of-scope decisions outside Technician I unless the scenario is explicitly testing the requirement to stop/escalate.

## Layer 3 — Integrated practical/simulation assessments

Six integrated practicals cover the Technician I task domains under the controlled development plan `registry/technician-i-integrated-lab-plan.json`.

### Practical A — Safe room entry and crop inspection

Candidate must:
- identify hazards
- select appropriate PPE from supplied requirements
- follow entry sanitation steps
- inspect crop images/room zones
- read environmental values
- record observations
- identify conditions requiring escalation

### Practical B — Water and irrigation shift

Candidate must:
- inspect/use a simulated meter workflow
- interpret pH and EC readings in context
- review irrigation work order
- identify delivery issue(s)
- describe/perform correct routine response
- record the event

### Practical C — IPM scouting

Candidate must:
- follow a scouting route
- inspect supplied plant/trap images
- distinguish observations from unsupported diagnosis
- document location/severity
- select escalation/quarantine action from supplied procedure
- avoid unauthorized pesticide/treatment selection

### Practical D — Propagation station

Candidate must:
- set up a clean work area
- preserve plant/lot identity
- sequence routine cloning/seedling steps
- recognize sanitation errors
- complete propagation records

### Practical E — Canopy work order

Candidate must:
- interpret work instructions
- choose correct task sequence
- identify plants/areas that should not be worked without escalation
- apply sanitation between work areas
- document completed work

### Practical F — Harvest-to-postharvest handoff

Candidate must:
- verify harvest/batch identity
- sequence harvest handling
- maintain source-to-output genealogy
- identify contamination/quality risks and holds
- interpret dry-room conditions
- reconcile required quantities without falsifying evidence
- complete transfer/handoff records

Each Practical A–F is currently a 100-point development blueprint with a provisional target of 80. These are not final validated cut scores.

## Practical scoring model

Use task-specific scoring categories in each controlled practical document. Common dimensions across the set include:

- safety and PPE
- sanitation/biosecurity
- procedure/SOP execution
- observation accuracy
- data interpretation
- plant/batch identity protection
- quality protection
- documentation accuracy
- escalation judgment
- task completion

Where a four-point rubric is used for development or calibration, the anchors may be:

0 — not demonstrated / unsafe / materially incorrect  
1 — partial, requires substantial prompting  
2 — competent development-level routine execution  
3 — strong, accurate and efficient execution

Operational rubric anchors require evaluator training, pilot/calibration evidence and approval before credential use.

## Development credential decision concept

The controlled development architecture currently requires:

- meeting the provisional written/scenario standard when the secure operational assessment is eventually approved;
- required Practicals A–F completed under approved criteria;
- integrated capstone completed under approved criteria;
- required documentation/evidence submitted;
- **no unresolved credential-blocking critical failure**.

The five controlled development critical-failure classes are:

1. `CF-SAFETY-001` — knowingly continue through an unresolved serious/life-safety hazard when stop/emergency procedure is required;
2. `CF-IDENTITY-001` — knowingly move, merge, relabel or transform material after an unresolved identity conflict in a way that breaks genealogy;
3. `CF-INTEGRITY-001` — falsify, overwrite or force a measurement, count, weight or record to hide a discrepancy;
4. `CF-AUTHORITY-001` — perform unauthorized pesticide/treatment selection, technical repair/bypass or product-release decision outside Technician I authority;
5. `CF-HOLD-001` — knowingly move or release material from an active contamination/quality hold without required authorization.

An aggregate score does not erase a controlled critical failure. The affected evidence remains blocked pending remediation and reevaluation under the approved final policy.

All percentages, weights, targets and critical-failure decision rules remain **development/provisional** until human validation and formal standard setting. An 80% target is not scientific evidence of a valid external cut score.

## Capstone — One Cultivation Shift

After the six practicals, use the integrated capstone simulation as the strongest cross-domain performance artifact.

The learner receives a controlled form containing the approved equivalent-form surface details, such as:
- facility map and supplied SOP extracts
- shift notes
- room assignments
- environment dashboard
- plant/crop evidence
- irrigation work order and readings
- scouting findings
- harvest/postharvest transfer task
- one or more deviations/dynamic events

Outputs include:
- prioritized task list
- observation/scouting record
- environmental/irrigation response
- deviation/escalation decision
- traceability/reconciliation evidence
- completed work log
- end-of-shift handoff

The current capstone blueprint is 200 points with a provisional 160-point development target. The controlled domain weights, critical-failure rules and form controls live in `registry/technician-i-integrated-lab-plan.json` and `docs/academy-v2/practicals/CAPSTONE-TECH1-ONE-CULTIVATION-SHIFT.md`.

## Form security and equivalence

Practice/readiness surfaces may expose feedback according to the lab plan. Live credential forms must:

- be generated from the approved private secure bank;
- use equivalent controlled forms rather than public-item reuse or simple option shuffling;
- expose no answer hints during credential administration;
- preserve the approved competency/domain blueprint;
- retain form/item revisions and exposure history privately;
- remain unavailable while `liveCredentialFormApproved` and program release gates are false/unapproved.

## Question and performance traceability

Every question should map to:

`JTA domain/job task -> competency -> proficiency -> learning content -> item`

Every practical criterion should map to:

`JTA domain/job task -> expected behavior -> observable evidence -> scoring criterion`

The controlling machine-readable occupational crosswalk is `registry/technician-i-jta-competency-crosswalk.json`.

## Release boundary

This blueprint can support content production, review and pilot preparation. It **cannot** by itself close:

- JTA SME/employer validation;
- technical/curriculum review;
- assessment review;
- accessibility approval;
- practical/capstone validation;
- evaluator calibration/inter-rater evidence;
- private secure-bank/store approval;
- equivalent-form evidence;
- standard setting/final decision rules;
- privacy/security approval;
- final professional credential release authorization.
