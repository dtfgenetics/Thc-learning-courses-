import fs from 'node:fs';
import path from 'node:path';

export function loadPilotEvidencePolicy(baseDir = process.cwd()) {
  return JSON.parse(fs.readFileSync(path.join(baseDir, 'registry/pilot-evidence-policy.json'), 'utf8'));
}

function approximatelyEqual(a, b, tolerance = 0.01) {
  return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tolerance;
}

export function responseAccountingIssues(record, item) {
  const issues = [];
  if (!Array.isArray(record.distractorSelection)) return ['distractorSelection is not an array'];
  const choiceCount = item?.choices?.length ?? 0;
  const byChoice = new Map(record.distractorSelection.map((row) => [row.choiceIndex, row]));
  if (choiceCount > 0 && byChoice.size !== choiceCount) issues.push(`expected ${choiceCount} choice rows, found ${byChoice.size}`);
  for (let index = 0; index < choiceCount; index += 1) {
    if (!byChoice.has(index)) issues.push(`missing choice row ${index}`);
  }
  const countSum = record.distractorSelection.reduce((sum, row) => sum + (Number.isInteger(row.count) ? row.count : 0), 0);
  const expectedNonOmitted = Number.isInteger(record.sampleSize) && typeof record.omitRate === 'number'
    ? record.sampleSize * (1 - record.omitRate)
    : null;
  if (expectedNonOmitted !== null && !approximatelyEqual(countSum, expectedNonOmitted, 0.01)) {
    issues.push(`choice counts sum to ${countSum}, expected non-omitted responses are ${expectedNonOmitted}`);
  }
  if (countSum > 0) {
    for (const row of record.distractorSelection) {
      const expected = row.count / countSum;
      if (!approximatelyEqual(row.proportion, expected)) issues.push(`choice ${row.choiceIndex} proportion ${row.proportion} does not match count/non-omitted ${expected}`);
    }
  }
  if (record.sampleSize > 0 && Number.isInteger(item?.correct) && byChoice.has(item.correct) && typeof record.percentCorrect === 'number') {
    const expectedCorrect = byChoice.get(item.correct).count / record.sampleSize;
    if (!approximatelyEqual(record.percentCorrect, expectedCorrect)) issues.push(`percentCorrect ${record.percentCorrect} does not match keyed count/sampleSize ${expectedCorrect}`);
  }
  return issues;
}

export function pilotReviewFlags(record, policy) {
  const flags = [];
  const signals = policy.reviewSignals ?? {};
  if (Number.isInteger(record.sampleSize) && record.sampleSize < (signals.targetResponsesPerItem ?? 0)) flags.push('below-target-sample');
  if (typeof record.percentCorrect === 'number' && record.percentCorrect < signals.percentCorrectLowerFlag) flags.push('difficulty-low-percent-correct');
  if (typeof record.percentCorrect === 'number' && record.percentCorrect > signals.percentCorrectUpperFlag) flags.push('difficulty-high-percent-correct');
  if (typeof record.discrimination?.value === 'number' && record.discrimination.value < signals.discriminationLowerFlag) flags.push('low-discrimination');
  if (typeof record.omitRate === 'number' && record.omitRate > signals.highOmitRateFlag) flags.push('high-omit-rate');
  if (typeof record.responseTimeAnomalyRate === 'number' && record.responseTimeAnomalyRate > signals.highResponseTimeAnomalyRateFlag) flags.push('high-response-time-anomaly-rate');
  return flags;
}

export function activationEvidenceEvaluation(record, item, policy) {
  const activation = policy.activation ?? {};
  const accountingIssues = responseAccountingIssues(record, item);
  const openChallenges = Array.isArray(record.challengeHistory) ? record.challengeHistory.filter((challenge) => challenge.status === 'open').length : 0;
  const blockers = [];
  if (record.status !== 'complete') blockers.push('pilot-not-complete');
  if (!Number.isInteger(record.sampleSize) || record.sampleSize < (activation.minimumResponsesPerItem ?? 1)) blockers.push('sample-below-activation-floor');
  if (activation.requireNoOpenChallenges && openChallenges > 0) blockers.push('open-item-challenge');
  if (activation.requireResponseAccountingConsistency && accountingIssues.length > 0) blockers.push('response-accounting-inconsistent');
  if (typeof activation.minimumDiscrimination === 'number' && (typeof record.discrimination?.value !== 'number' || record.discrimination.value < activation.minimumDiscrimination)) blockers.push('discrimination-below-activation-floor');
  return {
    ready: blockers.length === 0,
    blockers,
    accountingIssues,
    openChallenges,
    reviewFlags: pilotReviewFlags(record, policy)
  };
}
