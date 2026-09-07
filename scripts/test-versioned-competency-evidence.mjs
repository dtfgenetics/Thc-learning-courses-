import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createAssessmentDeliveryService } from '../apps/api/src/assessment-delivery.mjs';

const root = process.cwd();
const service = createAssessmentDeliveryService({ root, allowDraft: true });
const assessmentId = 'ASSESS-CULT-FOUNDATIONS-FINAL-001';
const { attempt, selected } = service.start({ learnerId: 'subject-version-test', assessmentId, seed: 'competency-version-snapshot' });

assert.equal(attempt.items.length, 60);
for (const item of attempt.items) {
  assert.match(String(item.competencyVersion ?? ''), /^\d+\.\d+\.\d+$/, `${item.competency} must have a snapshotted semantic version`);
  const competency = JSON.parse(fs.readFileSync(path.join(root, 'content/competencies', `${item.competency}.json`), 'utf8'));
  assert.equal(item.competencyVersion, String(competency.version));
}

const selectedByKey = new Map(selected.map((item) => [`${item.id}@${item.version}`, item]));
const publicStarted = service.publicView(attempt);
const responses = publicStarted.items.map((publicItem) => {
  const canonical = selectedByKey.get(`${publicItem.itemId}@${publicItem.itemVersion}`);
  let response;
  if (canonical.type === 'numeric') response = canonical.correct;
  else if (canonical.type === 'multiple-response') response = canonical.correct.map((index) => publicItem.choices.indexOf(canonical.choices[index]));
  else response = publicItem.choices.indexOf(canonical.choices[canonical.correct]);
  return { itemId: publicItem.itemId, itemVersion: publicItem.itemVersion, response };
});

const { scored, competencyResults } = service.submitAndScore({ attempt, responses });
assert.equal(scored.scorePercent, 100);
assert.ok(competencyResults.length > 0);
for (const result of competencyResults) {
  assert.match(String(result.competencyVersion ?? ''), /^\d+\.\d+\.\d+$/);
  assert.equal(result.masteryLevel, 'demonstrated');
}

const publicScored = service.publicView(scored);
assert.equal(publicScored.competencies.length, competencyResults.length);
for (const result of publicScored.competencies) {
  assert.match(String(result.competencyVersion ?? ''), /^\d+\.\d+\.\d+$/);
}

console.log('Versioned competency evidence delivery tests passed.');
