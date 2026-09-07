export function evaluateAssessmentItemPromotion({ item, reviews = [], referenceIds = new Set() } = {}) {
  const failures = [];
  if (!item || typeof item !== 'object') return { eligible: false, failures: ['assessment item is required'], promoted: null };

  if (!/^ITEM-[A-Z0-9-]+$/.test(String(item.id ?? ''))) failures.push('item id is invalid');
  if (!Number.isInteger(item.version) || item.version < 1) failures.push('item version must be a positive integer');
  if (!['summative', 'credential'].includes(item.purpose)) failures.push('only summative or credential items may be promoted by this command');
  if (item.status === 'active') failures.push('item is already active');
  if (['flagged', 'retired'].includes(item.status)) failures.push(`item status ${item.status} cannot be promoted`);

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

  return {
    eligible: failures.length === 0,
    failures,
    approvedReviewId: approvedReview?.id ?? null,
    promoted: failures.length === 0 ? { ...item, status: 'active' } : null
  };
}
