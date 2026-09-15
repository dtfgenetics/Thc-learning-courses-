# Technician I courses 002-007 milestone

## Scope completed

The THC Cultivation Technician I program now has real source course objects for all seven required courses. This milestone instantiates `COURSE-LH-TECH1-002` through `COURSE-LH-TECH1-007` and keeps incomplete course-level instruction and assessment explicitly in draft status.

## Course sequence

1. `COURSE-LH-TECH1-001` — Safety, Responsible Practice & Cultivation Workflows
2. `COURSE-LH-TECH1-002` — Plant Observation, Growth Stages & Crop Records
3. `COURSE-LH-TECH1-003` — Environmental, Light & Sensor Fundamentals
4. `COURSE-LH-TECH1-004` — Water, Root Zone, Nutrition & Irrigation Fundamentals
5. `COURSE-LH-TECH1-005` — Propagation, Canopy, IPM Scouting & Crop Care
6. `COURSE-LH-TECH1-006` — Harvest, Postharvest, Traceability & Shift Handoff
7. `COURSE-LH-TECH1-007` — Integrated Cultivation Technician Practice Lab

## Integrity controls added

- `scripts/test-tech1-program-structure.mjs` verifies all seven required course objects exist.
- Every mapped module must resolve to a real module source object.
- Courses 002-007 must remain draft until their dedicated instructional and assessment layers are built and validated.
- Course 007 preserves the six planned Technician I practical IDs and the integrated shift capstone requirement.
- `registry/curriculum.json` is synchronized with the canonical registry builder.

## Next production block

The next milestone is no longer course-shell creation. It is to build the dedicated instructional/job-practice content and assessment evidence for courses 002-007, starting with Course 002, while reusing the existing canonical plant biology, flowering, records, environmental, lighting, water, root-zone, nutrition, propagation, canopy, IPM, postharvest, safety, traceability, and equipment material.
