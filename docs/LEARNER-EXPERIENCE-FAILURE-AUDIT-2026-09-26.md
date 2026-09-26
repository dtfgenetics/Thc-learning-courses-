# Learner Experience Failure Audit — 2026-09-26

## Purpose

Audit the THC Academy from the perspective of a real learner, not from repository completeness, schema coverage, or CI status.

A successful learner experience should answer, in order:

1. What is this?
2. Is it credible and appropriate for me?
3. Where do I start?
4. What will I learn?
5. How long will it take?
6. What should I do next?
7. Why does this concept matter?
8. Can I see the concept clearly?
9. Can I practice it?
10. Do I understand it?
11. What happens when I get something wrong?
12. How do I know I am progressing?
13. What must I complete to finish the course?
14. What does passing mean?
15. What credential or record do I receive?
16. What should I learn next?

The current product answers some of these, but not with enough clarity, consistency, or instructional polish.

---

## 1. Landing and orientation

### Learner expectation
A learner should immediately understand:
- what THC Academy teaches;
- which pathway fits them;
- whether they can study without a professional credential;
- the recommended starting course;
- approximate workload;
- what academic completion provides;
- what professional certification currently does and does not provide.

### Current shortfall
The homepage presents governance/development status, multiple future credentials, internal qualification language, pathway disclaimers, and course infrastructure before establishing a simple primary action.

The interface gives equal visual weight to available learning and credentials that are only planned or still in validation.

Internal phrases such as “fail-closed,” “development threshold,” “credential evidence,” “controlled,” “governance,” and similar implementation vocabulary are useful in audit/admin surfaces but should not dominate learner orientation.

### Required correction
Create a learner-first start screen:
- Primary CTA: **Start Technician I**
- Secondary CTA: **Continue learning**
- Short pathway graphic: Technician I → Technician II → specialist study
- Plain-language certification notice
- Estimated total workload
- Clear “academic courses available now / professional credential validation in progress” distinction
- Move governance detail to an expandable transparency/status area

---

## 2. Course discovery and sequencing

### Learner expectation
A learner should see a clear ordered sequence and understand prerequisites.

### Current shortfall
The catalog functions as a large expandable outline. It exposes course metadata, enrollment status, credential wording, finals, modules and lessons together, increasing cognitive load.

Some course objects also depend on shared modules whose statuses do not match the parent course status. A published course can therefore visually appear finished while underlying curriculum objects remain draft.

### Required correction
- Enforce published-course dependency integrity.
- Present course cards before the full lesson tree.
- Show: course number, title, purpose, estimated time, prerequisite, progress, and one primary action.
- Keep module/lesson detail collapsed until the learner enters the course.
- Add “recommended next course.”
- Prevent draft dependencies from appearing as completed/public learning.

---

## 3. Course start page

### Learner expectation
Before Lesson 1, learners need:
- course purpose;
- outcomes in plain language;
- estimated duration;
- module map;
- assessments/practicals;
- required materials;
- prerequisite knowledge;
- completion rules.

### Current shortfall
Much of this information exists in JSON or pathway panels, but it is fragmented rather than presented as a coherent course orientation experience.

### Required correction
Every course gets a dedicated start page with:
- “By the end of this course, you can…”
- module timeline;
- total hours;
- lesson count;
- practical requirements;
- final assessment rules;
- downloadable workbook/job aids;
- prerequisites;
- Begin/Continue button.

---

## 4. Lesson opening and instructional hierarchy

### Learner expectation
Every lesson should quickly explain:
- what this lesson teaches;
- why it matters in cultivation;
- what the learner should already know;
- what they will be able to do afterward.

### Current shortfall
Lesson content is often structurally rich but inconsistent in learner framing. Some lessons are strong; older/shared foundation lessons remain much thinner.

The visual hierarchy also risks showing many blocks—tables, callouts, scenarios, evidence notices, activities—without enough pacing.

