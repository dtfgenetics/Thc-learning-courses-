# Public Occupational Source Baseline

The certification system now includes a public occupational-source baseline for the two canonical cultivation credentials.

## Why this exists

Cannabis-specific occupational standards are not sufficiently mature or nationally standardized to treat one public job description as a complete job-task analysis. However, current U.S. Department of Labor O*NET and Bureau of Labor Statistics sources provide useful adjacent evidence for crop, nursery, greenhouse, agricultural-supervisor and agricultural-manager work.

The baseline therefore gives the JTA panel a documented starting point without pretending that public occupational data validates the cannabis credential.

## Public sources

Technician I uses:

- O*NET 45-2092.00, Farmworkers and Laborers, Crop, Nursery, and Greenhouse;
- BLS Occupational Outlook Handbook, Agricultural Workers.

Technician II uses:

- O*NET 45-1011.00, First-Line Supervisors of Farming, Fishing, and Forestry Workers;
- BLS Occupational Outlook Handbook, Farmers, Ranchers, and Other Agricultural Managers;
- the crop/nursery/greenhouse O*NET profile for task continuity.

The Technician II mapping intentionally uses supervisor/manager sources only for advanced monitoring, coordination, quality/safety verification, equipment oversight and decision-support interfaces. It does **not** redefine Technician II as a personnel-supervisor or management credential.

## Generate packets

- `npm run certification:occupational-source-baseline`
- `npm run certification:occupational-source-baseline:json`
- `npm run certification:occupational-source-baseline:write`
- `npm run certification:occupational-source-baseline:validate`
- `npm run certification:occupational-source-baseline:test`

Each generated packet lists the public occupational sources, mapped task families, current course mappings, and cannabis-specific questions that SMEs/employers must resolve.

## Occupational validation integration

The occupational-validation completion transition now requires `--confirm-public-occupational-baseline`. A completed JTA record pins:

- the current occupational baseline ID;
- the baseline date;
- explicit confirmation that the public source baseline was reviewed.

The public baseline does not set final task importance, frequency, criticality, legal authority or credential level. Those decisions still require actual cannabis cultivation SME/employer validation, and the repository continues to keep that gate fail-closed until evidence is supplied.
