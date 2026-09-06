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
  .find((item) => ['summative', 'credential'].includes(item.purpose));
assert.ok(sampleItem, 'expected a summative or credential item');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thc-pilot-'));
const input = path.join(tempDir, 'sample.pilot-results.json');
const payload = {
  cohortId: 'COHORT-TEST-001',
  analystId: 'ANALYST-TEST',
  completedAt: '2026-09-06T12:00:00Z',
  responses: [
    { participantId: 'P1', itemId: sampleItem.id, itemVersion: sampleItem.version, selectedChoiceIndex: 0, correct: true, omitted: false, responseTimeSeconds: 32, responseTimeAnomaly: false, totalScore: 0.9 },
    { participantId: 'P2', itemId: sampleItem.id, itemVersion: sampleItem.version, selectedChoiceIndex: 1, correct: false, omitted: false, responseTimeSeconds: 44, responseTimeAnomaly: false, totalScore: 0.5 },
    { participantId: 'P3', itemId: sampleItem.id, itemVersion: sampleItem.version, selectedChoiceIndex: null, correct: false, omitted: true, responseTimeSeconds: 10, responseTimeAnomaly: true, totalScore: 0.3 }
  ]
};
fs.writeFileSync(input, JSON.stringify(payload));

const run = spawnSync(process.execPath, ['scripts/build-pilot-evidence-from-results.mjs', '--input', input, '--complete'], { cwd: root, encoding: 'utf8' });
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
assert.equal(Object.hasOwn(evidence, 'participants'), false);
assert.equal(JSON.stringify(evidence).includes('participantId'), false);

const invalidPayload = { ...payload, responses: [{ ...payload.responses[0], itemId: 'ITEM-NOT-REAL' }] };
const invalid = path.join(tempDir, 'invalid.pilot-results.json');
fs.writeFileSync(invalid, JSON.stringify(invalidPayload));
const invalidRun = spawnSync(process.execPath, ['scripts/build-pilot-evidence-from-results.mjs', '--input', invalid], { cwd: root, encoding: 'utf8' });
assert.notEqual(invalidRun.status, 0);
assert.match(invalidRun.stderr, /unknown item version/);

console.log(`Pilot evidence aggregation tests passed for ${sampleItem.id}@${sampleItem.version}.`);
