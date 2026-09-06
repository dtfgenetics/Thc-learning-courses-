# THC Academy V2 — Project Direction

Status: project direction / architecture baseline

## 1. North-star outcome

THC Academy will become a workforce-oriented cannabis cultivation education and credential ecosystem whose credentials are useful to employers because they provide transparent, verifiable evidence of role-specific competence.

The Academy must not optimize for course count, lesson count, quiz count, or certificate count. It must optimize for:

- scientific accuracy and traceable evidence;
- occupational relevance;
- measurable competency;
- demonstrated application and performance;
- safety and compliance literacy;
- employer validation;
- assessment validity and reliability;
- accessible instruction;
- verifiable portable credentials;
- continuous improvement based on evidence and employment outcomes.

A learner should leave with more than a completion certificate. The system should be able to answer an employer's questions:

1. What can this person do?
2. At what proficiency level?
3. How was that competence assessed?
4. Which evidence and standards support the curriculum?
5. Was performance demonstrated or only knowledge tested?
6. Is the credential authentic and current?
7. What additional training or workplace authorization is still required?

## 2. Credential terminology

THC Academy will maintain a strict distinction between education certificates and professional personnel certification.

### Near-term

Issue assessment-based THC Academy Certificates and role-oriented stackable credentials tied to THC Academy education and assessment.

### Long-term

If the organization later develops an independently governed personnel-certification scheme, treat that as a separate certification system designed against the current ISO/IEC 17024 framework. Do not market ordinary course-completion credentials as independent professional certification.

Cannabis certificate-program design should be benchmarked against ASTM D8403 and the ANAB Cannabis Certificate Accreditation Program requirements. Accreditation must never be claimed unless formally granted.

## 3. Core system architecture

THC Academy V2 consists of nine connected systems.

### A. Knowledge Base

Canonical scientific and technical truth layer.

Objects include:
- encyclopedia entries;
- glossary terms;
- scientific claims;
- references;
- evidence-strength records;
- limitations and applicability statements;
- diagrams, photographs and infographics;
- SOP reference material;
- equipment and measurement concepts.

Rule: the knowledge base states what is currently supported. Course lessons should teach from these objects rather than duplicating independent factual copies wherever practical.

### B. Occupational Competency System

Defines what workers in cultivation-related roles are expected to know and perform.

Objects include:
- occupations;
- job roles;
- job tasks;
- competency domains;
- competencies;
- proficiency levels;
- safety-critical competencies;
- task frequency;
- task importance;
- consequence-of-error ratings;
- prerequisite relationships;
- employer validation records.

### C. Curriculum / Academy

Transforms competencies into instruction.

Hierarchy:

Program -> Credential Path -> Course -> Module -> Lesson -> Activity -> Practice/Scenario/Lab -> Formative Assessment -> Summative Assessment -> Capstone/Practicum where required.

### D. Assessment System

Measures knowledge, application and performance.

Assessment types should include:
- knowledge items;
- calculation/data interpretation;
- diagnostic scenarios;
- image-based identification;
- SOP sequencing;
- simulated work tasks;
- rubric-scored practical activities;
- capstones;
- workplace/practicum evaluations.

### E. Simulation / Virtual Cultivation Facility

A legal, repeatable environment for demonstrating job-relevant decisions when real workplace access is unavailable.

Initial simulated work areas:
- propagation;
- vegetative production;
- flowering;
- irrigation/fertigation;
- environmental controls;
- IPM and biosecurity;
- harvest;
- drying/curing;
- quality assurance;
- seed-to-sale/compliance workflows;
- sanitation and safety;
- shift handoff and documentation.

### F. Work-Based Learning

Supports real or simulated workplace learning, competency verification, internships and employer practicums.

Design the work-based learning model with ASTM E3416 as a benchmark.

### G. Credential System

Issues, verifies and displays credentials and competency transcripts.

Credential output should support:
- credential ID;
- issuer identity;
- holder identity protections;
- issue date;
- version;
- current/expired/revoked state;
- credential requirements;
- demonstrated competencies;
- proficiency levels;
- assessment types completed;
- verification URL/QR;
- evidence/portfolio references where appropriate;
- renewal/continuing-education requirements when applicable.