### Required correction
Standardize the opening:
1. Lesson title
2. Why it matters
3. Learning objectives
4. Estimated time
5. Prior knowledge retrieval
6. Core explanation

Then teach in a deliberate sequence:
**concept → mechanism → cannabis example → visual → worked example → practice → misconception → application → retrieval check**.

---

## 5. Scientific depth

### Learner expectation
A premium cannabis program should teach why cultivation variables affect the plant, not only what action a technician should take.

### Current shortfall
The curriculum currently overweights operational-control language:
- stop;
- preserve;
- document;
- escalate;
- remain within authority.

These are important occupational behaviors, but repeated use makes parts of the curriculum read like compliance training rather than a complete plant-science education system.

### Required correction
Increase instructional weight for:
- plant physiology;
- root physiology;
- water relations;
- transpiration;
- photosynthesis;
- source-sink relationships;
- mineral nutrition;
- pH and nutrient availability;
- EC/TDS interpretation;
- substrate chemistry;
- CEC;
- environmental interactions;
- VPD mechanisms;
- photobiology;
- DLI/PPFD;
- reproductive biology;
- genetics and phenotype;
- propagation biology;
- plant pathology;
- entomology;
- IPM reasoning;
- harvest physiology;
- postharvest moisture/water activity;
- trichome biology;
- secondary metabolites.

Operational boundaries should be attached where relevant, not used as the central instructional voice.

---

## 6. Visual learning

### Learner expectation
Cannabis cultivation is visual. Learners should be able to recognize structures, symptoms, stages, measurements and workflows.

### Current shortfall
The system has visual registries and image blocks, but coverage and quality are uneven. Some visuals exist as planned assets or instructional references rather than a consistently polished visual curriculum.

A text-heavy lesson with an image block is not automatically visually taught.

### Required correction
Every lesson should be evaluated for the best visual type:
- photorealistic plant reference;
- macro anatomy photograph;
- labeled scientific diagram;
- process diagram;
- comparison image;
- symptom progression;
- canopy cross-section;
- root-zone diagram;
- measurement setup;
- chart/graph;
- decision tree.

Use high-resolution PNG/WebP/JPEG. Avoid decorative filler and production SVG instructional assets.

Visuals need:
- correct labels;
- useful captions;
- descriptive alt text;
- mobile readability;
- scientific accuracy;
- placement next to the concept they teach.

---

## 7. Worked examples

### Learner expectation
Learners need to see experts apply concepts to realistic cannabis situations.

### Current shortfall
Course 1 has strong worked-example arrays, but quality and quantity vary across shared/foundation content. Some examples are short statements rather than true worked reasoning.

### Required correction
Use worked examples that show:
**observations → measurements → interpretation → uncertainty → decision**.

Examples should include actual numbers where appropriate:
- PPFD/DLI;
- pH/EC;
- VPD;
- irrigation volumes;
- dryback;
- runoff/substrate readings;
- temperature/RH;
- scouting counts;
- harvest/postharvest trends.

---

## 8. Practice and active learning

### Learner expectation
Reading is not enough. A learner should repeatedly retrieve and apply concepts.

### Current shortfall
Practice checks, scenarios and activities exist, but their availability can vary by lesson. The UI can report that practice is “being expanded,” which is effectively a learner-facing placeholder.

### Required correction
Every instructional lesson needs:
- retrieval questions;
- at least one application item;
- misconception feedback;
- an applied activity or case when appropriate.

Remove “practice is being expanded” from public finished lessons. A published lesson should already have its minimum practice set.

---

## 9. Feedback quality

### Learner expectation
When an answer is wrong, learners need to know why it is wrong and what to review.

### Current shortfall
The formative engine returns the correct answer and rationale, but remediation is not consistently personalized to the missed concept.

### Required correction
Feedback should contain:
- result;
- why the selected answer fails;
- why the keyed answer is stronger;
- the concept to review;
- direct link to the relevant lesson section/visual/job aid;
- retry with a changed scenario.

---

## 10. Assessment experience

