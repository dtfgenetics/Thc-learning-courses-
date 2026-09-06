# Containerized THC Academy staging deployment

The repository ships one reproducible Node image that can run either the learner web service or the development/staging API.

## Prerequisites

- Docker with Compose support
- a random staging admin token of at least 32 characters

## Start both services

```bash
export THC_API_ADMIN_TOKEN="replace-with-a-random-secret-at-least-32-characters"
docker compose -f deploy/compose.staging.yml up --build -d
```

Learner application: `http://localhost:4173/academy`

API health: `http://localhost:8787/healthz`

API readiness: `http://localhost:8787/readyz`

## Verify the source-level staging contract

Before building an image:

```bash
npm ci
npm test
npm run staging:smoke
npm run staging:readiness
npm run status
```

The smoke test boots the web and API services in-process on ephemeral ports and verifies:

- learner service health;
- a non-empty course catalog;
- lesson delivery;
- API health and dependency readiness;
- admin diagnostics deny missing and invalid credentials;
- admin diagnostics accept the configured scoped staging credential.

## Security boundary

The Compose configuration is for staging and demonstration. The API uses the development-memory credential adapter because production persistence, production authorization, signing, revocation persistence, MFA, and live infrastructure remain production gates.

Do not set `NODE_ENV=production` for this Compose stack. The API intentionally fails closed in production unless an explicit persistent credential store is supplied.

Do not commit the value of `THC_API_ADMIN_TOKEN`. Supply it through the host secret/environment system.

## Stop

```bash
docker compose -f deploy/compose.staging.yml down
```

A successful local/container staging deployment does not set `operations.stagingEnvironment=true` automatically. That readiness gate represents an actually provisioned and operated shared staging environment, not merely deployable source code.
