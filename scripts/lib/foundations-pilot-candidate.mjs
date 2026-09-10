import { highSeverityAssessmentItemFlags } from './foundations-item-review-preflight.mjs';

export function evaluateFoundationsPilotCandidate({ item, reviews = [], referenceIds = new Set() } = {}) {
  const failures = [];
  if (!item || typeof item !== 'object') {
    return { eligible: false, failures: ['assessment item is required'], approvedReviewId: null, highSeverityFlags: [] };
  }

  if (!['summative', 'credential'].includes(item.purpose)) failures.push('only summative or credential items may enter the Foundations pilot cohort');
  if (['flagged', 'retired'].includes(item.status)) failures.push(`item status ${item.status} cannot enter the Foundations pilot cohort`);

  const approvedReview = reviews.find((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment' &&
    review.status === 'approved'
  ) ?? null;
  if (!approvedReview) failures.push('exact-version approved assessment review is required');

  const refs = Array.isArray(item.references) ? item.references : [];
  if (refs.length === 0) failures.push('at least one reference is required');
  const missingReferences = refs.filter((id) => !referenceIds.has(id));
  if (missingReferences.length) failures.push(`unresolved references: ${missingReferences.join(', ')}`);

  const highSeverityFlags = highSeverityAssessmentItemFlags(item);
  if (highSeverityFlags.length) {
    failures.push(`current item QA has high-severity construction flags: ${highSeverityFlags.map((flag) => flag.code).join(', ')}`);
  }

  return {
    eligible: failures.length === 0,
    failures,
    approvedReviewId: approvedReview?.id ?? null,
    highSeverityFlags
  };
}