Plan for interoperable digital credentials such as Open Badges 3.0 and longitudinal learner records such as CLR 2.0. Competency interoperability can later map to CASE where useful.

### H. Employer / Workforce System

Connects the Academy to actual employment.

Objects/processes include:
- Employer Advisory Council;
- employer competency validations;
- job-task studies;
- employer partners;
- internships/practicums;
- employer-recognized credential mappings;
- job-role crosswalks;
- hiring partner directory;
- graduate talent profiles with learner consent;
- placement and advancement outcomes.

### I. Quality, Governance and Accreditation System

Controls scientific, instructional, assessment, accessibility, legal/safety and credential quality.

Includes:
- curriculum review;
- evidence review;
- assessment review;
- accessibility review;
- legal/safety review;
- psychometric review;
- standard-setting;
- version control;
- appeals/complaints policy;
- conflicts-of-interest controls;
- certificate-use policy;
- credential revocation policy;
- records/document control;
- quality-improvement records;
- accreditation-readiness evidence.

## 4. Target credential ladder

The initial architecture should support role-recognizable credentials rather than many vaguely named certificates.

### Entry and core

- THC Academy Orientation / Safety & Responsible Practice
- THC Cultivation Foundations Certificate
- THC Cultivation Technician I
- THC Cultivation Technician II

### Specialist credentials

- THC Environmental Controls Specialist
- THC Lighting & Crop Measurement Specialist
- THC Irrigation & Fertigation Specialist
- THC Root-Zone & Substrate Specialist
- THC Plant Nutrition & Diagnostics Specialist
- THC IPM & Biosecurity Specialist
- THC Propagation Specialist
- THC Canopy & Flowering Specialist
- THC Postharvest Quality Specialist
- THC Genetics & Breeding Specialist
- THC Outdoor & Greenhouse Specialist
- THC Cultivation SOP & Quality Systems Specialist

### Advanced / integrated

- THC Cultivation Lead
- THC Cultivation Operations Professional
- THC Cultivation Systems Professional
- THC Cultivation Science Advanced Certificate

Names are working titles until validated by employers and credential-governance review.

## 5. Proficiency model

Competencies should record demonstrated level rather than a binary complete/incomplete state.

Recommended scale:

1. Awareness — recognizes terminology, hazards and basic concepts.
2. Foundational — explains the principle and standard workflow.
3. Applied — uses the competency correctly in routine situations.
4. Operational — performs the task reliably under defined workplace conditions.
5. Diagnostic — troubleshoots abnormal conditions and justifies decisions.
6. Lead — plans, verifies, improves and can coach others within defined scope.

Each credential defines the required level for every included competency.

## 6. Required occupational scope

Plant-science content remains the scientific core, but employment credentials must also measure professional operations.

Cross-cutting domains to add or strengthen:

- occupational safety;
- PPE and hazard communication;
- electrical/light/UV awareness;
- CO2 and compressed-gas awareness;
- chemical/pesticide safety and scope limitations;
- sanitation;
- biosecurity;
- allergen/microbial/particulate awareness;
- SOP literacy;
- documentation and data integrity;
- traceability;
- quality assurance;
- deviation/nonconformance handling;
- calibration and measurement discipline;
- equipment checks;
- production metrics/KPIs;
- crop scouting;
- shift handoff;
- teamwork and escalation;
- inventory concepts;
- seed-to-sale/compliance workflow literacy;
- legal/jurisdiction awareness;
- research and evidence literacy;
- professional ethics;
- continuous improvement.

The system must clearly distinguish education from activities that require jurisdiction-specific licenses, pesticide credentials, workplace authorization or regulatory training.

## 7. Foundations V2 curriculum direction

The current scientific Foundations domains remain valuable. Add a prerequisite/foundation layer and strengthen workplace application throughout.

Recommended sequence:

00. Safety, Responsibility, Workplace Practice & Legal Literacy
01. Plant Biology & Crop Observation
02. Environmental Management
03. Light & Photobiology
04. Water Science & Irrigation Fundamentals
05. Root-Zone & Substrate Science
06. Mineral Nutrition
07. IPM & Biosecurity
08. Propagation
09. Canopy Management
10. Flowering & Reproductive Development
11. Harvest, Postharvest & Quality
12. Genetics & Phenotypic Variation
13. SOPs, Documentation, Traceability & Quality Systems

