import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const write = process.argv.includes('--write');
const analystArg = process.argv.find((arg) => arg.startsWith('--analyst='));
const analystId = analystArg ? analystArg.slice('--analyst='.length) : null;
if (write && (!analystId || analystId.length < 3)) {
  throw new Error('--write requires --analyst=<real-analyst-id> with at least 3 characters');
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ path: path.join(rel, name), value: readJson(path.join(rel, name)) }));
}

function templateFor(item, realAnalystId) {
  return {
    id: `PILOT-${item.id}-V${item.version}`,
    itemId: item.id,
    itemVersion: item.version,
    status: 'draft',
    sampleSize: 0,
    percentCorrect: null,
    discrimination: null,
    distractorSelection: (item.choices ?? []).map((_, choiceIndex) => ({ choiceIndex, count: 0, proportion: 0 })),
    omitRate: null,
    medianResponseTimeSeconds: null,
    responseTimeAnomalyRate: null,
    challengeHistory: [],
    analystId: realAnalystId,
    completedAt: null,
    notes: null
  };
}

const plannerOutput = execFileSync(process.execPath, [path.join(root, 'scripts/build-foundations-pilot-cohort.mjs')], {
  cwd: root,
  encoding: 'utf8'
});
const planner = JSON.parse(plannerOutput);
const cohortSelectionComplete = planner.summary?.selectionComplete === true;
if (write && !cohortSelectionComplete) {
  throw new Error(`Pilot staging writes are blocked because the current-QA-clean cohort is incomplete: ${(planner.summary?.errors ?? []).join('; ')}`);
}

const readiness = readJson('registry/system-readiness.json');
const humanAssessmentReviewComplete = readiness.areas?.assessment?.gates?.humanAssessmentReviewComplete === true;
if (write && !humanAssessmentReviewComplete) {
  throw new Error('Pilot staging writes are blocked until registry/system-readiness.json records humanAssessmentReviewComplete=true from real review evidence.');
}

const questionEntries = readDirJson('content/questions');
const questionsById = new Map(questionEntries.map((entry) => [entry.value.id, entry]));
const pilotEntries = readDirJson('content/pilot-evidence');
const pilotByItemVersion = new Map(pilotEntries.map((entry) => [`${entry.value.itemId}@${entry.value.itemVersion}`, entry]));

const actions = [];
for (const selected of planner.cohort) {
  const entry = questionsById.get(selected.id);
  if (!entry || String(entry.value.version) !== String(selected.version)) {
    throw new Error(`Cannot resolve selected item ${selected.id}@${selected.version}`);
  }
  const item = entry.value;
  const key = `${item.id}@${item.version}`;
  const existingEvidence = pilotByItemVersion.get(key)?.value ?? null;
  actions.push({
    itemId: item.id,
    itemVersion: item.version,
    competency: selected.competency,
    currentStatus: item.status,
    existingPilotEvidenceId: existingEvidence?.id ?? null,
    existingPilotEvidenceStatus: existingEvidence?.status ?? null,
    needsDraftEvidence: !existingEvidence,
    needsPilotStatus: !['pilot', 'active'].includes(item.status)
  });
}

if (write) {
  const pilotDir = path.join(root, 'content/pilot-evidence');
  fs.mkdirSync(pilotDir, { recursive: true });
  for (const action of actions) {
    const entry = questionsById.get(action.itemId);
    const item = entry.value;
    if (action.needsDraftEvidence) {
      const record = templateFor(item, analystId);
      const target = path.join(pilotDir, `${record.id}.json`);
      if (fs.existsSync(target)) throw new Error(`Refusing to overwrite existing pilot evidence ${path.relative(root, target)}`);
      fs.writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`);
      pilotByItemVersion.set(`${item.id}@${item.version}`, { path: path.relative(root, target), value: record });
    }
    if (action.needsPilotStatus) {
      if (['flagged', 'retired'].includes(item.status)) throw new Error(`Refusing to move ${item.id} from ${item.status} into pilot`);
      const updated = { ...item, status: 'pilot' };
      fs.writeFileSync(path.join(root, entry.path), `${JSON.stringify(updated)}\n`);
      entry.value = updated;
    }
  }
}

const summary = {
  course: planner.summary.course,
  releaseVersion: planner.summary.releaseVersion,
  assessment: planner.summary.assessment,
  write,
  analystRequiredForWrite: true,
  cohortSelectionComplete,
  cohortBlockers: planner.summary?.errors ?? [],
  currentHighSeverityQaExclusions: planner.summary?.currentHighSeverityQaExclusions ?? 0,
  humanAssessmentReviewComplete,
  stageable: cohortSelectionComplete && humanAssessmentReviewComplete,
  writeBlockedByCohortGate: !cohortSelectionComplete,
  writeBlockedByReviewGate: !humanAssessmentReviewComplete,
  selectedItems: actions.length,
  itemsWithExistingPilotEvidence: actions.filter((action) => !action.needsDraftEvidence).length,
  itemsNeedingDraftEvidence: actions.filter((action) => action.needsDraftEvidence).length,
  itemsAlreadyPilot: actions.filter((action) => action.currentStatus === 'pilot').length,
  itemsAlreadyActive: actions.filter((action) => action.currentStatus === 'active').length,
  itemsNeedingPilotStatus: actions.filter((action) => action.needsPilotStatus).length,
  writesPerformed: write ? {
    draftEvidenceCreated: actions.filter((action) => action.needsDraftEvidence).length,
    itemsMovedToPilot: actions.filter((action) => action.needsPilotStatus).length
  } : null,
  safeguards: [
    'cohort candidates must have an exact-version approved assessment review',
    'cohort candidates must be reference-clean and free of current high-severity item-construction flags',
    'an incomplete cohort is reportable in dry-run mode but can never be staged in write mode',
    'write mode remains blocked until human assessment review is complete',
    'write mode requires an explicit real analyst ID',
    'new pilot evidence is draft-only with zero responses and no fabricated statistics',
    'existing pilot evidence is never overwritten',
    'active items are never demoted',
    'flagged or retired items are never moved into pilot'
  ]
};

console.log(JSON.stringify({ summary, actions }, null, 2));
