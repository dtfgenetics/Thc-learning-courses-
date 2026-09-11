# THC Academy System Architecture

**Status:** Canonical architecture baseline  
**Purpose:** Define the permanent separation between the THC Learning Academy resource library, the THC Learning Hub certification curriculum, and THC Academy credentialing.

## 1. System model

The project has three connected but distinct educational systems.

### THC Learning Academy — comprehensive educational resource library

The THC Learning Academy is the comprehensive knowledge system. It contains **420 Comprehensive Educational Resources** organized across the existing 20 subject domains.

The 420 resources are **not certification courses** and do not each produce a credential. A resource may be a scientific explainer, illustrated guide, diagnostic atlas, interactive tool, calculator, decision tree, reference chart, case study, dataset, research summary, SOP reference, glossary, visual guide, worksheet, or other educational object appropriate to the topic.

Resources provide broad and deep coverage of cultivation, plant science, diagnostics, crop systems, postharvest, genetics, research, quality systems, and related educational content. Certification courses may cite, link to, or assign these resources, but they must not treat the resource catalog itself as the certification curriculum.

### THC Learning Hub — certification curriculum

The THC Learning Hub contains the **purpose-built courses required for THC Academy credentials**.

Certification courses are designed from job tasks and competencies, not by relabeling the 420 resources. Each certification course has its own objectives, instruction, activities, formative assessment, scenarios, practical work, and course-level test.

Certification courses may reuse canonical science from the resource library through references and mapped learning objects. Duplicating and independently rewriting the same scientific claim in multiple courses should be avoided whenever a canonical source object can be reused.

### THC Academy — credentials, assessment, governance, and verification

THC Academy controls the professional credential system: credential definitions, eligibility, competency requirements, secure summative assessments, practical/performance requirements, passing standards, retake rules, issuance, verification, maintenance, appeals, governance, and quality controls.

A course-completion test is not the same as a credential examination. Secure credential item banks, answer keys, alternate forms, scoring rules, psychometric records, and operational exam-security information must not be exposed in public client code or public repositories.

## 2. Controlled credential catalog

The initial professional catalog is limited to **eight professional credentials**.

1. **THC Cultivation Technician I**
   - Routine cultivation execution, observation, measurement, documentation, sanitation, propagation, canopy work, irrigation, scouting, harvest, postharvest, traceability, and escalation.

2. **THC Cultivation Technician II**
   - Verification, interpretation, troubleshooting, reconciliation, advanced crop observation, environmental and root-zone diagnosis, equipment-response checks, production metrics, deviations, and support of junior staff.

3. **THC Plant Health, IPM & Biosecurity Specialist**
   - Systematic scouting, differential diagnosis, nutrient/environment/root-zone disorders, pest and disease identification, IPM planning, biological/cultural controls, quarantine, sanitation, outbreak containment, corrective action, and crop recovery.

4. **THC Environmental, Irrigation & Fertigation Systems Specialist**
   - Environmental measurement and control, lighting and crop measurement, sensors and data quality, water quality, irrigation, fertigation, substrate/root-zone response, dryback, uniformity, automation, equipment reliability, troubleshooting, and system performance.
   - Internal concentrations: **Environmental Controls & Lighting** and **Water, Irrigation & Fertigation**.

5. **THC Propagation & Clean Stock Specialist**
   - Seeds, germination, seedlings, donor/mother plants, cloning, sanitation, rooting, acclimation, transplanting, plant identity, clean stock, pathogen exclusion, and tissue-culture fundamentals.

6. **THC Postharvest Quality Specialist**
   - Harvest readiness, sanitary handling, drying, moisture management, water activity concepts, curing, storage, packaging, defect recognition, lot integrity, traceability, retained samples, deviation response, and postharvest QA.

7. **THC Genetics, Breeding & Preservation Specialist**
   - Genetics, quantitative traits, genotype-by-environment, selection, population design, F1/F2/backcross/selfing concepts, progeny testing, breeding records, controlled pollination, seed production, germplasm preservation, and tissue-culture/preservation concepts.
   - Internal divisions: **Genetics & Selection**, **Breeding Practice**, and **Germplasm & Preservation**.

8. **THC Cultivation Lead & Operations Professional**
   - Production planning, crop scheduling, labor/task coordination, environmental and irrigation oversight, crop-health escalation, harvest forecasting, production KPIs, deviations, root-cause analysis, CAPA, SOPs, document control, change control, quality systems, training verification, incident response, audit readiness, and continuous improvement.

The professional credential count should remain eight until employer/job-task validation demonstrates that an additional standalone credential has clear occupational value.

