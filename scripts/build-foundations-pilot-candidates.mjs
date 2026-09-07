import fs from 'node:fs';
import path from 'node:path';

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

const plan = readJson('registry/foundations-pilot-plan.json');
const registry = readJson('registry/cultivation-foundations.json');
const assessment = readJson(`content/assessments/${plan.assessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');

function approvedAssessmentReview(item) {
  return reviews.some((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment' &&
    review.status === 'approved'
  );
}

function eligible(item) {
  if (!(plan.selection?.allowedPurposes ?? []).includes(item.purpose)) return false;
  if ((plan.selection?.excludeStatuses ?? []).includes(item.status)) return false;
  if (plan.selection?.requireApprovedAssessmentReview && !approvedAssessmentReview(item)) return false;
  return true;
}

function selectDiverse(pool, count) {
  const byObjective = new Map();
  for (const item of [...pool].sort((a, b) => a.objective.localeCompare(b.objective) || a.id.localeCompare(b.id))) {
    const list = byObjective.get(item.objective) ?? [];
    list.push(item);
    byObjective.set(item.objective, list);
  }
  const objectives = [...byObjective.keys()].sort();
  const selected = [];
  let depth = 0;
  while (selected.length < count) {
    let added = false;
    for (const objective of objectives) {
      const item = byObjective.get(objective)?.[depth];
      if (!item) continue;
      selected.push(item);
      added = true;
      if (selected.length === count) break;
    }
    if (!added) break;
    depth += 1;
  }
  return selected;
}

const minimum = plan.minimumCandidatesPerCompetency;
const rows = (assessment.blueprint ?? []).map((blueprintRow) => {
  const domain = (registry.domains ?? []).find((row) => (row.competencies ?? []).includes(blueprintRow.competency));
  const pool = questions.filter((item) => item.competency === blueprintRow.competency && eligible(item));
  const selected = selectDiverse(pool, minimum);
  const representedObjectives = [...new Set(selected.map((item) => item.objective))].sort();
  const domainObjectives = [...(domain?.objectives ?? [])].sort();
  return {
    competency: blueprintRow.competency,
    domain: domain?.id ?? null,
    requiredCandidates: minimum,
    eligibleReviewedItems: pool.length,
    selectedCandidates: selected.length,
    representedObjectives,
    domainObjectives,
    domainObjectivesRepresented: domainObjectives.filter((objective) => representedObjectives.includes(objective)).length,
    candidatePoolReady: selected.length >= minimum,
    candidates: selected.map((item) => ({
      id: item.id,
      version: item.version,
      objective: item.objective,
      status: item.status,
      bloomLevel: item.bloomLevel,
      difficulty: item.difficulty,
      type: item.type
    }))
  };
});

const output = {
  plan: {
    course: plan.course,
    assessment: plan.assessment,
    minimumCandidatesPerCompetency: minimum,
    note: plan.notes
  },
  summary: {
    competencies: rows.length,
    candidatePoolsReady: rows.filter((row) => row.candidatePoolReady).length,
    totalSelectedCandidates: rows.reduce((sum, row) => sum + row.selectedCandidates, 0),
    objectiveSlotsRepresented: rows.reduce((sum, row) => sum + row.domainObjectivesRepresented, 0),
    objectiveSlotsTotal: rows.reduce((sum, row) => sum + row.domainObjectives.length, 0),
    allCompetenciesPilotCandidateReady: rows.length > 0 && rows.every((row) => row.candidatePoolReady)
  },
  competencies: rows
};

console.log(JSON.stringify(output, null, 2));

if (check) {
  const errors = [];
  if (plan.course !== registry.course) errors.push(`Pilot plan course ${plan.course} does not match ${registry.course}.`);
  if (plan.assessment !== registry.summativeAssessment) errors.push(`Pilot plan assessment ${plan.assessment} does not match ${registry.summativeAssessment}.`);
  for (const row of rows) {
    if (!row.candidatePoolReady) errors.push(`${row.competency} has ${row.selectedCandidates}/${row.requiredCandidates} reviewed pilot candidates.`);
  }
  if (errors.length) {
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
}
