# Deterministic web QA policy

Routine THC Academy and DTFSeeds QA does not use Playwright.

Use deterministic Node-based tests, static route discovery, HTML/CSS/JS contract checks, build checks, API tests, accessibility regressions, and Lighthouse where a reachable deployed page is available. Browser automation is not a required authoring or merge dependency.

Visual/runtime acceptance that cannot be established deterministically is reported as readiness work for staging rather than blocking ordinary content authoring.
