# Pilot evidence quality policy

THC Academy separates **pilot completion**, **activation eligibility**, and **psychometric review signals**. A pilot record can be complete enough to analyze without being strong enough to activate an item for credential-bearing use.

## Activation boundary

An item may count as having activation-ready pilot evidence only when the exact current item version has a complete pilot record that satisfies `registry/pilot-evidence-policy.json`.

Current internal activation controls require:

- at least 30 observed responses for the item;
- nonnegative item discrimination;
- internally consistent response counts, proportions, sample size, and percent-correct values;
- no unresolved item challenge;
- an exact-version approved human assessment review before activation.

The 30-response floor is an **internal operational minimum**, not a claim that 30 observations make an item statistically stable or that 30 is a universal psychometric standard. The separate target is 100 responses per item, and all estimates must be interpreted in context. Small samples make discrimination estimates unstable and can undermine high-stakes inference.

## Review signals

The policy reports, but does not automatically reject items for, these signals:

- fewer than 100 responses;
- percent correct below 0.30 or above 0.95;
- discrimination below 0.10;
- omit rate above 0.10;
- response-time anomaly rate above 0.10.

These values are triage signals. Content validity, candidate population, intended difficulty, blueprint role, distractor behavior, and sampling uncertainty remain part of the human review decision.

## Why the policy is structured this way

Credentialing guidance emphasizes validity, reliability, item analysis, response behavior, and defensible field testing. NCME's licensing/certification measurement chapter specifically notes that small candidate populations make field testing and parameter estimation difficult. NBME guidance treats percent-correct and discrimination statistics as diagnostic evidence that must be interpreted rather than as self-executing deletion rules. ETS research likewise notes that discrimination estimation becomes challenging with small samples.

The repository therefore uses hard rules only for conditions that should never be allowed to masquerade as production evidence: trivially small samples, inverse discrimination, inconsistent response accounting, unresolved challenges, missing human review, or missing complete pilot evidence. Other statistical signals route the item back to expert review.

## Sources

- National Council on Measurement in Education, *Educational Measurement, Fifth Edition*, Chapter 18, "Assessment for Licensing and Certification": https://ncme.org/wp-content/uploads/2026/01/Educational-Measurement-Fifth-Edition-Chapter-18.pdf
- National Board of Medical Examiners, *NBME Item-Writing Guide*, Chapter 4, "Item Analysis and Interpretation of Results": https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf
- Educational Testing Service, Guo et al. (2022), *Alternative Methods for Item Parameter Estimation: From CTT to IRT*: https://www.ets.org/research/policy_research_reports/publications/report/2022/keql.html

## Non-claims

This policy does not state that an item is valid merely because it crosses a numeric threshold. It does not replace standard setting, reliability analysis, fairness analysis, accessibility review, security review, or expert judgment. It also does not create pilot evidence or move question lifecycle status automatically.
