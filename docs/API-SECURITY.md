# API Security Baseline

The development API includes a tested baseline for privacy-safe credential verification, secure response headers, request identifiers, structured request-completion logs, per-process rate limiting, and scope-gated opaque bearer tokens for protected service diagnostics.

## Authentication boundary
Protected administrative endpoints fail closed when no service token is configured. Configured service tokens must be at least 32 characters and are compared using constant-time digests. The server never logs Authorization headers or token values. `THC_API_ADMIN_TOKEN` grants only the `admin:read` scope used by the current diagnostics route.

The service-token mechanism remains a narrow development/bootstrap control. Production now defaults to the in-repo OIDC/OAuth JWT adapter (`apps/api/src/oidc-auth-adapter.mjs`) unless `THC_AUTH_ADAPTER_MODULE` explicitly overrides it. The production adapter verifies signed bearer JWTs asynchronously against an HTTPS JWKS endpoint, validates issuer, audience, expiration, subject, and an explicit JWS algorithm allowlist, then enforces API scopes from `scope`/`scp` claims. Required configuration is `THC_OIDC_ISSUER`, `THC_OIDC_AUDIENCE`, `THC_OIDC_JWKS_URI`, and optionally `THC_OIDC_ALGORITHMS` (default `RS256`) and `THC_OIDC_CLOCK_TOLERANCE_SECONDS` (default `5`). Privileged-user MFA remains a separate unsatisfied gate because this adapter does not infer or fabricate MFA assurance from provider-specific claims.

## Rate limiting
The built-in fixed-window limiter protects API routes and returns `429` plus rate-limit metadata when the configured threshold is exceeded. It keys on the direct socket address and is intentionally dependency-free.

For multi-instance production deployment, replace or front this limiter with a trusted edge/distributed control and define proxy/IP handling explicitly. The current control proves the application-layer rate-limit behavior but does not make the full production deployment ready.

## Observability and privacy
Each request receives a generated request ID and a structured completion event containing method, route template, status, and duration. Logs intentionally use route templates rather than raw credential verification IDs and do not include Authorization headers, learner identifiers, subject hashes, or credential payloads.

Production monitoring/alerting remains a separate unsatisfied operations gate until logs and metrics are connected to an actual monitored environment with alert rules and ownership.