A future Technician credential should add applied production workflow content beyond the academic Foundations certificate.

## 8. Lesson V2 standard

Lessons should no longer be primarily reading objects.

Every substantive lesson should be capable of containing:

- purpose / why this matters on the job;
- prerequisites;
- measurable learning objectives;
- prior-knowledge retrieval;
- core explanation;
- vocabulary;
- evidence-linked claims;
- figures/photographs/infographics;
- accessible captions and alternatives;
- worked examples;
- misconceptions/common errors;
- guided practice;
- decision scenario;
- calculation/data exercise where relevant;
- workplace/SOP connection;
- safety/compliance note where relevant;
- formative knowledge check;
- reasoning/explanation prompt;
- practical/lab/simulation activity;
- summary;
- spaced-retrieval/review object;
- further reading;
- source/evidence disclosure.

Not every field must appear in every lesson, but schemas must support them as first-class objects.

## 9. Alignment rule

The platform must validate the complete instructional chain:

Occupation/Role -> Job Task -> Competency -> Required Proficiency -> Learning Objective -> Lesson Content -> Learning Activity -> Practice -> Formative Assessment -> Summative/Performance Assessment -> Credential Requirement.

Release gates should detect:
- orphan competencies;
- objectives that are not taught;
- objectives that are not assessed;
- assessment items outside the taught scope;
- credential competencies with no valid evidence of achievement;
- practical competencies measured only by recall questions;
- safety-critical competencies without independent mastery requirements.

## 10. Job-task analysis methodology

Create a repeatable occupational-analysis process.

For each target job:

1. Collect current job descriptions and employer interviews.
2. Normalize tasks into a controlled taxonomy.
3. Ask qualified SMEs/employers to rate each task for frequency, importance and consequence of error.
4. Determine minimum proficiency level.
5. Identify safety-critical tasks.
6. Map tasks to competencies.
7. Derive curriculum and assessment coverage from those mappings.
8. Revalidate periodically as technology, regulation and cultivation practice changes.

Exam blueprints should not use equal weighting solely for convenience. Weighting should be defensible based on occupational relevance, risk and cognitive/performance demands.

## 11. Assessment-science direction

### Knowledge assessment

Maintain secure, versioned item banks mapped to competency/objective/evidence.

### Applied assessment

Add scenarios containing realistic environmental, plant, irrigation, IPM, quality and operational data.

### Performance assessment

Use simulations, practical demonstrations or workplace observation with standardized rubrics.

### Standard setting

Before a high-stakes credential is released, replace arbitrary pass-score selection with a documented criterion-referenced standard-setting process involving qualified SMEs and pilot data.

### Psychometrics

Track at minimum:
- item difficulty;
- item discrimination;
- distractor performance;
- assessment reliability;
- standard error where appropriate;
- domain performance;
- fairness/accessibility indicators;
- candidate feedback;
- practical-rubric inter-rater consistency;
- version-to-version comparability.

### Safety gates

Safety-critical competencies may require independent mastery and cannot be averaged away by strong performance in unrelated domains.

## 12. Evidence model

Claims should support structured metadata such as:

Claim -> Sources -> Evidence Strength -> Limitations -> Species/Genotype -> Plant Stage -> Growing Context -> Applicability -> Last Reviewed -> Reviewer.

Working evidence hierarchy:

A. systematic reviews, authoritative standards and major scientific references;
B. controlled peer-reviewed plant/CEA/horticultural research;
C. controlled cannabis-specific peer-reviewed research;
D. university/extension/government technical guidance;
E. documented expert consensus;
F. emerging evidence or grower observation, clearly labeled and never presented as settled science.

## 13. Visual and media system

Infographics and media become curriculum objects rather than loosely placed files.

Asset metadata should support:
- asset ID;
- title;
- type;
- learning purpose;
- linked competency/objective/lesson;
- caption;
- alt text;
- transcript where relevant;
- evidence/source references;
- revision/version;
- accessibility alternative;
- review status;
- download/publication state.

Planned asset types:
- academic diagrams;
- annotated photographs;
- process diagrams;
- equipment diagrams;
- decision trees;
- data visualizations;
- symptom comparison sets;
- interactive diagrams;
- simulations;
- short demonstrations;
- printable field guides;
- job aids.

