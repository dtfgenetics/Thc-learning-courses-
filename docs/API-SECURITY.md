# API Security Baseline

The development API includes a tested baseline for privacy-safe credential verification, secure response headers, request identifiers, structured request-completion logs, per-process rate limiting, and scope-gated opaque bearer tokens for protected service diagnostics.

## Authentication boundary
Protected administrative endpoints fail closed when no service token is configured. Configured service tokens must be at least 32 characters and are compared using constant-time digests. The server never logs Authorization headers or token values. `THC_API_ADMIN_TOKEN` grants only the `admin:read` scope used by the current diagnostics route.

This service-token mechanism is a narrow bootstrap control, not the final learner/admin identity architecture. Production user and administrator authentication should be delegated to a trusted OIDC/OAuth identity provider with short-lived credentials, rotation, MFA for privileged users, and centralized revocation/session controls. Accordingly, the broader runtime authentication/authorization and `adminMfaEnforced` readiness gates remain false.

## Rate limiting
The built-in fixed-window limiter protects API routes and returns `429` plus rate-limit metadata when the configured threshold is exceeded. It keys on the direct socket address and is intentionally dependency-free.

For multi-instance production deployment, replace or front this limiter with a trusted edge/distributed control and define proxy/IP handling explicitly. The current control proves the application-layer rate-limit behavior but does not make the full production deployment ready.

## Observability and privacy
Each request receives a generated request ID and a structured completion event containing method, route template, status, and duration. Logs intentionally use route templates rather than raw credential verification IDs and do not include Authorization headers, learner identifiers, subject hashes, or credential payloads.

Production monitoring/alerting remains a separate unsatisfied operations gate until logs and metrics are connected to an actual monitored environment with alert rules and ownership.
