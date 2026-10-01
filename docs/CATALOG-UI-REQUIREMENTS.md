# Catalog UI Requirements

The public `/courses/` experience must:

- be learner-first: available learning and the next useful action must appear before governance detail;
- preserve all 10 canonical credential offerings and their readiness metadata, but planned or unavailable programs may be visually demoted, grouped under future programs, or collapsed so they do not dominate the learner experience;
- use concise public-facing pathway names while preserving formal credential titles and IDs in metadata, administrative views, verification records, and issued documents;
- group learning as Foundations, Technician Pathways, Specialist Training, and Leadership & Operations;
- show readiness with a compact status treatment; do not repeat the same warning language across every card;
- show only published and verified academic courses as actionable learner links;
- never render an earn-certification CTA for an offering with `issuanceAvailable: false`;
- allow authenticated enrollment only into published academic courses; draft/preview courses remain non-enrollable even if visible in development preview;
- present academic-course enrollment separately from professional credential eligibility, assessment, practical, review, and issuance gates;
- explain the model once in plain language using the sequence Learn → Practice → Assess → Certify;
- move detailed credential-governance and assessment-boundary language to certification/policy views instead of large repeated warning blocks;
- remain crawlable, keyboard accessible, and usable on mobile, tablet, and desktop;
- keep mobile cards compact enough that title, purpose, status, and primary action are visible without excessive scrolling;
- expose safe canonical pathway discovery metadata for learning courses: formal program name/status, target roles, course level, public-study prerequisites, and professional-program prerequisite credentials when applicable;
- distinguish professional-program prerequisites from public academic-study prerequisites so a draft credential prerequisite is not presented as a blanket restriction on public learning content;
- preserve the broader DTFSeeds navigation shell;
- avoid exposing secure credential assessment material.

## Public naming rule

Public cards may use shorter instructional labels for readability. Formal credential names remain authoritative in governance and issuance records. Examples:

- THC Cultivation Technician I → Cultivation Technician I
- THC Plant Health, IPM & Biosecurity Specialist → Plant Health & IPM Specialist
- THC Environmental, Irrigation & Fertigation Systems Specialist → Environmental & Irrigation Systems
- THC Genetics, Breeding & Preservation Specialist → Genetics & Breeding Specialist
- THC Cultivation Lead & Operations Professional → Cultivation Leadership & Operations

## Visual hierarchy rule

The learner should encounter, in order:

1. academy purpose and primary learning action;
2. current or recommended pathway;
3. available courses;
4. specialist/future programs;
5. tools and field references;
6. certification policy detail.

Internal readiness, governance, validation, and issuance states must remain available to the system without becoming the dominant public-page visual language.
