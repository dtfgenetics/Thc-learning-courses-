# THC Academy Review Workflow

Review is an optional quality-improvement activity used while courses, lessons, assessments, and certification materials are continuously edited and expanded.

Review does not control whether content may be edited, displayed, published, tested, or revised. Content remains editable at all times.

## Review types

### Scientific review
Checks factual claims, scope, terminology, citations, uncertainty, and practical conclusions against available evidence.

### Editorial review
Checks clarity, plain language, instructional sequence, consistency, grammar, definitions, and learner usability.

### Assessment review
Checks item-objective alignment, answer keys, distractor quality, cognitive level, evidence support, and fairness.

### Accessibility review
Checks that content and assessments provide usable alternatives and do not unnecessarily depend on color, inaccessible media, pointer-only interactions, or timing barriers.

### Legal/compliance review
May be used when material discusses regulated activity, pesticide/legal requirements, licensure, accreditation, or jurisdiction-specific rules.

## Editing model

There is no required review sequence and no status-based editing lock.

Authors and agents may update lessons, assessments, questions, references, modules, courses, and related materials whenever improvements are identified. Review can happen before, during, or after those edits.

Review notes are context, not approval gates. Previous notes may be retained, edited, replaced, reorganized, or removed as useful to the project.

## Review notes

Optional review notes may use `schemas/review-record.schema.json` and can include any useful combination of:

- object or topic being reviewed;
- version or revision context;
- review type;
- descriptive status;
- reviewer or contributor identifier when useful;
- date/time when useful;
- notes and recommendations;
- evidence checked.

No field in a review note controls publication or editing.

## Publication and iteration

Learner-facing publication and ongoing editing are separate from review metadata. A course may remain public while its content, examples, sources, assessments, visuals, and UX continue to improve.

Automated checks should identify broken JSON, missing referenced objects, invalid data structures, inaccessible interfaces, security problems, or runtime failures. They should not require review approval as a condition for editing or public visibility unless the project owner explicitly adds such a requirement later.