## 14. Accessibility and instructional-quality baseline

Target WCAG 2.2 AA for learner-facing web experiences and use UDL principles during content design rather than treating accessibility only as a final test.

Benchmark course-review quality against the current Quality Matters Continuing and Professional Education framework while maintaining THC-specific scientific, workforce and credential requirements.

## 15. Employer validation and prestige strategy

Prestige must be earned through external trust signals.

Build an Employer Advisory Council containing representative expertise such as:
- cultivation directors/managers;
- propagation leads;
- irrigation/fertigation specialists;
- environmental-control/CEA specialists;
- IPM professionals;
- QA/compliance staff;
- postharvest staff;
- plant scientists/horticulturists;
- plant pathology/entomology expertise;
- recruiters/HR/talent leaders;
- licensed operators of different scales and production models.

The Council should validate:
- occupational profiles;
- competencies;
- proficiency requirements;
- assessment realism;
- credential names;
- internship/practicum expectations;
- hiring relevance.

Create a published employer-validation methodology and revision history.

## 16. Learner employment layer

THC Academy should eventually provide:
- resume-ready verified credentials;
- competency transcript;
- learner portfolio;
- role-readiness report;
- job-role crosswalk;
- optional employer-facing profile;
- internship/practicum matching;
- employer network;
- interview preparation based on demonstrated skills;
- continuing-education recommendations;
- alumni credential renewal/upgrade paths.

Do not promise employment. Track and publish evidence-based placement/advancement outcomes when enough valid data exists.

## 17. Accreditation / standards roadmap

### Immediate design benchmarks

- ASTM D8403 — cannabis/hemp certificate programs;
- ASTM E2659 — certificate program quality;
- ASTM E3416 — competency-based work-based learning;
- WCAG 2.2 AA;
- current Quality Matters CPE framework;
- Open Badges 3.0 / CLR 2.0 interoperability planning.

### Later opportunities

- ANAB Cannabis Certificate Accreditation Program gap analysis and application when eligible;
- Credential Engine / CTDL publication;
- partnerships/articulation with colleges, universities and employers;
- independent personnel certification architecture aligned with ISO/IEC 17024 only if governance and resources justify it.

## 18. Repository domain-model changes

Do not rewrite the existing validation/release architecture. Expand it.

### Existing objects to extend

program
course
module
lesson
learning-objective
competency
assessment
question
credential
review
pilot-evidence
claim/reference
issued-credential

### New candidate object types

occupation
job-role
job-task
proficiency-level or proficiency requirement
competency-profile
employer-validation
advisory-council-record
activity
scenario
simulation
practical-assessment
assessment-rubric
performance-observation
capstone
practicum
work-based-experience
portfolio-artifact
asset/media
accreditation-requirement
accreditation-evidence
standard-mapping
credential-path
credential-renewal
continuing-education-unit
appeal/complaint record schema where appropriate
quality-improvement-action
job-role-crosswalk
employment-outcome aggregate

Exact boundaries should be chosen to avoid unnecessary schema fragmentation.

## 19. Program schema V2 requirements

The existing program schema only identifies courses. V2 should be able to express:

- program purpose;
- target learner;
- target occupations/roles;
- prerequisite requirements;
- credential paths;
- required competencies and proficiency levels;
- required courses/modules;
- required practical activities;
- required assessments;
- capstone/practicum requirements;
- safety-critical requirements;
- total expected learning effort;
- completion policy;
- credential outcomes;
- standards/accreditation mappings;
- review/version metadata;
- learner support/accessibility requirements.

## 20. Credential schema V2 requirements

The existing credential schema is primarily course + assessments + passing score. V2 should support:

- credential type;
- credential scope;
- issuing program/path;
- occupational/job-role mappings;
- competency and proficiency requirements;
- prerequisite credentials;
- required knowledge assessments;
- required applied assessments;
- required performance assessments;
- required practicum/work evidence;
- safety-critical mastery rules;
- standard-setting method/version;
- renewal/expiration rules;
- continuing education;
- status/revocation rules;
- portfolio/evidence policy;
- public verification fields;
- digital credential metadata;
- standards/accreditation mappings.

