import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

function exactAssessmentReviews(item, reviews) {
  return reviews.filter((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment'
  );
}

function itemFlags(item) {
  const flags = [];
  const stem = String(item.stem ?? '');
  const rationale = String(item.rationale ?? '');
  const choices = Array.isArray(item.choices) ? item.choices.map((choice) => String(choice)) : [];

  if (stem.length < 30) flags.push({ code: 'short-stem', severity: 'medium', detail: `stem length ${stem.length}` });
  if (rationale.length < 40) flags.push({ code: 'short-rationale', severity: 'medium', detail: `rationale length ${rationale.length}` });

  if (choices.length > 0 && Number.isInteger(item.correct) && item.correct >= 0 && item.correct < choices.length) {
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

  if (!Array.isArray(item.references) || item.references.length === 0) {
    flags.push({ code: 'missing-reference', severity: 'high', detail: 'item has no evidence reference' });
  }
  return flags;
}

const registry = readJson('registry/cultivation-foundations.json');
const assessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const references = new Set(readDirJson('content/references').map((reference) => reference.id));
const releaseCompetencies = new Set((registry.domains ?? []).flatMap((domain) => domain.competencies ?? []));

const pending = questions.filter((item) =>
  releaseCompetencies.has(item.competency) &&
  ['summative', 'credential'].includes(item.purpose) &&
  !['flagged', 'retired'].includes(item.status) &&
  exactAssessmentReviews(item, reviews).length === 0
);

const rows = pending.map((item) => {
  const flags = itemFlags(item);
  for (const referenceId of item.references ?? []) {
    if (!references.has(referenceId)) flags.push({ code: 'unresolved-reference', severity: 'high', detail: referenceId });
  }
  const high = flags.filter((flag) => flag.severity === 'high').length;
  const medium = flags.filter((flag) => flag.severity === 'medium').length;
  return {
    id: item.id,
    version: item.version,
    competency: item.competency,
    objective: item.objective,
    type: item.type,
    difficulty: item.difficulty,
    highSeverityFlags: high,
    mediumSeverityFlags: medium,
    flags
  };
}).sort((a, b) =>
  (b.highSeverityFlags - a.highSeverityFlags) ||
  (b.mediumSeverityFlags - a.mediumSeverityFlags) ||
  a.competency.localeCompare(b.competency) ||
  a.id.localeCompare(b.id)
);

const codeCounts = new Map();
for (const row of rows) {
  for (const flag of row.flags) codeCounts.set(flag.code, (codeCounts.get(flag.code) ?? 0) + 1);
}

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  assessment: assessment.id,
  pendingItems: rows.length,
  itemsWithHighSeverityFlags: rows.filter((row) => row.highSeverityFlags > 0).length,
  itemsWithMediumSeverityFlags: rows.filter((row) => row.mediumSeverityFlags > 0).length,
  itemsWithoutFlags: rows.filter((row) => row.flags.length === 0).length,
  flagCounts: Object.fromEntries([...codeCounts.entries()].sort()),
  note: 'This is automated preflight only. It does not create, replace, or imply human assessment approval.'
};

console.log(JSON.stringify({ summary, items: rows }, null, 2));
