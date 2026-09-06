# THC Academy repository map and commands

Repository: `dtfgenetics/Thc-learning-courses-`

## Primary content directories

`content/assessments` — assessment definitions and blueprints  
`content/claims` — evidence-backed claims  
`content/competencies` — competency definitions  
`content/courses` — course objects  
`content/credentials` — credential definitions  
`content/encyclopedia` — canonical reference content  
`content/glossary` — terminology  
`content/job-roles` — occupational roles  
`content/job-tasks` — role/job tasks  
`content/learning-objectives` — measurable objectives  
`content/lessons` — canonical instructional lesson objects  
`content/modules` — module groupings  
`content/occupations` — occupation definitions  
`content/proficiency-levels` — proficiency scale  
`content/programs` — program objects  
`content/questions` — item bank  
`content/references` — scientific/technical references  
`content/reviews` — structured review records

## Project/work-product directories

`docs/academy-v2` — employment-credential maps, job-practice units, practicals and capstones  
`docs/THC_ACADEMY_V2_PROJECT_DIRECTION.md` — long-form architecture baseline  
`registry/curriculum.json` — generated global curriculum registry  
`registry/occupational-framework.json` — occupation/role/task registry  
`registry/*production-plan.json` — machine-readable work targets  
`registry/*performance-plan.json` — performance credential plans where present  
`schemas` — JSON schemas  
`scripts` — validation, registry, assessment, credential, review, pilot, runtime, release tooling  
`apps/web` — learner-facing Academy web runtime  
`apps/api` — API/runtime/persistence layer  
`database` — database definitions/readiness  
`openapi` — public API contract

## Canonical search-before-create rule

Before creating a new science competency, lesson, or course, search:

1. `content/competencies`
2. `content/courses`
3. `content/modules`
4. `content/lessons`
5. `content/encyclopedia`
6. `content/claims`
7. `content/references`

Advanced courses often already contain the science needed for Technician II or specialist job-practice layers.

## Key commands

Core integrity:

```bash
npm run schema:validate
npm run validate
npm run occupational:validate
npm run registry:build
npm run registry:validate
```

Assessment and credential:

```bash
npm run exam:form:dev
npm run itembank:readiness
npm run credential:eligibility
npm run credential:test
npm run credential:issuance:test
npm run credential:public:test
npm run credential:specialist:readiness
npm run credential:specialist:coverage
npm run credential:coverage
```

Knowledge/review/pilot:

```bash
npm run knowledge:validate
npm run review:validate
npm run review:readiness
npm run review:queue:check
npm run review:packets:check
npm run pilot:validate
npm run pilot:readiness
```

Academy/runtime/API/data:

```bash
npm run academy:web:test
npm run academy:progress:test
npm run academy:accessibility:test
npm run runtime:test
npm run api:test
npm run api:failure:test
npm run api:bootstrap:test
npm run api:learner-progress:test
npm run db:schema:test
npm run persistence:test
npm run credential:persistence:test
npm run rls:contract:test
```

Operational/release:

```bash
npm run ops:validate
npm run staging:smoke
npm run staging:readiness
npm run status:check
npm run release:scope:test
npm run production:readiness
npm run release:check
```

Full suite:

```bash
npm test
```

Always inspect `package.json` for the current script inventory before assuming this resource is exhaustive.

## Registry automation behavior

Question/content commits may trigger automation that updates `registry/curriculum.json` and moves the active branch head. If a later commit gets rejected as non-fast-forward:

1. fetch the current branch head;
2. confirm the new commit is a generated registry synchronization or other legitimate concurrent work;
3. rebuild/rebase the intended changes on the new head;
4. preserve both sets of work;
5. do not force-push over the automation.

## Branch lifecycle

- inspect open PRs before creating a branch;
- continue the existing relevant branch when possible;
- use one coherent milestone per branch;
- keep PR metadata current;
- merge completed milestones;
- start dependent work from updated `main`;
- do not abandon finished work in long-lived branches.
