# Course 1 Public Practical Runtime

The Course 1 integrated practical is public academic course content.

## Learner access

The learner may study the practical without authentication, including:

- the practical purpose and workflow overview;
- supported delivery modes;
- preparation steps;
- five workflow stages;
- seven required evidence outputs;
- the 100-point scoring domains;
- the minimum passing score and no-critical-error rule;
- critical-error boundaries;
- Course 1 study/support resources;
- print-friendly presentation.

Authentication is not a prerequisite for academic viewing.

## Private learner evidence

Authentication is used only to add the learner's private assessor-recorded practical status to the public study view. The learner surface may display status, recorded score, critical-error count, and remediation direction already projected by the Course 1 evidence endpoint.

Evaluator identity and practical `evidence_json` are not exposed to the public learner runtime.

## Source synchronization

`content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json` remains the canonical practical definition. `scripts/sync-course1-practical-public.mjs` verifies that the public learner projection embedded in `apps/web/public/course-assessment.js` matches the canonical practical object.

Run:

```sh
npm run course1:practical-public:sync
npm run course1:practical-public:audit
```

The audit is part of the normal repository test chain, so changes to practical stages, evidence outputs, scoring, preparation guidance, critical-error boundaries, or publication state cannot silently drift away from the learner runtime.

## Credential boundary

The Course 1 practical and Course 1 final are public course learning/evaluation components. The Technician I credential examination and credential-decision records are separate systems. This separation does not limit viewing, editing, expansion, or continued improvement of the Course 1 academic package.
