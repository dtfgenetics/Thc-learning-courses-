# THC Academy Exam Form Generation

Credential-bearing exam forms must be assembled server-side from an approved item bank using the published assessment blueprint.

## Principles

- The browser never receives the complete secure bank or scoring key.
- A form is generated from immutable item versions.
- Every form satisfies the competency counts in the assessment blueprint.
- Selection is random within eligible pools but reproducible from stored form metadata.
- Only `active` summative/credential items are eligible for production forms.
- Draft, review, pilot, flagged, and retired items are excluded from production forms.
- No item may appear twice on the same form.
- Exposure controls can later cap how frequently an item is selected.
- Equivalent forms must preserve total item count, competency coverage, difficulty distribution, and cognitive-level targets.

## Form record

Store at minimum:

- form_id
- assessment_id
- assessment_version
- generated_at
- generation_algorithm_version
- selected item IDs and immutable item versions
- competency counts
- difficulty counts
- cognitive-level counts
- random seed or equivalent reproducibility metadata
- integrity hash

## Selection algorithm

1. Load the immutable assessment blueprint.
2. Load all eligible item versions.
3. Partition items by competency.
4. For each blueprint row, verify the eligible pool is at least as large as the requested form count.
5. Apply optional difficulty/cognitive constraints.
6. Select without replacement.
7. Persist the exact selected item versions before presenting the form.
8. Present only learner-safe item payloads.
9. Score responses server-side against the persisted versions.

## Failure behavior

Form generation must fail closed when any required competency lacks enough eligible active items. The system must never silently substitute a different competency or reduce the requested item count.
