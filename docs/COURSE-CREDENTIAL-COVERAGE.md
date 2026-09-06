# Course-to-credential coverage

`npm run credential:coverage` audits every course definition and separates three states:

1. **Non-credential course** — `credentialBearing=false`; this can be intentional.
2. **Credential-bearing course with a complete definition path** — has a final summative/credential assessment and at least one credential definition mapped to the course.
3. **Broken credential path** — a course is marked credential-bearing but is missing its final assessment, the assessment does not exist or has the wrong purpose, or no credential definition maps to the course.

The CI gate fails only on broken credential paths. It does not force every course to become credential-bearing, because some learning paths may intentionally remain educational/non-credential offerings.

This report complements `credential:specialist:readiness`: coverage verifies the definition path exists; readiness verifies whether that path is actually publishable/issuable.
