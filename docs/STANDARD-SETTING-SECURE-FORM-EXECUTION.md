# Standard Setting and Secure Form Execution Workflow

The 13 conventional certification finals now have exact-version execution support for the two late-stage assessment gates.

## Operator kits

Run:

- `npm run certification:standard-secure:operator-kits`
- `npm run certification:standard-secure:operator-kits:json`
- `npm run certification:standard-secure:operator-kits:write`

Each kit reads the live dependency-aware work queue. If assessment review, pilot/item analysis, or prior standard-setting evidence is not ready, the kit shows the exact blocking gates rather than encouraging premature evidence.

## Standard-setting intake

After a real panel has completed its recommendation:

`npm run evidence:intake:standard-setting -- --course COURSE-LH-TECH1-001 --method modified-angoff --panelists 5 --raw-score 29 --percent 80.6 --authority PANEL-LEAD --pld-approved --sensitivity-reviewed --pilot-sample-size 60 --write`

The command derives the exact current final version and stable item count. It creates only `panel-complete` evidence with a **pending** governance decision. It cannot adopt the production cut score.

## Secure-form intake

After at least two real private operational forms exist:

`npm run evidence:intake:secure-form -- --course COURSE-LH-TECH1-001 --authority SECURITY-LEAD --blueprint-version ASSESS-LH-TECH1-001-FINAL@1.2.0 --form "OPAQUE-A|r1|36|fingerprint..." --form "OPAQUE-B|r1|36|fingerprint..." --write`

Only opaque identifiers, revisions, counts, and fingerprints are accepted. The starter record is `draft`, keeps every equivalence/security approval false, and never stores secure items or answer material.

This workflow does not make these gates executable before their prerequisites. The existing certification work queue remains authoritative for sequencing.
