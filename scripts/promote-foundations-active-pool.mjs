#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { evaluateAssessmentItemPromotion } from './lib/assessment-item-promotion.mjs';
import { loadPilotEvidencePolicy } from './pilot-evidence-quality.mjs';

const root = process.cwd();
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function writeJson(rel, value) {
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
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

const registryPath = 'registry/cultivation-foundations.json';
const systemReadinessPath = 'registry/system-readiness.json';
const registry = readJson(registryPath);
const assessment = readJson(`content/assessments/${registry.summativeAssessment}.json`);
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const pilotRecords = readDirJson('content/pilot-evidence');
const pilotPolicy = loadPilotEvidencePolicy(root);
const referenceIds = new Set(readDirJson('content/references').map((reference) => reference.id));
const minimumActive = assessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0;

if (!Number.isInteger(minimumActive) || minimumActive < 1) {
  throw new Error('Summative assessment must define a positive minimumActiveItemsPerCompetency.');
}

const questionById = new Map(questions.map((item) => [item.id, item]));
const plan = [];
const failures = [];

function evaluate(item) {
  return evaluateAssessmentItemPromotion({ item, reviews, referenceIds, pilotRecords, pilotPolicy });
}

for (const bp of assessment.blueprint ?? []) {
  const competencyItems = questions.filter((item) =>
    item.competency === bp.competency && ['summative', 'credential'].includes(item.purpose)
  );
  const active = competencyItems.filter((item) => item.status === 'active');
  const needed = Math.max(0, minimumActive - active.length);
  const candidateEvaluations = competencyItems
    .filter((item) => item.status !== 'active')
    .map((item) => ({ item, result: evaluate(item) }))
    .filter(({ result }) => result.eligible);
  const orderedCandidates = roundRobinByObjective(candidateEvaluations.map(({ item }) => item));
  const selected = orderedCandidates.slice(0, needed);

  if (selected.length < needed) {
    failures.push(`${bp.competency}: needs ${needed} additional active item(s) but only ${selected.length} pilot-qualified promotable item(s) are available`);
  }

  plan.push({
    competency: bp.competency,
    formItemsRequired: bp.items,
    activeBefore: active.length,
    minimumActiveRequired: minimumActive,
    needed,
    pilotQualifiedPromotableAvailable: orderedCandidates.length,
    selected: selected.map((item) => {
      const result = evaluate(item);
      return {
        id: item.id,
        version: item.version,
        objective: item.objective,
        difficulty: item.difficulty,
        type: item.type,
        fromStatus: item.status,
        approvedReviewId: result.approvedReviewId,
        qualifiedPilotEvidenceId: result.qualifiedPilotEvidenceId
      };
    }),
    activeAfter: active.length + selected.length
  });
}

const selectedIds = plan.flatMap((row) => row.selected.map((item) => item.id));
if (new Set(selectedIds).size !== selectedIds.length) throw new Error('Promotion plan selected a duplicate assessment item.');

const allCompetenciesMeetMinimumAfter = failures.length === 0 && plan.every((row) => row.activeAfter >= minimumActive);

if ((write || check) && failures.length) {
  console.error('Cultivation Foundations active-pool promotion is blocked by pilot qualification:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (write) {
  if (!allCompetenciesMeetMinimumAfter) throw new Error('Promotion plan does not satisfy the minimum active pool requirement.');
  for (const id of selectedIds) {
    const item = questionById.get(id);
    const result = evaluate(item);
    if (!result.eligible) throw new Error(`${id} became ineligible during promotion: ${result.failures.join('; ')}`);
    writeJson(path.join('content/questions', `${id}.json`), result.promoted);
  }

  registry.gates ??= {};
  registry.gates.approvedItemPoolsComplete = true;
  writeJson(registryPath, registry);

  const systemReadiness = readJson(systemReadinessPath);
  systemReadiness.areas ??= {};
  systemReadiness.areas.assessment ??= { status: 'review-in-progress', gates: {} };
  systemReadiness.areas.assessment.gates ??= {};
  systemReadiness.areas.assessment.gates.minimumActivePoolComplete = true;
  writeJson(systemReadinessPath, systemReadiness);
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
  allCompetenciesMeetMinimumAfter,
  blockedCompetencies: failures.length,
  blockers: failures,
  write,
  check
};

console.log(JSON.stringify({ summary, competencies: plan }, null, 2));
