# Certification Catalog Publication Contract

## Purpose

The public THC Learning Hub catalog must show the complete credential pathway without implying that unfinished credentials are currently issuable.

The canonical public readiness source is:

`registry/credential-public-status.json`

That file is a publication/readiness projection only. It does not replace credential-program objects, release-evidence records, validation evidence, assessment security controls, or final release approval.

## Required public catalog hierarchy

1. Foundational certificates
2. Technician pathway
3. Specialist certifications
4. Advanced professional certification

The catalog must display all two foundational certificates and all eight professional credentials.

## Status language

### Available academic learning

May be used only when public learner content is actually reachable. It must never be presented as equivalent to an issuable professional credential.

### In development

Use when a pathway has active source curriculum/program work but release requirements remain incomplete.

### Planned

Use when the pathway is part of the canonical architecture but does not yet have a complete production course/program package.

### Release ready / available certification

Must not be shown unless the corresponding release-evidence process is complete and explicit final release approval exists.

## Current catalog behavior

- All seven Technician I academic courses (`COURSE-LH-TECH1-001` through `COURSE-LH-TECH1-007`) may be linked as available public academic learning.
- All eight Technician II academic courses (`COURSE-LH-TECH2-001` through `COURSE-LH-TECH2-008`) may be linked as available public academic learning.
- THC Cultivation Technician I must still be labeled **In development** until its program release evidence is complete.
- THC Cultivation Technician II must still be labeled **In development** until its program release evidence is complete.
- Public academic-course availability must never be presented as professional credential issuance availability.
- The six specialist/lead pathways are visible as **Planned** until their production state advances.
- Foundational certificates are visible as **In development** until current-model certificate packages and issuance rules are complete.

## Prohibited public claims

The public site must not:

- describe a draft professional credential as currently obtainable;
- use Course 1 publication as evidence that Technician I certification is released;
- expose secure credential-assessment items, keys, forms or protected evidence;
- hide the broader credential architecture simply because a pathway is unfinished;
- use legacy credentials as substitutes for the current eight-credential architecture without explicit migration/reclassification.

## Deployment verification

Every catalog deployment should record:

- source commit SHA;
- public route;
- credential status-registry version;
- visible offering count;
- public academic course count and representative Technician I/II route health;
- responsive/navigation verification;
- verification timestamp.
