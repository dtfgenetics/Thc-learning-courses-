# Standards Implementation Map

This repository is being designed to align with recognized education, assessment, credentialing, accessibility, and application-security practices.

## Target standards and specifications

- ASTM D8403 — cannabis/hemp certificate program practice
- ANSI/ASTM E2659 — assessment-based certificate program quality
- 1EdTech QTI 3.x — assessment item/test interoperability
- 1EdTech Open Badges 3.0 — portable achievement credentials
- W3C Verifiable Credentials 2.0 — verifiable credential data model
- WCAG 2.2 AA — accessibility
- OWASP ASVS 5.0 — application security verification baseline
- JSON Schema Draft 2020-12 — structured content validation

## Implementation evidence

| Concern | Repository implementation |
|---|---|
| Defined learning outcomes | `content/learning-objectives/` |
| Competency mapping | `content/competencies/` |
| Lesson/objective linkage | lesson metadata and validator |
| Assessment/objective linkage | assessment and question metadata |
| Version control | immutable IDs + semantic versions |
| Review governance | `docs/GOVERNANCE.md` |
| Curriculum validation | `scripts/validate-curriculum.mjs` |
| CI enforcement | `.github/workflows/validate.yml` |
| Accessibility target | `docs/ARCHITECTURE.md` |
| Credential interoperability | planned Open Badges / VC domain |
| Assessment interoperability | planned QTI import/export layer |

## Rule

This map documents design alignment only. It does not claim accreditation, certification, conformance, or endorsement by any standards body. Formal claims require the applicable review/accreditation process.
