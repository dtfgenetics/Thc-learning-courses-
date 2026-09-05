# THC Academy Build Roadmap

## Phase 1 — Foundation
- Repository architecture
- Curriculum object model
- Immutable IDs and semantic versioning
- Core schemas
- Referential integrity validation
- CI validation
- Governance and review lifecycle
- Initial curriculum registry

## Phase 2 — Curriculum system
- Complete competency framework
- Learning objective registry
- Claim/evidence registry
- Reference provenance and freshness rules
- Taxonomy and glossary
- Media registry and licensing metadata
- Course/module/lesson authoring conventions

## Phase 3 — Assessment system
- Complete assessment schemas
- Question-version model
- Assessment blueprints
- Secure server-side scoring domain
- Attempt state machine
- Item statistics
- Retake/cooldown/accommodation policies
- QTI import/export mapping

## Phase 4 — Credential system
- Credential definitions
- Eligibility engine
- Issuance state machine
- Audit events
- Public verification model
- Revocation/supersession
- Open Badges 3.0 representation
- W3C Verifiable Credential readiness

## Phase 5 — Runtime platform
- PostgreSQL data model
- Authentication and authorization
- Learner profiles and enrollments
- Progress and mastery records
- Assessment attempts/results
- Issued credentials
- Audit/event store
- Background jobs and notifications

## Phase 6 — Applications
- Learner academy web app
- Admin/authoring studio
- Public credential verifier
- API and OpenAPI contract
- Search and semantic discovery
- Analytics and reporting

## Phase 7 — Operations and compliance
- WCAG 2.2 AA accessibility verification
- OWASP-aligned application security
- Privacy and retention controls
- Backup/restore tests
- Observability and incident handling
- Standards requirements matrix
- Release management
- Staging/production separation

## First complete vertical slice
Cultivation Foundations -> Environmental Management -> VPD lesson -> formative assessment -> summative blueprint -> eligibility check -> test credential -> verification endpoint.