## 3. Foundational certificates

Two foundational learning certificates may be issued but are not part of the eight professional credentials:

- **THC Safety & Responsible Practice Certificate**
- **THC Cultivation Foundations Certificate**

These establish prerequisite knowledge and may be required for professional credential pathways. They must not be marketed as equivalent in scope to the professional credentials.

## 4. Certification course architecture

Each professional credential receives its own certification curriculum. The initial planning range is approximately **44–60 purpose-built certification courses total**, subject to final job-task and competency analysis.

Do not force every credential to contain the same number of courses. Course boundaries follow instructional and occupational need.

Every certification program follows this hierarchy:

`Credential -> Occupational use case -> Job tasks -> Competencies -> Proficiency requirements -> Required Learning Hub courses -> Learning objectives -> Lessons/activities -> Formative assessment -> Course tests -> Practical/simulation -> Certification blueprint -> Secure certification assessment -> Credential decision -> Issuance/verification -> Maintenance`

## 5. Resource-to-credential mapping

Use persistent competency IDs to connect the resource library and credential programs.

Example:

`COMP-ENV-014 Interpret VPD and environmental trends`

maps to:

- Environmental, Irrigation & Fertigation Systems Specialist
- certification course
- course lesson/objective
- relevant Learning Academy resources
- practice dataset/scenario
- course-level assessment items
- credential examination blueprint domain
- practical/performance requirement

The 420 resources support many pathways. One resource may support multiple certification courses and multiple credentials.

## 6. Assessment separation

Three assessment layers must remain distinct.

### Formative learning assessment

Low-stakes retrieval, practice, feedback, calculations, image interpretation, and scenarios embedded in certification courses.

### Course-level summative assessment

Tests whether a learner met the objectives of one Learning Hub course. Passing a course test does not itself award the professional credential.

### Credential assessment

A separate secure assessment process tied directly to the credential blueprint. Depending on the credential it may include knowledge items, scenarios, calculations, image/data interpretation, practical/simulation tasks, portfolio evidence, or an integrated capstone.

Professional credentials claiming workplace performance must not rely solely on multiple-choice questions.

## 7. Required value-added content across credentials

The following areas must be deliberately represented where occupationally relevant:

### Occupational health and safety

- PPE and hazard communication
- electrical/fire and water/electricity hazards
- compressed gas/CO2 awareness
- heat, humidity, UV/light, noise, slips/falls, ladders, ergonomics
- mold, dust, allergens, biological exposure, and sanitation
- chemical/pesticide safety boundaries
- stop-work and escalation criteria
- emergency response and incident documentation

### Traceability and regulated-workflow literacy

- plant/material identity
- plant/batch/lot genealogy
- movement and disposition records
- destruction/waste documentation concepts
- inventory reconciliation
- discrepancy investigation
- audit preparation
- vendor-neutral seed-to-sale workflow concepts

Jurisdiction-specific laws and platform workflows must be maintained as updateable references rather than frozen into permanent science content.

### Equipment reliability and calibration

- sensor verification and placement
- calibration schedules and records
- irrigation uniformity and flow checks
- filtration and water-treatment maintenance concepts
- alarms and equipment-response checks
- controller/setpoint/hysteresis concepts
- preventive maintenance awareness
- commissioning and recommissioning concepts
- safe maintenance boundaries and escalation

### Production economics and operational performance

The Lead/Operations pathway and relevant advanced courses must include interpretation of:

- yield and quality variance
- crop-loss percentage
- propagation success
- labor productivity
- water, energy, and input use
- room/canopy utilization
- schedule variance
- forecast versus actual production
- environmental/equipment downtime
- quality rejection/rework
- basic cultivation cost-of-production concepts

### Laboratory and quality literacy

Where relevant, instruction should include:

- representative sampling and sampling bias
- COA/result interpretation concepts
- microbial/contaminant and quality-test literacy
- water activity and moisture concepts
- out-of-specification/deviation response
- retained samples
- lot disposition and recall concepts
- limitations and uncertainty of test results

### Leadership and human performance

The Lead/Operations credential must include:

- shift/task planning
- work assignment and handoff
- coaching and feedback
- training verification
- communication under abnormal conditions
- conflict and escalation
- human-error reduction
- decision authority boundaries

### Diagnostic case volume

Plant-health and technician pathways require a substantial case library representing clear, ambiguous, and multi-factor problems. Correct performance includes recognizing uncertainty and requesting/collecting additional evidence when a defensible diagnosis cannot yet be made.

## 8. Optional endorsements

