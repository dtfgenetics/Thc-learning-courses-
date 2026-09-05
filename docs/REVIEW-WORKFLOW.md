# THC Academy Review Workflow

Credential-bearing content must move through explicit human review rather than relying on the existence of a source or an AI-generated draft.

## Review types

### Scientific review
Confirms that factual claims, scope, terminology, citations, uncertainty, and practical conclusions are supported by the cited evidence. A source being marked `reviewed-source` does not mean a lesson using that source has passed scientific review.

### Editorial review
Confirms clarity, plain language, instructional sequence, consistency, grammar, definitions, and learner usability without changing the scientific meaning.

### Assessment review
Confirms item-objective alignment, defensible answer keys, distractor quality, cognitive level, evidence support, fairness, and security classification.

### Accessibility review
Confirms that content and assessments have an equivalent usable path without dependence on color, inaccessible media, pointer-only interactions, or unnecessary timing barriers.

### Legal/compliance review
Used where a lesson or credential could be interpreted as authorizing regulated activity, describing pesticide/legal requirements, or making claims about licensure/accreditation.

## Rule: source review is not lesson review

Reference status answers whether a source is appropriate evidence. Lesson scientific review answers whether the lesson uses that evidence accurately and within scope. These are separate gates.

## Required sequence for a lesson

`draft -> scientific review -> editorial review -> approved -> published`

Changes requested at either review return the lesson to draft/revision work. Published versions are immutable; later corrections produce a new version.

## Review records

Each review is recorded using `schemas/review-record.schema.json`. The record must identify:

- reviewed object and exact version
- review type
- decision
- reviewer identity or internal reviewer ID
- review date/time
- optional notes
- evidence checked when applicable

The author of credential-bearing content should not be the sole final approver.

## Publication rules

A credential-bearing lesson cannot be treated as publication-ready merely because it contains substantive content. Publication readiness additionally requires the configured scientific, editorial, assessment, accessibility, evidence, and credential gates.
