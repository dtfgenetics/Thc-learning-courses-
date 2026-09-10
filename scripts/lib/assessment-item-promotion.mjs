import { activationEvidenceEvaluation } from '../pilot-evidence-quality.mjs';
import { highSeverityAssessmentItemFlags } from './foundations-item-review-preflight.mjs';

export function evaluateAssessmentItemPromotion({
  item,
  reviews = [],
  referenceIds = new Set(),
  pilotRecords = [],
  pilotPolicy = null
} = {}) {
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

  const highSeverityFlags = highSeverityAssessmentItemFlags(item);
  if (highSeverityFlags.length) {
    failures.push(`current item QA has high-severity construction flags: ${highSeverityFlags.map((flag) => flag.code).join(', ')}`);
  }

  let qualifiedPilot = null;
  if (!pilotPolicy) {
    failures.push('pilot evidence policy is required for activation');
  } else {
    const exactVersionPilotRecords = pilotRecords.filter((record) =>
      record.itemId === item.id && String(record.itemVersion) === String(item.version)
    );
    qualifiedPilot = exactVersionPilotRecords.find((record) =>
      activationEvidenceEvaluation(record, item, pilotPolicy).ready
    ) ?? null;
    if (!qualifiedPilot) failures.push('policy-qualified exact-version pilot evidence is required');
  }

  return {
    eligible: failures.length === 0,
    failures,
    approvedReviewId: approvedReview?.id ?? null,
    qualifiedPilotEvidenceId: qualifiedPilot?.id ?? null,
    highSeverityFlags,
    promoted: failures.length === 0 ? { ...item, status: 'active' } : null
  };
}