Advanced specialization should normally be added as an endorsement rather than by creating more certifications.

Candidate endorsement areas include:

- Tissue Culture
- Outdoor Production
- Greenhouse Production
- Advanced Crop Steering
- Advanced Lighting
- Automation & Controls
- Living Soil / Biological Systems
- Commercial Hydroponics
- Advanced Diagnostics
- Cannabis Traceability Systems
- Research & Cultivar Trials
- Quality Systems / SOP Administration

An endorsement should require an appropriate prerequisite credential plus additional assessed competency.

## 9. Job-task and employer validation

Before a professional credential is released, its competency model should be validated against the actual work the credential claims to represent.

For each credential:

1. define target role/use case;
2. conduct job-task analysis;
3. rate tasks for importance, frequency, consequence/risk, and expected proficiency;
4. map competencies to tasks;
5. map instruction and assessment to competencies;
6. obtain SME/employer review;
7. revise the blueprint from evidence;
8. record the validation decision and version.

The Academy should not claim employer recognition that has not been earned or documented.

## 10. Course and credential completion gates

A certification course is not complete merely because lesson text exists. Release requires, as applicable:

- measurable objectives;
- authoritative evidence and claim mapping;
- complete instruction;
- activities/practice;
- formative assessment;
- course-level summative assessment;
- required visuals/media with accessibility support;
- practical/scenario mapping;
- instructor/evaluator materials where required;
- technical/science review;
- accessibility review;
- version/release record;
- successful repository validation.

A professional credential additionally requires:

- validated job-task/competency model;
- credential blueprint;
- reviewed active assessment pools;
- practical/performance rubrics;
- defensible passing-standard process;
- assessor requirements;
- retake/remediation policy;
- accommodations and appeals policy;
- credential issuance/verification policy;
- maintenance/renewal rule where appropriate;
- security and audit controls;
- release approval.

## 11. Evidence and science rule

Accuracy overrides content volume.

Claims should be supported by the strongest available evidence appropriate to the claim. Direct cannabis evidence should be identified as such. When established horticultural, plant-science, controlled-environment, pathology, entomology, engineering, or quality-system evidence is transferred to cannabis, the transfer should be explicit rather than represented as direct cannabis proof.

Commercial advice and grower observation may be useful context but must not silently outrank stronger evidence.

Scientific claims should carry traceable source/version information so an evidence change can be mapped to affected resources, lessons, assessments, and credentials.

## 12. Storage and security boundaries

### GitHub

Canonical version-controlled source for:

- architecture
- resource/course/credential metadata
- public curriculum source
- competencies/objectives
- evidence and claim records
- assessment blueprints and public assessment definitions
- schemas/validation tooling
- QA and release records

Do not store production learner identities, production exam attempts/scores, signing secrets, private keys, or operational secure answer pools in the public repository.

### Google Drive / controlled production storage

Reviewer-friendly and production assets may include manuscripts, visual masters, editable worksheets, instructor packets, review copies, exports, and other human-facing production material.

Restricted assessment content must use access controls appropriate to operational exam security. A folder name alone does not constitute an access-control guarantee.

## 13. Accessibility and learner support

Target WCAG 2.2 AA for learner-facing content and assessments. Media require text alternatives or equivalent accessible representations. Assessment accommodations should be governed by policy and preserve the construct being assessed.

## 14. Terminology rule

Use these terms consistently:

- **Comprehensive Educational Resource** — one of the 420 Learning Academy resources.
- **Certification Course** — a structured Learning Hub course designed specifically for a professional credential pathway.
- **Course Test** — assessment of one certification course.
- **Credential Assessment** — secure final assessment process for a professional credential.
- **Foundational Certificate** — completion/attainment certificate below professional credential level.
- **Professional Credential** — one of the eight THC Academy workforce-oriented credentials.
- **Endorsement** — assessed advanced specialization attached to an appropriate credential.

Do not describe the 420-resource catalog as 420 courses.

## 15. Immediate production order

1. Reclassify the existing 420-item catalog as Comprehensive Educational Resources without destroying stable IDs/history.
2. Create a competency and job-task blueprint for each of the eight professional credentials.
3. Design the dedicated Learning Hub course map for each credential.
4. Build course-level assessment specifications separately from credential-exam specifications.
5. Use Cultivation Technician I as the first complete reference implementation.
6. Audit the first comprehensive resource (THC-C001 legacy identifier) and reclassify it under the resource model.
7. Expand secure assessment banks, practicals, simulations, and employer-validation records.
8. Scale only after the reference pathway passes science, instructional-design, assessment, accessibility, and repository QA.
