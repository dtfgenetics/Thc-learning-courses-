# Review Operations

THC Academy review tooling is optional support for quality improvement. It is not a publication gate, editing lock, promotion requirement, or prerequisite for public learner access.

## Optional review queue

Run:

```bash
npm run review:queue
```

The queue can be used to organize scientific, editorial, assessment, accessibility, or compliance observations. It is a planning aid only.

Possible lanes include:

- lesson scientific/technical review;
- lesson editorial review;
- assessment-definition review;
- formative-item review;
- credential-item review.

No lane blocks another lane. No review status blocks editing, publication, assessment use, or continued development.

## Recording a review note

Review notes may be stored under `content/reviews/` when useful. They can be edited or replaced as the project changes.

Useful fields can include the object being reviewed, version context, review type, descriptive status, contributor identifier, date, notes, and evidence checked. None are mandatory for publication.

AI-assisted review, automated checks, human review, specialist review, and editorial review may all contribute useful observations. The repository should distinguish factual evidence from unsupported claims, but it should not convert review metadata into a workflow restriction.

## Automated behavior

Automated project checks should focus on technical correctness and learner usability, including:

- valid JSON and schemas;
- valid object references;
- working application/runtime behavior;
- secure handling of sensitive data and answer material;
- accessibility and interface defects;
- missing or contradictory course content;
- assessment alignment and item-quality observations.

Review status itself is non-blocking. Publication and editing remain available while review and improvement continue.
