# THC Learning Courses / THC Academy

Version-controlled curriculum and credentialing foundation for Teaching Healthy Cultivation.

## Mission

Build a standards-aware education platform in which scientific evidence supports competencies, competencies drive learning objectives, lessons teach those objectives, assessments measure them, and credentials are issued only after defined requirements are satisfied.

## Repository responsibilities

This repository owns curriculum source files, competency definitions, learning objectives, assessment source objects, credential definitions, standards mappings, schemas, validation tooling, and application code.

It must **not** store learner identities, assessment attempts, scores, issued credential secrets, private signing keys, or production database records.

## Current foundation

The initial vertical slice contains:

- THC Cultivation Foundations course scaffold
- Environmental Management module
- VPD competency
- measurable VPD learning objective
- VPD lesson metadata
- formative assessment blueprint
- assessment item
- reference record with an explicit placeholder status
- JSON schemas for course, lesson, and question objects
- curriculum referential-integrity validation
- GitHub Actions validation workflow
- architecture and governance documentation

## Validate

```bash
npm run validate
```

The validator detects duplicate IDs and broken references between objectives, competencies, lessons, assessments, questions, modules, courses, and sources.

## Publication rule

Draft/scaffold material is not production educational content. Placeholder sources must be replaced with authoritative reviewed references and credential-bearing material must complete the documented review workflow before publication.

## Next build stages

1. Complete schemas for all curriculum object types.
2. Add authoritative scientific reference and claim registries.
3. Expand the Cultivation Foundations competency map.
4. Add summative assessment blueprints and secure assessment-domain code.
5. Add credential definitions, eligibility rules, issuance records, and public verification architecture.
6. Add learner/admin/verifier applications and a transactional PostgreSQL runtime data model.
