# Monitoring and alerting

THC Academy defines the monitoring signals the live service must expose and the conditions that must be exercised before `operations.monitoringAndAlerting` can close.

## Required signals

`registry/monitoring-policy.json` defines the provider-neutral minimum: API health, API readiness, HTTP error rate, HTTP latency, database connectivity/schema readiness, and credential worker failures.

The repository already provides `/healthz`, `/readyz`, structured `http.request.completed` telemetry, persistence readiness checks, and credential worker code. `scripts/validate-monitoring-policy.mjs` verifies those sources continue to exist.

## Production requirements

The deployed monitoring provider must:

- identify environment and timestamp in alerts;
- link alerts to a runbook;
- avoid learner PII in telemetry;
- keep environment-specific thresholds outside Git when they contain operationally sensitive values;
- route critical dependency, database, credential-integrity, and service-unavailable failures to an actively monitored destination.

## Verification drill

Before `operations.monitoringAndAlerting` may be true, perform a staging or production drill that safely causes or simulates representative health/readiness, server-error, database-unavailable, and credential-worker failure signals. Confirm alert creation, routing, acknowledgement, and runbook linkage. Record a non-secret `operations.monitoringAndAlerting` production-control evidence record with the tested commit and a safe external reference to protected operational evidence.

Repository policy/test completion is implementation readiness only; it does not claim a live monitoring provider is configured.