## 21. Release gates to add

The existing CI/release gate system is a major asset. Add new gates rather than bypassing it.

Required future checks should include:
- occupational mapping completeness;
- competency/objective/activity/assessment alignment;
- safety-critical coverage;
- performance-evidence requirements;
- assessment blueprint validity;
- standard-setting readiness;
- practical-rubric readiness;
- employer-validation status;
- accreditation-evidence coverage;
- asset/accessibility completeness;
- credential-transparency completeness;
- work-based-learning readiness;
- public verification integrity;
- expired evidence/reference review dates;
- unresolved scientific or assessment review blockers.

## 22. Major workstreams

WS01 — Governance, terminology and quality policy
WS02 — Occupational research and job-task analysis
WS03 — Employer Advisory Council and employer validation
WS04 — Competency/proficiency architecture
WS05 — Safety, responsibility and professional operations
WS06 — Knowledge-base/evidence architecture
WS07 — Lesson/instructional design V2
WS08 — Media/infographic/visual asset architecture
WS09 — Assessment blueprint and item-bank science
WS10 — Practical, scenario and simulation assessment
WS11 — Virtual Cultivation Facility
WS12 — Work-based learning / internships / practicums
WS13 — Credential ladder and digital verification
WS14 — Accreditation/standards gap analysis
WS15 — Learner experience, accessibility and support
WS16 — Employer/talent network and portfolio system
WS17 — Analytics, psychometrics and outcomes
WS18 — College/university articulation and external partnerships
WS19 — Platform/API/data/security implementation
WS20 — Publication, operations and continuous improvement

## 23. Execution phases

### Phase 0 — Direction lock

Create the project charter, terminology policy, quality principles, standards register and architecture decision records.

Exit gate: project north star, vocabulary and scope are stable enough for parallel implementation.

### Phase 1 — Occupational foundation

Build target occupations, job-role taxonomy, job-task library, proficiency system and preliminary employer-review process.

Exit gate: Foundations and Technician I can be traced to real job tasks.

### Phase 2 — Schema and validation V2

Extend domain schemas and validators for occupational mappings, activities, practical evidence, credential paths, assets and standards mappings.

Exit gate: new content cannot bypass alignment and quality rules.

### Phase 3 — Foundations migration

Migrate current Foundations into V2. Add Safety/Professional Practice and SOP/Documentation/Quality content. Convert existing lessons into active instructional sequences without losing approved evidence.

Exit gate: Foundations V2 meets the new lesson, alignment, accessibility and evidence requirements.

### Phase 4 — Assessment V2

Rebuild blueprint weighting from occupational analysis. Add scenarios, calculations, diagnostic items, rubrics and safety-critical mastery rules. Begin formal pilot/standard-setting workflow.

Exit gate: assessment measures more than recall and has a defensible validation plan.

### Phase 5 — Technician I pilot

Create the first truly employment-oriented credential with simulation/practical tasks and competency transcript.

Exit gate: external SMEs/employers can review exactly what a passing learner demonstrated.

### Phase 6 — Credential interoperability and public verification

Upgrade public verification, competency transcript and portable badge/record metadata.

Exit gate: an employer can independently verify the credential and understand its requirements.

### Phase 7 — Employer and work-based-learning pilot

Recruit a small employer cohort. Pilot practicums/work observations and compare employer ratings to Academy assessment results.

Exit gate: evidence exists that the credential corresponds to workplace performance.

### Phase 8 — Accreditation readiness

Complete formal ASTM D8403/E2659 gap analysis, close documentation/process gaps, and make an evidence-backed decision about ANAB application.

Exit gate: accreditation application is either justified and ready or blockers are explicitly documented.

### Phase 9 — Specialist and advanced stack

Build specialist credentials using the validated framework rather than inventing separate architectures.

### Phase 10 — External recognition expansion

Pursue employer recognition, articulation/CE relationships, Credential Engine publication, work-based-learning expansion and later independent certification feasibility.

## 24. Immediate implementation backlog

The first implementation batch should NOT mass-produce new lessons.

Create these foundations first:

