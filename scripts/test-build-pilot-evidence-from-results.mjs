import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const questionDir = path.join(root, 'content/questions');
const sampleItem = fs.readdirSync(questionDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(fs.readFileSync(path.join(questionDir, name), 'utf8')))
  .find((item) => ['summative', 'credential'].includes(item.purpose) && Array.isArray(item.choices) && item.choices.length >= 2 && Number.isInteger(item.correct));
assert.ok(sampleItem, 'expected a keyed summative or credential item');

const correctChoice = sampleItem.correct;
const wrongChoice = Array.from({length: sampleItem.choices.length}, (_, index) => index).find((index) => index !== correctChoice);
assert.notEqual(wrongChoice, undefined, 'expected at least one distractor');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-pilot-'));
function writePayload(name, payload) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, JSON.stringify(payload));
  return file;
}
function runPayload(payload, ...extraArgs) {
  const file = writePayload(`payload-${Math.random().toString(16).slice(2)}.json`, payload);
  return spawnSync(process.execPath, ['scripts/build-pilot-evidence-from-results.mjs', '--input', file, ...extraArgs], { cwd: root, encoding: 'utf8' });
}

const payload = {
  cohortId: 'COHORT-TEST-001',
  analystId: 'ANALYST-TEST',
  completedAt: '2026-09-06T12:00:00Z',
  responses: [
    { participantId: 'P1', itemId: sampleItem.id, itemVersion: sampleItem.version, selectedChoiceIndex: correctChoice, correct: true, omitted: false, responseTimeSeconds: 32, responseTimeAnomaly: false, totalScore: 0.9 },
    { participantId: 'P2', itemId: sampleItem.id, itemVersion: sampleItem.version, selectedChoiceIndex: wrongChoice, correct: false, omitted: false, responseTimeSeconds: 44, responseTimeAnomaly: false, totalScore: 0.5 },
    { participantId: 'P3', itemId: sampleItem.id, itemVersion: sampleItem.version, selectedChoiceIndex: null, correct: false, omitted: true, responseTimeSeconds: 10, responseTimeAnomaly: true, totalScore: 0.3 }
  ]
};

const run = runPayload(payload, '--complete');
assert.equal(run.status, 0, run.stderr);
const output = JSON.parse(run.stdout);
assert.equal(output.records, 1);
assert.equal(output.status, 'complete');
assert.equal(output.wroteFiles, false);
assert.equal(output.participantLevelDataCommitted, false);
const evidence = output.evidence[0];
assert.equal(evidence.itemId, sampleItem.id);
assert.equal(evidence.itemVersion, sampleItem.version);
assert.equal(evidence.sampleSize, 3);
assert.equal(evidence.percentCorrect, 1 / 3);
assert.equal(evidence.omitRate, 1 / 3);
assert.equal(evidence.responseTimeAnomalyRate, 1 / 3);
assert.equal(evidence.medianResponseTimeSeconds, 32);
assert.equal(evidence.status, 'complete');
assert.ok(evidence.discrimination && evidence.discrimination.method === 'point-biserial');
assert.equal(evidence.distractorSelection.length, sampleItem.choices.length, 'all choices, including zero-count choices, must be represented');
assert.equal(evidence.distractorSelection.reduce((sum, row) => sum + row.count, 0), 2, 'choice counts must exclude the omitted response');
assert.equal(evidence.distractorSelection[correctChoice].count, 1);
assert.equal(evidence.distractorSelection[wrongChoice].count, 1);
assert.equal(evidence.distractorSelection[correctChoice].proportion, 0.5);
assert.equal(evidence.distractorSelection[wrongChoice].proportion, 0.5);
assert.equal(Object.hasOwn(evidence, 'participants'), false);
assert.equal(JSON.stringify(evidence).includes('participantId'), false);

const unknownRun = runPayload({ ...payload, responses: [{ ...payload.responses[0], itemId: 'ITEM-NOT-REAL' }] });
assert.notEqual(unknownRun.status, 0);
assert.match(unknownRun.stderr, /unknown item version/);

const duplicateRun = runPayload({ ...payload, responses: [payload.responses[0], { ...payload.responses[0] }] });
assert.notEqual(duplicateRun.status, 0);
assert.match(duplicateRun.stderr, /Duplicate participant\/item response/);

const wrongKeyRun = runPayload({ ...payload, responses: [{ ...payload.responses[0], selectedChoiceIndex: wrongChoice, correct: true }] });
assert.notEqual(wrongKeyRun.status, 0);
assert.match(wrongKeyRun.stderr, /correct does not match the keyed answer/);

const omittedChoiceRun = runPayload({ ...payload, responses: [{ ...payload.responses[2], selectedChoiceIndex: wrongChoice }] });
assert.notEqual(omittedChoiceRun.status, 0);
assert.match(omittedChoiceRun.stderr, /omitted but includes selectedChoiceIndex/);

const omittedCorrectRun = runPayload({ ...payload, responses: [{ ...payload.responses[2], correct: true }] });
assert.notEqual(omittedCorrectRun.status, 0);
assert.match(omittedCorrectRun.stderr, /omitted but correct is true/);

const outOfRangeRun = runPayload({ ...payload, responses: [{ ...payload.responses[0], selectedChoiceIndex: sampleItem.choices.length, correct: false }] });
assert.notEqual(outOfRangeRun.status, 0);
assert.match(outOfRangeRun.stderr, /selectedChoiceIndex is outside item choices/);

console.log(`Pilot evidence aggregation integrity tests passed for ${sampleItem.id}@${sampleItem.version}.`);