### Learner expectation
A formal test should feel like a real test:
- clear rules before launch;
- independent answer selection;
- saved choices;
- visible progress;
- time limit when applicable;
- final submission;
- grading afterward;
- result breakdown;
- attempt history;
- remediation and retake rules.

### Current shortfall
The assessment runtime has advanced substantially, but learner-facing language still exposes provisional-development and governance concepts heavily. Course final mechanics and professional credential assessment boundaries can be difficult for a learner to understand.

### Required correction
Before test:
- name;
- course;
- item count;
- time limit;
- pass rule;
- attempt/retake policy;
- accommodations;
- “answers are graded only after submission.”

During:
- question navigator;
- answered/unanswered state;
- flag for review;
- autosave;
- timer;
- explicit submit confirmation.

After:
- score;
- pass/not pass;
- objective/domain breakdown;
- missed-concept remediation;
- retake eligibility;
- printable academic course record where appropriate.

---

## 11. Practical assessment

### Learner expectation
The learner needs to know exactly what performance evidence is required and how it will be evaluated.

### Current shortfall
Detailed practical infrastructure exists, but Course 1's practical is still dominated by compliance/traceability tasks. Across the program, practicals need to demonstrate cultivation understanding as well as process control.

### Required correction
Practical assessment should include observable cultivation competencies:
- measure;
- inspect;
- calculate;
- compare;
- record;
- interpret;
- explain;
- choose next evidence;
- demonstrate safe execution.

Provide rubrics to learners before evaluation.

---

## 12. Remediation

### Learner expectation
Failure should produce a clear study path.

### Current shortfall
Remediation signals exist in content and instructor materials, but remediation is not yet experienced as a coherent learner workflow.

### Required correction
Create a remediation screen:
- concepts missed;
- specific lessons/sections;
- relevant visual;
- job aid;
- 3–5 targeted practice questions;
- “ready to retry” indicator.

---

## 13. Progress

### Learner expectation
Learners want one understandable answer to “Where am I?”

### Current shortfall
The system tracks lesson progress, enrollment, course evidence, competency records, practicals, portfolio evidence and credential eligibility. This is powerful but can overwhelm the learner because academic progress and professional credential progress are presented through multiple concepts.

### Required correction
Primary dashboard hierarchy:
1. Current course
2. Next lesson
3. Course completion %
4. Course final/practical status
5. Technician pathway progress
6. Optional detailed evidence/competency transcript

Do not make internal evidence objects the primary progress language.

---

## 14. Mobile use

### Learner expectation
Many learners will study on a phone during breaks, at home, or near a grow.

### Current shortfall
Responsive CSS exists and many controls meet touch-size requirements, but the product still carries desktop information density onto mobile:
- horizontal tab navigation;
- numerous pathway cards;
- large course outline;
- tables requiring horizontal scroll;
- long metadata blocks;
- lengthy lesson stacks.

### Required correction
On mobile:
- sticky “Continue lesson” control;
- compact bottom or overflow navigation;
- one-column cards;
- collapsible vocabulary/references;
- tables converted to stacked comparison cards where feasible;
- course outline drawer;
- progress always visible;
- lesson text width/spacing tuned for reading;
- images zoomable;
- assessment navigator optimized for touch.

---

## 15. Downloads and field tools

### Learner expectation
Job aids should look professional and be immediately usable.

### Current shortfall
The download system is functional, but many resources are CSV-oriented. CSV is useful for data exchange, not always the best learner-facing format.

### Required correction
Offer:
- print-ready PDF worksheets;
- fillable digital versions;
- mobile-friendly web forms;
- CSV only where structured data reuse is useful.

Each download should show a thumbnail/preview, course/module association and when to use it.

---

## 16. Learning tools

### Learner expectation
Calculators and references should connect directly to lessons.

### Current shortfall
VPD and DLI calculators exist, but the broader tool system is still separated from the learning sequence.

