#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { evaluateAssessmentItemPromotion } from './lib/assessment-item-promotion.mjs';

const root = process.cwd();
const write = process.argv.includes('--write');

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
  const groups = new Map();
  const difficultyRank = new Map([['moderate', 0], ['hard', 1], ['easy', 2], ['expert', 3]]);
  for (const item of items) {
    const key = item.objective ?? 'UNMAPPED';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const group of groups.values()) {
    group.sort((a, b) =>
      ((difficultyRank.get(a.difficulty) ?? 99) - (difficultyRank.get(b.difficulty) ?? 99)) ||
      a.id.localeCompare(b.id)
    );
  }
  const objectiveIds = [...groups.keys()].sort();
  const ordered = [];
  let index = 0;
  while (true) {
    let added = false;
    for (const objectiveId of objectiveIds) {
      const item = groups.get(objectiveId)[index];
      if (!item) continue;
      ordered.push(item);
      added = true;
    }
    if (!added) break;
    index += 1;
  }
  return ordered;
}

const registry = readJson('registry/cultivation-foundations.json');
const assessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const referenceIds = new Set(readDirJson('content/references').map((reference) => reference.id));
const minimumActive = assessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0;

if (!Number.isInteger(minimumActive) || minimumActive < 1) {
  throw new Error('Summative assessment must define a positive minimumActiveItemsPerCompetency.');
}

const questionById = new Map(questions.map((item) => [item.id, item]));
const plan = [];
const failures = [];

for (const bp of assessment.blueprint ?? []) {
  const competencyItems = questions.filter((item) =>
    item.competency === bp.competency && ['summative', 'credential'].includes(item.purpose)
  );
  const active = competencyItems.filter((item) => item.status === 'active');
  const needed = Math.max(0, minimumActive - active.length);
  const candidateEvaluations = competencyItems
    .filter((item) => item.status !== 'active')
    .map((item) => ({ item, result: evaluateAssessmentItemPromotion({ item, reviews, referenceIds }) }))
    .filter(({ result }) => result.eligible);
  const orderedCandidates = roundRobinByObjective(candidateEvaluations.map(({ item }) => item));
  const selected = orderedCandidates.slice(0, needed);

  if (selected.length < needed) {
    failures.push(`${bp.competency}: needs ${needed} additional active item(s) but only ${selected.length} reviewed promotable item(s) are available`);
  }

  plan.push({
    competency: bp.competency,
    formItemsRequired: bp.items,
    activeBefore: active.length,
    minimumActiveRequired: minimumActive,
    needed,
    reviewedPromotableAvailable: orderedCandidates.length,
    selected: selected.map((item) => ({
      id: item.id,
      version: item.version,
      objective: item.objective,
      difficulty: item.difficulty,
      type: item.type,
      fromStatus: item.status,
      approvedReviewId: evaluateAssessmentItemPromotion({ item, reviews, referenceIds }).approvedReviewId
    })),
    activeAfter: active.length + selected.length
  });
}

if (failures.length) {
  console.error('Cultivation Foundations active-pool promotion plan cannot satisfy the release minimum:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const selectedIds = plan.flatMap((row) => row.selected.map((item) => item.id));
if (new Set(selectedIds).size !== selectedIds.length) throw new Error('Promotion plan selected a duplicate assessment item.');

if (write) {
  for (const id of selectedIds) {
    const item = questionById.get(id);
    const result = evaluateAssessmentItemPromotion({ item, reviews, referenceIds });
    if (!result.eligible) throw new Error(`${id} became ineligible during promotion: ${result.failures.join('; ')}`);
    fs.writeFileSync(path.join(root, 'content/questions', `${id}.json`), `${JSON.stringify(result.promoted, null, 2)}\n`);
  }
}

const summary = {
  course: registry.course,
  releaseVersion: registry.version,
  assessment: registry.summativeAssessment,
  minimumActiveItemsPerCompetency: minimumActive,
  competencies: plan.length,
  activeBefore: plan.reduce((sum, row) => sum + row.activeBefore, 0),
  selectedForPromotion: selectedIds.length,
  activeAfter: plan.reduce((sum, row) => sum + row.activeAfter, 0),
  allCompetenciesMeetMinimumAfter: plan.every((row) => row.activeAfter >= minimumActive),
  write
};

console.log(JSON.stringify({ summary, competencies: plan }, null, 2));
