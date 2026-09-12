# Course 1 Public Academic Publication Policy

`COURSE-LH-TECH1-001 — Safety, Responsible Practice & Cultivation Workflows` is a public academic course package.

## Publication rule

The learner-facing course, modules, lessons, module assessments, final course assessment, integrated practical, workbook, field references, job aids, and learner resources are published learning content. They remain continuously editable and may be expanded, revised, reorganized, replaced, or improved without an artificial content ceiling.

Review, calibration, pilot data, accessibility review, learner analytics, item statistics, and instructor feedback are quality-improvement inputs. They do not convert the public learner course back into a hidden or draft-only package and they do not prevent academic viewing or continued editing.

## Internal assessment governance

Question-bank lifecycle labels such as `draft`, `technical-review`, `pilot`, or `active` are internal assessment-quality metadata. They are not learner publication labels and must never be displayed as the publication state of Course 1. The public release manifest is authoritative for whether Course 1 learning assessments are available to learners.

`active` remains reserved for items that satisfy the repository's validation-evidence requirements; public academic publication does not falsely assert psychometric or professional credential validation.

## Credential boundary

The separate professional credential examination, credential-decision records, signing material, and private learner evidence are not Course 1 learner content. Keeping those records private does not restrict public access to the academic course itself.

## Enforcement

`scripts/enforce-course1-publication.mjs` enforces this policy. CI normalizes the Course 1 public graph before validation and then runs a hard publication audit. A future change that reintroduces learner-facing `draft`, calibration-blocked, pilot-only, or preparation-only publication language must be corrected before the quality gate passes.
