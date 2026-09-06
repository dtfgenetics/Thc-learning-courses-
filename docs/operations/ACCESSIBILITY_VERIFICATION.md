# THC Academy accessibility verification

THC Academy targets WCAG 2.2 AA for learner-facing and assessment experiences. Automated regression checks are necessary but are not sufficient to close the production accessibility gate.

## Automated checks in CI

`npm run academy:accessibility:test` verifies the current learner surface has core semantic and interaction safeguards: document language, viewport behavior, skip navigation, main/navigation landmarks, explicit search labeling, live-region behavior for dynamic lesson/governance content, visible focus affordances, reduced-motion handling, explicit dynamic button types, state exposure for lesson completion controls, and rejection of patterns that disable zoom or focus outlines.

## Manual verification still required

Before `frontendAccessibilityTestingComplete` can become true, run and record manual keyboard-only navigation, screen-reader testing with at least one desktop and one mobile combination, 200%/400% zoom and reflow, focus order and focus visibility, contrast checks, error/status announcement behavior, touch-target inspection, and reduced-motion verification.

Assessment accessibility must be reviewed separately. Question wording, choice structures, time limits, randomized content, feedback, and any future media must be usable without relying on color, pointer precision, visual position, or audio alone.

## Evidence rule

Do not change an accessibility readiness flag merely because the automated test passes. Store the manual verification record and remediation evidence first; production readiness remains fail-closed until those reviews are complete.
