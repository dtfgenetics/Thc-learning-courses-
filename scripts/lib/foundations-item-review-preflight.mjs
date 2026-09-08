export function foundationsItemReviewFlags(item) {
  const flags = [];
  const stem = String(item?.stem ?? '');
  const rationale = String(item?.rationale ?? '');
  const choices = Array.isArray(item?.choices) ? item.choices.map((choice) => String(choice)) : [];

  if (stem.length < 30) flags.push({ code: 'short-stem', severity: 'medium', detail: `stem length ${stem.length}` });
  if (rationale.length < 40) flags.push({ code: 'short-rationale', severity: 'medium', detail: `rationale length ${rationale.length}` });

  if (choices.length > 0 && Number.isInteger(item?.correct) && item.correct >= 0 && item.correct < choices.length) {
    const lengths = choices.map((choice) => choice.length);
    const keyedLength = lengths[item.correct];
    const maxLength = Math.max(...lengths);
    const distractorLengths = lengths.filter((_, index) => index !== item.correct);
    const meanDistractorLength = distractorLengths.reduce((sum, value) => sum + value, 0) / distractorLengths.length;
    if (keyedLength === maxLength && lengths.filter((value) => value === maxLength).length === 1) {
      flags.push({ code: 'keyed-choice-uniquely-longest', severity: 'high', detail: `keyed ${keyedLength} chars vs mean distractor ${meanDistractorLength.toFixed(1)}` });
    }
    if (keyedLength >= meanDistractorLength * 1.5 && keyedLength - meanDistractorLength >= 20) {
      flags.push({ code: 'keyed-choice-length-outlier', severity: 'high', detail: `keyed ${keyedLength} chars vs mean distractor ${meanDistractorLength.toFixed(1)}` });
    }
    const normalized = choices.map((choice) => choice.trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) flags.push({ code: 'duplicate-choice-text', severity: 'high', detail: 'two or more choices normalize to the same text' });
    const absolutePattern = /\b(always|never|only|nothing|unrelated|guarantee(?:d|s)?|impossible|cannot)\b/i;
    const distractorAbsoluteCount = choices.filter((choice, index) => index !== item.correct && absolutePattern.test(choice)).length;
    if (distractorAbsoluteCount >= 2) {
      flags.push({ code: 'multiple-absolute-distractors', severity: 'medium', detail: `${distractorAbsoluteCount} distractors use absolute wording` });
    }
  }

  if (!Array.isArray(item?.references) || item.references.length === 0) {
    flags.push({ code: 'missing-reference', severity: 'high', detail: 'item has no evidence reference' });
  }
  return flags;
}

export function highSeverityFoundationsItemFlags(item) {
  return foundationsItemReviewFlags(item).filter((flag) => flag.severity === 'high');
}