### Required correction
Embed tools contextually:
- VPD calculator inside environmental lessons;
- DLI calculator inside lighting lessons;
- pH/nutrient availability reference inside nutrition lessons;
- TDS/EC conversion where measurement is taught;
- plant atlas inside anatomy/diagnostic lessons;
- terpene atlas inside secondary-metabolite lessons.

Tools should open with the lesson's current example data when possible.

---

## 17. Language and tone

### Learner expectation
Professional science education should sound authoritative, clear and human.

### Current shortfall
The system frequently exposes repository/governance vocabulary to learners:
- controlled object;
- development threshold;
- evidence gate;
- credential authorization;
- fail-closed;
- current canonical;
- exact version;
- owner approved;
- production evidence.

Some of this belongs in formal policy or assessor/admin surfaces, but excessive use makes lessons and navigation feel like internal QA documentation.

### Required correction
Maintain rigorous concepts but translate the learner-facing layer into educational language. Preserve technical governance terminology only where it is itself being taught.

---

## 18. Credential expectations

### Learner expectation
The learner must know exactly what they can receive today.

### Current shortfall
The homepage prominently advertises professional certification pathways while also stating issuance is unavailable/in development. This creates expectation conflict.

### Required correction
Use a simple distinction:

**Available now**
- Academic course study
- course progress
- practice
- course assessments where released
- academic completion record where authorized

**Professional certification**
- Program under validation
- certification issuance begins only after required validation/release approval

Do not market planned specialist credentials as equivalent to available offerings.

---

## 19. Trust and evidence

### Learner expectation
Learners should be able to tell what is established science, what is operational best practice, and what remains uncertain.

### Current shortfall
Evidence-boundary callouts are a strong feature, but heavy repeated disclaimers can interrupt learning and still do not replace a clean reference experience.

### Required correction
Use lightweight evidence badges in lessons:
- Established
- Strong evidence
- Context-dependent
- Emerging/preliminary
- Operational best practice

Keep full citations and evidence notes in expandable references.

---

## 20. Completion experience

### Learner expectation
Finishing a course should feel meaningful.

### Current shortfall
The system has records, final assessments, practicals and certificate-printing architecture, but the learner journey lacks a polished completion moment.

### Required correction
After successful academic completion:
- completion screen;
- score summary;
- demonstrated objectives;
- completed practical status;
- downloadable academic record;
- next recommended course;
- distinction between academic completion and professional credential status.

---

# Priority repair order

## P0 — stop overstating completion
1. Run published-course dependency integrity across all 15 courses.
2. Resolve every published course → draft module/lesson contradiction.
3. Remove learner-facing placeholder messages.
4. Correct stale homepage availability claims.

## P1 — fix the learner path
5. Simplify landing page.
6. Build course-start experience.
7. Add Continue Learning.
8. Simplify dashboard hierarchy.
9. Separate learner UI from governance/admin language.

## P2 — repair instructional quality
10. Upgrade every thin/shared foundation lesson.
11. Add missing cannabis science/mechanism.
12. Standardize worked examples.
13. Complete formative practice.
14. Complete remediation.
15. Complete raster visuals and captions.

## P3 — assessment quality
16. Verify test UX across all courses.
17. Add objective-level result/remediation views.
18. Verify timing, autosave, answer review and retake behavior.
19. Complete learner-facing practical rubrics.

## P4 — professional finish
20. Mobile redesign pass.
21. PDF/fillable learner resources.
22. Contextual tool integration.
23. visual consistency and typography pass.
24. completion/certificate experience.
25. accessibility/manual review.

# Core conclusion

The project is not mainly failing because it lacks more features. It is failing because the learner sees too much infrastructure and not enough coherent teaching experience.

The repository has substantial backend, assessment, governance and credential architecture. The next successful phase is to make the learner-facing product feel simpler while making the instructional material deeper.

The rule going forward should be:

**Less internal machinery visible to learners. More cannabis science, visual explanation, worked reasoning, active practice, actionable feedback and obvious progression.**
