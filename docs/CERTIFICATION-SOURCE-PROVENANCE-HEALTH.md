# Certification Source Provenance Health

The certification source layer now has two different controls:

1. **Structural integrity** — mandatory and fail-closed.
2. **Freshness maintenance** — reported as a queue and does not silently invalidate approved instructional content.

## Structural validation

`npm run certification:sources:supplements:validate`

This validates the public-source supplement registry against a dedicated JSON Schema and checks that:

- every mapped course and lesson exists;
- every lesson-version lock is current;
- each lesson actually belongs to the mapped course;
- every supplemental source exists;
- supplemental sources are reviewed;
- supplemental public sources use HTTPS URLs.

## Provenance health

`npm run certification:sources:health`

`npm run certification:sources:health:json`

`npm run certification:sources:health:check`

The report traverses all 15 canonical Technician courses and their 284 lessons, then combines direct lesson references with exact-version supplemental review sources. It reports the source inventory, review state, verification timestamps, and a maintenance queue.

By default, a verification timestamp older than 730 days is placed in the refresh queue. Sources without a recorded verification timestamp are also queued. This is **maintenance metadata**, not an automatic content rejection: a source may still be scientifically valid even when its webpage verification timestamp is old or absent.

The check fails only on structural/source-integrity defects such as a missing referenced source. Canonical sources that are not yet marked reviewed or do not have a recorded HTTPS public URL are surfaced in a separate **source review queue**, because legacy textbooks, standards, archived material, or valid records may require human provenance work rather than automatic rejection. Exact-version supplemental public sources remain stricter: they must already be reviewed and carry an HTTPS URL. Human technical review remains responsible for deciding whether source age, supersession, new evidence, or changed guidance requires lesson revision.

Use `--max-age-days <N>` with the report when a tighter maintenance horizon is needed.
