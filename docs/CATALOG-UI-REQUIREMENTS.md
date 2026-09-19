# Catalog UI Requirements

The public `/courses/` experience must:

- render exactly 10 credential offerings from the canonical public readiness registry;
- group them as foundational certificates, technician pathway, specialist certifications, and advanced professional;
- show an explicit readiness badge for every offering;
- show Course 1 as the only currently available public academic course link unless another course is explicitly published and verified;
- never render an earn-certification CTA for an offering with `issuanceAvailable: false`;
- allow authenticated enrollment only into published academic courses; draft/preview courses remain non-enrollable even if visible in development preview;
- present academic-course enrollment separately from professional credential eligibility, assessment, practical, review, and issuance gates;
- explain that public academic courses and professional credential release are separate states;
- remain crawlable and usable on mobile, tablet, and desktop;
- expose safe canonical pathway discovery metadata for learning courses: program name/status, target roles, course level, public-study prerequisites, and professional-program prerequisite credentials when applicable;
- distinguish professional-program prerequisites from public academic-study prerequisites so a draft credential prerequisite is not presented as a blanket restriction on public learning content;
- preserve the broader DTFSeeds navigation shell;
- avoid exposing secure credential assessment material.
