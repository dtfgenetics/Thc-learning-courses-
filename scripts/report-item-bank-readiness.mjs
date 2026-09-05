import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const questionsDir = path.join(root, 'content/questions');
const assessment = JSON.parse(fs.readFileSync(path.join(root, 'content/assessments/ASSESS-CULT-FOUNDATIONS-FINAL-001.json'), 'utf8'));
const questions = fs.readdirSync(questionsDir).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(fs.readFileSync(path.join(questionsDir, name), 'utf8')));

const rows = assessment.blueprint.map((bp) => {
  const items = questions.filter((q) => q.competency === bp.competency && ['summative','credential'].includes(q.purpose));
  const byStatus = Object.fromEntries(['draft','technical-review','editorial-review','pilot','active','flagged','retired'].map((status) => [status, items.filter((q) => q.status === status).length]));
  const byType = Object.fromEntries([...new Set(items.map((q) => q.type))].sort().map((type) => [type, items.filter((q) => q.type === type).length]));
  const byDifficulty = Object.fromEntries(['easy','moderate','hard','expert'].map((difficulty) => [difficulty, items.filter((q) => q.difficulty === difficulty).length]));
  return {
    competency: bp.competency,
    formItemsRequired: bp.items,
    bankItems: items.length,
    activeItems: byStatus.active,
    minimumActiveItemsRequired: assessment.itemSelection.minimumActiveItemsPerCompetency,
    targetBankItems: assessment.itemSelection.targetBankItemsPerCompetency,
    statuses: byStatus,
    types: byType,
    difficulties: byDifficulty,
    draftDepthReady: items.length >= assessment.itemSelection.minimumActiveItemsPerCompetency,
    productionDepthReady: byStatus.active >= assessment.itemSelection.minimumActiveItemsPerCompetency
  };
});

const summary = {
  competencies: rows.length,
  totalBankItems: rows.reduce((sum, row) => sum + row.bankItems, 0),
  totalActiveItems: rows.reduce((sum, row) => sum + row.activeItems, 0),
  competenciesAtDraftDepth: rows.filter((row) => row.draftDepthReady).length,
  competenciesAtProductionDepth: rows.filter((row) => row.productionDepthReady).length,
  minimumActiveItemsPerCompetency: assessment.itemSelection.minimumActiveItemsPerCompetency,
  targetBankItemsPerCompetency: assessment.itemSelection.targetBankItemsPerCompetency
};

console.log(JSON.stringify({ summary, competencies: rows }, null, 2));
