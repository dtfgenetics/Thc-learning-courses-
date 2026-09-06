# Production release scoping

Production release checks are course-scoped. A release must identify the exact `COURSE-*` object being evaluated; the checker does not assume that the full catalog or a specialist course is equivalent to Cultivation Foundations.

## Manual release

Use the **Production curriculum release gate** workflow and provide `course_id`. If a credential-bearing course maps to more than one credential definition, also provide `credential_id`.

The release checker can also be run locally:

```bash
npm run release:check -- --course=COURSE-CULT-FOUNDATIONS-001
npm run release:check -- --course=COURSE-GENETICS-ADVANCED-001 --credential=CRED-GENETICS-ADVANCED-001
```

`RELEASE_COURSE_ID` and optional `RELEASE_CREDENTIAL_ID` environment variables are also supported.

## Tag release

A tag-triggered release must encode the course scope explicitly:

```text
academy-COURSE-CULT-FOUNDATIONS-001-v1.0.0
academy-COURSE-GENETICS-ADVANCED-001-v1.0.0
```

Ambiguous `academy-*` tags fail closed.

## Gates enforced for the selected course

The checker requires the selected course and its modules/lessons to be published; approved scientific and editorial lesson reviews; approved/published module and final assessments; approved assessment reviews; active reviewed assessment items; blueprint active-bank depth when applicable; and a valid approved/published credential definition for credential-bearing courses.

For `COURSE-CULT-FOUNDATIONS-001`, the existing `registry/cultivation-foundations.json` publication and release gates remain mandatory in addition to the generic course checks.

These checks do not turn draft content, unreviewed items, or undeployed infrastructure into production-ready state. Human review, pilot evidence, signing infrastructure, production persistence, and other system-readiness gates remain separate requirements.