1. V2 project charter and terminology policy.
2. Standards/accreditation requirement registry.
3. Occupation/job-role/job-task schemas.
4. Competency proficiency and safety-critical extensions.
5. Program schema V2.
6. Credential schema V2.
7. Lesson/activity/practical/media schema extensions.
8. Full alignment validator.
9. Job-task analysis templates and scoring method.
10. Employer validation record/template.
11. ASTM D8403/E2659 accreditation gap matrix.
12. Foundations V2 curriculum map including Modules 00 and 13.
13. Technician I role profile and preliminary competency matrix.
14. Assessment blueprint V2 specification.
15. Practical/simulation rubric model.
16. Credential transparency/public verification specification.
17. New CI gates and readiness reports.
18. Documentation telling future agents/Codex how to modify curriculum without bypassing the model.

## 25. Codex / agent execution rules

When Codex or other coding agents work on this repository:

- inspect current schemas and validators before adding parallel structures;
- extend canonical objects instead of creating duplicate shadow systems;
- preserve stable IDs when meaning remains the same;
- add migrations when schemas change;
- update validators and tests in the same change as schema changes;
- never lower validation strictness simply to make content pass;
- never publish draft credentials as production-ready;
- never claim accreditation or regulatory approval without verified evidence;
- keep answer keys and secure assessment material out of public learner clients;
- require traceability for scientific claims;
- require accessibility metadata for instructional media;
- require occupational mapping for employment-oriented credentials;
- require performance evidence for competencies labeled Operational, Diagnostic or Lead unless a documented exception exists;
- keep safety-critical mastery rules fail-closed;
- run the repository's full test/release readiness chain before merge;
- prefer small, reviewable PRs grouped by workstream;
- add architecture decision records for consequential model changes.

## 26. ChatGPT Work execution role

Use Work for research-heavy and cross-system tasks such as:

- collecting and normalizing job descriptions;
- maintaining competitor and credential benchmarks;
- building accreditation gap matrices;
- compiling evidence packs;
- drafting SME/employer review packets;
- producing occupational task inventories;
- checking curriculum coverage against job tasks;
- auditing lesson/media accessibility;
- aggregating pilot and employer feedback;
- preparing partnership and advisory-council materials.

Codex should handle repository implementation, validators, schemas, tests, API/runtime work and deterministic transformations.

## 27. Definition of a prestigious THC credential

A THC employment credential is not considered mature merely because its course is complete.

A mature credential should have documented evidence that:

- the occupational role is defined;
- job tasks were researched;
- competencies were validated by appropriate SMEs/employers;
- curriculum covers those competencies;
- learning objectives align to assessment;
- scientific claims are traceable;
- accessibility requirements are met;
- the assessment blueprint is defensible;
- the passing standard is criterion-referenced;
- knowledge and application are assessed;
- relevant practical/performance competencies are demonstrated;
- safety-critical competencies require independent mastery;
- credential issuance and verification are secure;
- credential requirements are transparent to employers;
- candidate performance is piloted and monitored;
- assessment quality is monitored;
- content is versioned and periodically reviewed;
- appeals/complaints and quality-improvement processes exist;
- employer/workplace evidence is incorporated as the program matures;
- accreditation claims are accurate;
- outcomes are measured rather than assumed.

## 28. Success metrics

Do not judge success primarily by content volume.

Track metrics such as:
- percentage of credential competencies mapped to validated job tasks;
- percentage of objectives with complete instructional/assessment alignment;
- percentage of Operational+ competencies with performance evidence;
- safety-critical mastery coverage;
- scientific/evidence review freshness;
- accessibility compliance;
- assessment reliability and item quality;
- practical-rubric consistency;
- learner completion and mastery;
- employer satisfaction;
- employer recognition/adoption;
- internship/practicum availability;
- interview/placement/advancement outcomes where validly measurable;
- credential verification usage;
- renewal/continuing-education participation;
- accreditation-readiness gap closure.

## 29. Directional decision

THC Academy V2 will be built as a cultivation workforce and competency system, not simply as a large cannabis e-learning library.

The existing repository remains the technical foundation. The immediate priority is to expand the occupational, instructional, practical-assessment, credential and quality models before another large content-production wave.

The first flagship employment credential should be THC Cultivation Technician I. THC Cultivation Foundations should become its scientific prerequisite/core rather than being treated as the final destination.
