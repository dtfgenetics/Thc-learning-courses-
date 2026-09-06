import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function readDirJson(rel) {
  const dir = path.join(root, rel);
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')));
}

const assessments = readDirJson('content/assessments').filter((a) => a.purpose === 'credential');
const questionList = readDirJson('content/questions');
const questions = new Map(questionList.map((q) => [q.id, q]));

function assessmentBankItems(assessment) {
  const staticItems = (assessment.items ?? []).map((id) => questions.get(id)).filter(Boolean);
  if (staticItems.length > 0) return { mode: 'static', items: staticItems };

  if ((assessment.itemPools ?? []).length > 0) {
    const prefixes = assessment.itemPools.map((row) => row.idPrefix);
    return {
      mode: 'domain-pools',
      items: questionList.filter((q) => prefixes.some((prefix) => q.id.startsWith(prefix)) && ['summative','credential'].includes(q.purpose))
    };
  }

  if ((assessment.blueprint ?? []).length > 0) {
    const competencies = new Set(assessment.blueprint.map((row) => row.competency));
    return {
      mode: 'blueprint',
      items: questionList.filter((q) => competencies.has(q.competency) && ['summative','credential'].includes(q.purpose))
    };
  }

  return { mode: 'none', items: [] };
}

const rows = assessments.sort((a,b) => a.id.localeCompare(b.id)).map((assessment) => {
  const bank = assessmentBankItems(assessment);
  const items = bank.items;
  const objectiveCoverage = Object.fromEntries((assessment.objectives ?? []).map((objective) => [objective, items.filter((q) => q.objective === objective).length]));
  const competencyCoverage = Object.fromEntries((assessment.competencies ?? []).map((competency) => [competency, items.filter((q) => q.competency === competency).length]));
  const uncoveredObjectives = Object.entries(objectiveCoverage).filter(([,count]) => count === 0).map(([id]) => id);
  const underTwoObjectives = Object.entries(objectiveCoverage).filter(([,count]) => count < 2).map(([id]) => id);
  return {
    assessment: assessment.id,
    selectionMode: bank.mode,
    itemCount: items.length,
    objectives: objectiveCoverage,
    competencies: competencyCoverage,
    uncoveredObjectives,
    objectivesBelowTwoItems: underTwoObjectives,
    twoItemsPerObjectiveReady: underTwoObjectives.length === 0
  };
});

const report = {
  summary: {
    specialistFinals: rows.length,
    finalsWithCompleteObjectiveCoverage: rows.filter((r) => r.uncoveredObjectives.length === 0).length,
    finalsWithTwoItemsPerObjective: rows.filter((r) => r.twoItemsPerObjectiveReady).length
  },
  assessments: rows
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--check')) {
  const failures = rows.filter((row) => !row.twoItemsPerObjectiveReady);
  if (failures.length > 0) {
    const detail = failures.map((row) => `${row.assessment}: ${row.objectivesBelowTwoItems.join(', ')}`).join('; ');
    throw new Error(`Specialist final coverage gate failed for ${failures.length} assessment(s): ${detail}`);
  }
}
