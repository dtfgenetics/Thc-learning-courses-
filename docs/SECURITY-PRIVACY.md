# Security and Privacy Baseline

## Data separation

Git stores curriculum and code. Production learner data belongs in the runtime database. Secrets, signing keys, API tokens, passwords, and raw private learner records must never be committed.

## Roles

Minimum runtime roles: learner, author, editor, subject-matter-reviewer, assessment-reviewer, credential-manager, administrator.

## Assessment security

Secure assessment items and answer keys are delivered from the server only to authorized active attempts. The server computes scores. Client-submitted scores are never trusted.

## Public verification

Verification endpoints are rate-limited and return only explicitly public credential metadata.

## Privacy

Collect the minimum learner information required to deliver education and credentials. Maintain versioned terms/privacy acceptance and retention/deletion procedures. Public credential visibility must be controllable where appropriate.

## Operational baseline

Target OWASP ASVS 5.0 practices, WCAG 2.2 AA accessibility, MFA for privileged roles, structured security logging, backups, restore testing, staging/production separation, and dependency/CI scanning as the application layer is introduced.
