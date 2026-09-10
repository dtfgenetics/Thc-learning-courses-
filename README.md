# THC Learning Courses / THC Academy

Version-controlled curriculum, assessment, review, learner-certification runtime, and credentialing source for Teaching Healthy Cultivation.

## Mission

Build a standards-aware education platform in which scientific evidence supports competencies, competencies drive learning objectives, lessons teach those objectives, assessments measure them, learner evidence is tracked safely, and credentials are issued only after defined requirements are satisfied.

## Repository responsibilities

This repository owns work directly required for THC Academy learning and certification, including curriculum source files, programs/courses/modules/lessons, competency definitions, learning objectives, occupational/job-task mappings, evidence/claim records, question banks and assessment source objects, practicals/rubrics/simulations, credential definitions, learner enrollment/progress/completion and assessment-attempt runtime, competency transcripts/public verification, standards mappings, schemas, validation tooling, Academy API/web contracts, review evidence, and Academy release-gate logic.

### Explicitly out of scope

This repository does **not** own the general DTFSeeds website, WordPress publishing, genetics/shop code, browser games, GrowLens, Grow Doc, site-wide dtfseeds.com crawling/Lighthouse, or cross-portfolio game/site visual QA. Those systems belong in their dedicated repositories, primarily `dtfgenetics/Thc` for dtfseeds.com production/site/game integration.

A new subsystem belongs here only when it is directly required to **teach, assess, track, verify, or issue** THC Academy learning/certification.

Run `npm run scope:validate` to detect known ownership violations.

This repository must **not** store production learner identities, production assessment attempts or scores as source-controlled records, issued credential secrets, private signing keys, production databases, or public-client copies of secure assessment answer data.

## Current state

The Cultivation Foundations and employment-oriented credential architecture includes:

- competency, module, lesson, objective, job-task, and proficiency mappings;
- substantive structured lesson content across core cultivation domains;
- evidence and scientific-claim registries;
- summative assessment blueprints and expanding item banks;
- deterministic development exam-form generation;
- assessment-attempt, learner-completion, persistence, and protected assessment-delivery work;
- deterministic credential-eligibility checks;
- test credential issuance, integrity verification, lifecycle logic, and privacy-safe public verification projection;
- scientific/editorial/assessment/accessibility/legal review records and workflow contracts;
- review-readiness, item-bank-readiness, duplicate-item, objective-coverage, and pilot-evidence reporting;
- Academy learner/API surfaces required for enrollment, progress, assessment, completion, credential progress, and verification;
- full curriculum/credential CI quality gates;
- a separate fail-closed production release gate.

This is **not yet a production certification release**. Publication, human review, active item-pool, pilot/standard-setting, and credential-readiness gates remain closed until their required evidence exists.

## Validate development work

Run the complete gate locally:

```bash
npm test
```

The suite begins with the repository-scope guard, then checks curriculum/schema integrity, assessment quality and coverage, review readiness, learner/runtime behavior, persistence/API security, credential eligibility/issuance/verification, and production-readiness contracts.

## Production release check

Production certification publication is a separate operation:

```bash
npm run release:check
```

The release check fails closed unless the selected curriculum/credential scope is publication-ready and all required review, assessment, learner-runtime, and release evidence is satisfied.

## Integration workflow

See `docs/INTEGRATION-WORKFLOW.md` for branch channels, source-of-truth directories, promotion rules, PR gates, release gates, and stale-branch/squash-merge handling.

## Publication rule

Draft/scaffold material is not production educational content. A source record, generated lesson, passing development test, or registry boolean is not a substitute for required review evidence. Credential-bearing material must complete the documented review workflow and production release gate before certification release.
