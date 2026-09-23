# Integrated Performance Standard Setting

Technician I Course 7 and Technician II Course 8 do not use conventional written finals, but both explicitly require standard setting before professional credential use. Standard setting therefore applies to their **integrated practical/capstone decision rules** rather than being marked not-applicable.

The evidence model covers:

- every exact current practical and capstone version in the integrated pathway;
- panel-recommended minimum percentage for each required component;
- approval of each component's critical-error rule;
- the non-compensatory rule that all required components must pass;
- the rule that critical errors cannot be erased by aggregate scoring;
- a separate governance adoption decision.

## Intake

After a real performance-standard panel has completed its recommendation:

`npm run evidence:intake:integrated-standard-setting -- --course COURSE-LH-TECH1-007 --panelists 5 --authority PANEL-LEAD --component "PRACTICAL-TECH1-A|80" ... --component "CAPSTONE-TECH1-SHIFT-001|80" --write`

Every required practical/capstone must be supplied. The command derives exact current component versions and rejects missing or extra components. It creates `panel-complete` evidence with governance adoption still pending.

## Dependency order

For integrated pathways, standard setting now requires:

- course pilot execution at least evidence-complete;
- practical/capstone assessor calibration at least evidence-complete.

The conventional-final item-analysis prerequisite remains not-applicable to these two courses. This corrects the prior model where integrated-course standard setting was incorrectly treated as not-applicable.

No thresholds are generated automatically from the provisional course files. Panel recommendations must be supplied from real standard-setting work.
