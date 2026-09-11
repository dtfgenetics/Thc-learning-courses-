import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const assessmentId = 'ASSESS-LH-TECH1-001-FINAL';
const assessment = JSON.parse(fs.readFileSync(path.join(root, 'content/assessments', `${assessmentId}.json`), 'utf8'));
const questionDir = path.join(root, 'content/questions');
const questions = new Map(
  fs.readdirSync(questionDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const item = JSON.parse(fs.readFileSync(path.join(questionDir, name), 'utf8'));
      return [item.id, item];
    })
);
const performanceDir = path.join(root, 'content/performance-assessments');
const performanceAssessments = new Map(
  fs.readdirSync(performanceDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const item = JSON.parse(fs.readFileSync(path.join(performanceDir, name), 'utf8'));
      return [item.id, item];
    })
);

const failures = [];
const itemIds = assessment.items ?? [];
const items = itemIds.map((id) => {
  const item = questions.get(id);
  if (!item) failures.push(`${assessmentId}: missing listed item ${id}`);
  return item;
}).filter(Boolean);
const targets = assessment.extensions?.qualityTargets ?? {};

if (assessment.totalItems != null && assessment.totalItems !== itemIds.length) {
  failures.push(`${assessmentId}: totalItems=${assessment.totalItems}, listed items=${itemIds.length}`);
}
if (new Set(itemIds).size !== itemIds.length) failures.push(`${assessmentId}: duplicate item IDs are listed`);
if (items.some((item) => item.purpose !== 'summative')) failures.push(`${assessmentId}: every listed final item must have purpose=summative`);

const objectiveCounts = new Map((assessment.objectives ?? []).map((objective) => [objective, 0]));
const bloomCounts = new Map();
const competencyCounts = new Map((assessment.competencies ?? []).map((competency) => [competency, 0]));
for (const item of items) {
  if (!objectiveCounts.has(item.objective)) failures.push(`${item.id}: objective ${item.objective} is outside the final-assessment objective list`);
  else objectiveCounts.set(item.objective, objectiveCounts.get(item.objective) + 1);
  bloomCounts.set(item.bloomLevel, (bloomCounts.get(item.bloomLevel) ?? 0) + 1);
  if (!competencyCounts.has(item.competency)) failures.push(`${item.id}: competency ${item.competency} is outside the final-assessment competency list`);
  else competencyCounts.set(item.competency, competencyCounts.get(item.competency) + 1);
}

const minimumItemsPerObjective = Number(targets.minimumItemsPerObjective ?? 1);
for (const [objective, count] of objectiveCounts) {
  if (count < minimumItemsPerObjective) failures.push(`${assessmentId}: ${objective} has ${count} item(s); target is at least ${minimumItemsPerObjective}`);
}

const appliedOrHigher = new Set(['apply', 'analyze', 'evaluate', 'create']);
const analyzeOrHigher = new Set(['analyze', 'evaluate', 'create']);
const appliedCount = items.filter((item) => appliedOrHigher.has(item.bloomLevel)).length;
const analyzeCount = items.filter((item) => analyzeOrHigher.has(item.bloomLevel)).length;
const appliedPercent = items.length ? (appliedCount / items.length) * 100 : 0;
const minimumAppliedPercent = Number(targets.minimumAppliedOrHigherPercent ?? 0);
const minimumAnalyzeItems = Number(targets.minimumAnalyzeOrHigherItems ?? 0);
if (appliedPercent + Number.EPSILON < minimumAppliedPercent) {
  failures.push(`${assessmentId}: applied-or-higher coverage is ${appliedPercent.toFixed(1)}%; target is at least ${minimumAppliedPercent}%`);
}
if (analyzeCount < minimumAnalyzeItems) {
  failures.push(`${assessmentId}: analyze-or-higher count is ${analyzeCount}; target is at least ${minimumAnalyzeItems}`);
}

const evidenceItems = items.filter((item) => Array.isArray(item.stimulus) && item.stimulus.length > 0);
const minimumEvidenceItems = Number(targets.minimumEvidenceStimulusItems ?? 0);
if (evidenceItems.length < minimumEvidenceItems) {
  failures.push(`${assessmentId}: evidence-stimulus items=${evidenceItems.length}; target is at least ${minimumEvidenceItems}`);
}

if (targets.requireStimulusCompetencyCoverage === true) {
  const represented = new Set(evidenceItems.map((item) => item.competency));
  for (const competency of assessment.competencies ?? []) {
    if (!represented.has(competency)) failures.push(`${assessmentId}: no evidence-stimulus item represents ${competency}`);
  }
}

for (const item of evidenceItems) {
  for (const block of item.stimulus) {
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      failures.push(`${item.id}: stimulus entries must be objects`);
      continue;
    }
    if (block.type === 'image') {
      if (targets.requireControlledImagePaths === true && !/^\/assets\/course1\/[A-Za-z0-9._-]+\.svg$/.test(block.src ?? '')) {
        failures.push(`${item.id}: image stimulus must use a controlled Course 1 SVG asset path`);
      }
      if (targets.requireAccessibleImageAlt === true && !(typeof block.alt === 'string' && block.alt.trim().length > 0)) {
        failures.push(`${item.id}: image stimulus requires meaningful alt text`);
      }
    }
    if (block.type === 'document') {
      if (!(typeof block.title === 'string' && block.title.trim().length > 0)) failures.push(`${item.id}: document stimulus requires a title`);
      if (!Array.isArray(block.fields) || block.fields.length === 0) failures.push(`${item.id}: document stimulus requires fields`);
    }
  }
}

const linkedPerformanceId = assessment.extensions?.linkedPerformanceAssessment;
if (!linkedPerformanceId) {
  failures.push(`${assessmentId}: extensions.linkedPerformanceAssessment is required for Course 1`);
} else {
  const practical = performanceAssessments.get(linkedPerformanceId);
  if (!practical) failures.push(`${assessmentId}: linked performance assessment ${linkedPerformanceId} does not exist`);
  else {
    const practicalCompetencies = new Set(practical.competencies ?? []);
    for (const competency of assessment.competencies ?? []) {
      if (!practicalCompetencies.has(competency)) failures.push(`${linkedPerformanceId}: does not assess ${competency}`);
    }
  }
}

const objectiveSummary = [...objectiveCounts.entries()].map(([id, count]) => `${id}:${count}`).join(', ');
const bloomSummary = [...bloomCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([level, count]) => `${level}:${count}`).join(', ');
const evidenceCompetencies = [...new Set(evidenceItems.map((item) => item.competency))].sort().join(', ');
console.log(`${assessmentId}: items=${items.length}, appliedOrHigher=${appliedCount}/${items.length} (${appliedPercent.toFixed(1)}%), analyzeOrHigher=${analyzeCount}, evidenceItems=${evidenceItems.length}`);
console.log(`Objective coverage: ${objectiveSummary}`);
console.log(`Bloom distribution: ${bloomSummary}`);
console.log(`Evidence competencies: ${evidenceCompetencies}`);
console.log(`Linked performance assessment: ${linkedPerformanceId ?? 'missing'}`);

if (failures.length) {
  console.error(`Course 1 final assessment audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Course 1 final assessment audit passed.');
