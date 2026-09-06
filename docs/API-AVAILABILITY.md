# API Availability and Dependency Failure Behavior

## Liveness versus readiness
`GET /healthz` is a process liveness check. It does not query PostgreSQL, so an orchestrator can distinguish a running process from a failed database dependency.

`GET /readyz` is a dependency readiness check. The credential store must implement `ping()`. The PostgreSQL store performs a minimal `select 1 as ok`; query failures are converted into a typed persistence-unavailable error and the API returns `503`.

A store without a readiness check is not assumed healthy: `/readyz` returns `503 readiness-check-unavailable`.

## Failure containment
PostgreSQL query failures are wrapped as `PERSISTENCE_UNAVAILABLE`. Public/API responses return a generic `503 service-unavailable` and a request ID. Unexpected application errors return generic `500 internal-error`.

Neither path sends raw exception messages, connection strings, SQL text, database hostnames, credentials, or stack traces to the client. Structured failure logs record only request metadata plus error type/code; they do not record the exception message or cause.

## Deployment implications
These behaviors define application-level failure semantics but do not satisfy `operations.monitoringAndAlerting` or `api.productionDatabaseIntegration`. Production still needs a real pool, timeouts, retry/circuit-breaker decisions, dashboards, alert routing, dependency SLOs, and staging failure-injection tests.
