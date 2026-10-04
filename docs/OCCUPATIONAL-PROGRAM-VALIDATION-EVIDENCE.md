# Occupational Program Validation Evidence

## Purpose

The certification reconciler previously covered assessment review, pilots, item analysis, assessor calibration, accessibility, standard setting, secure forms and credential authorization. That was not enough by itself to represent occupational certification readiness.

Technician I and Technician II also require explicit evidence for the occupational construct and program design.

## Gate covered

The `occupationalProgramValidation` gate is program-level and is projected to every current course in the corresponding Technician pathway.

It requires exact-version evidence for:

- technical/curriculum review of every current required course;
- job-task analysis validation, including target population, task/domain coverage and currency;
- SME/employer validation of role representativeness, critical tasks and scope boundaries;
- final assessment-blueprint weights and competency/cognitive/critical-content coverage;
- practical and capstone validation where the credential pathway requires performance evidence;
- zero unresolved critical performance-validation issues.

## Version invalidation

Evidence is pinned to the credential-program version and every required current course version. A course or program version change prevents the previous record from satisfying the current gate until it is reviewed again.

## Commands

- `npm run occupational-program:validate`
- `npm run occupational-program:readiness`

## Boundary

A machine-complete curriculum package, owner publication approval, completed item-quality pass, assessor calibration result, or standard-setting study does not substitute for occupational program validation. The gate advances only from actual exact-version evidence.
