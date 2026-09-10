import fs from 'node:fs';
import path from 'node:path';
import { evaluateFoundationsPilotCandidate } from './lib/foundations-pilot-candidate.mjs';

const root = process.cwd();
const check = process.argv.includes('--check');

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

function roundRobinByObjective(items) {
  const difficultyRank = new Map([['moderate', 0], ['hard', 1], ['easy', 2], ['expert', 3]]);
  const groups = new Map();
  for (const item of items) {
    const key = item.objective ?? 'UNMAPPED';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const rows of groups.values()) {
    rows.sort((a, b) =>
      ((difficultyRank.get(a.difficulty) ?? 99) - (difficultyRank.get(b.difficulty) ?? 99)) ||
      a.id.localeCompare(b.id)
    );
  }
  const objectives = [...groups.keys()].sort();
  const ordered = [];
  for (let index = 0; ; index += 1) {
    let added = false;
    for (const objective of objectives) {
      const item = groups.get(objective)[index];
      if (!item) continue;
      ordered.push(item);
      added = true;
    }
    if (!added) break;
  }
  return ordered;
}

const registry = readJson('registry/cultivation-foundations.json');
const assessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const references = new Set(readDirJson('content/references').map((reference) => reference.id));
const pilotEvidence = readDirJson('content/pilot-evidence');
const targetPerCompetency = assessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0;

function evidenceRecord(item) {
  return pilotEvidence.find((record) =>
    record.itemId === item.id && String(record.itemVersion) === String(item.version)
  ) ?? null;
}

const rows = [];
const errors = [];
for (const bp of assessment.blueprint ?? []) {
  const scopedItems = questions.filter((item) =>
    item.competency === bp.competency &&
    ['summative', 'credential'].includes(item.purpose)
  );
  const evaluations = scopedItems.map((item) => ({
    item,
    result: evaluateFoundationsPilotCandidate({ item, reviews, referenceIds: references })
  }));
  const eligibleEvaluations = evaluations.filter(({ result }) => result.eligible);
  const ordered = roundRobinByObjective(eligibleEvaluations.map(({ item }) => item));
  const selected = ordered.slice(0, targetPerCompetency);
  if (selected.length < targetPerCompetency) {
    errors.push(`${bp.competency}: requires ${targetPerCompetency} current-QA-clean, reviewed, reference-clean pilot candidates but only ${selected.length} are available`);
  }
  rows.push({
    competency: bp.competency,
    targetItems: targetPerCompetency,
    scopedCandidates: scopedItems.length,
    pilotEligibleCandidates: ordered.length,
    excludedByCurrentHighSeverityQa: evaluations.filter(({ result }) => result.highSeverityFlags.length > 0).length,
    excludedForEligibilityReasons: evaluations.filter(({ result }) => !result.eligible).length,
    selected: selected.map((item) => {
      const result = evaluateFoundationsPilotCandidate({ item, reviews, referenceIds: references });
      return {
        id: item.id,
        version: item.version,
        status: item.status,
        objective: item.objective,
        difficulty: item.difficulty,
        type: item.type,
        approvedReviewId: result.approvedReviewId,
        existingPilotEvidenceId: evidenceRecord(item)?.id ?? null,
        existingPilotEvidenceStatus: evidenceRecord(item)?.status ?? null
      };
    })
  });
}

const cohort = rows.flatMap((row) => row.selected.map((item) => ({ competency: row.competency, ...item })));
const uniqueIds = new Set(cohort.map((item) => item.id));
if (uniqueIds.size !== cohort.length) errors.push('Pilot cohort contains duplicate assessment items.');

const objectives = new Map();
const difficulties = new Map();
for (const item of cohort) {
  objectives.set(item.objective, (objectives.get(item.objective) ?? 0) + 1);
  difficulties.set(item.difficulty, (difficulties.get(item.difficulty) ?? 0) + 1);
}

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  assessment: registry.summativeAssessment,
  targetPerCompetency,
  competencies: rows.length,
  selectedItems: cohort.length,
  expectedSelectedItems: targetPerCompetency * rows.length,
  selectionComplete: errors.length === 0,
  currentHighSeverityQaExclusions: rows.reduce((sum, row) => sum + row.excludedByCurrentHighSeverityQa, 0),
  itemsWithExistingPilotEvidence: cohort.filter((item) => item.existingPilotEvidenceId).length,
  itemsNeedingPilotEvidenceTemplate: cohort.filter((item) => !item.existingPilotEvidenceId).length,
  objectiveRepresentation: Object.fromEntries([...objectives.entries()].sort()),
  difficultyRepresentation: Object.fromEntries([...difficulties.entries()].sort()),
  errors,
  check,
  note: 'Report mode may describe an incomplete cohort without exiting nonzero. --check and all staging writes remain fail-closed.'
};

console.log(JSON.stringify({ summary, competencies: rows, cohort }, null, 2));
if (check && errors.length) process.exit(1);
