import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const q=JSON.parse(execFileSync(process.execPath,['scripts/report-item-activation-work-queue.mjs','--json'],{encoding:'utf8'}));
assert.equal(q.assessmentId,'ASSESS-CULT-FOUNDATIONS-FINAL-001');
assert.equal(q.summary.competencies,12);
assert.equal(q.summary.competenciesWithCandidateDepth,12,'all 12 competency pools must retain candidate-depth coverage');
assert.equal(q.summary.minimumActiveItemsPerCompetency,15);
for(const row of q.competencies){
  assert.ok(row.candidateCount>=15,`${row.competency}: candidate depth regressed`);
  assert.equal(row.activationDeficit,Math.max(0,15-row.activeCount));
  assert.equal(row.activeDepthMet,row.activeCount>=15);
  assert.ok(Array.isArray(row.priorityCandidateItemIds));
  assert.ok(row.activationEvidenceRequired.some(x=>/human assessment review/i.test(x)));
  assert.ok(row.activationEvidenceRequired.some(x=>/pilot/i.test(x)));
  assert.ok(row.activationEvidenceRequired.some(x=>/secure operational assessment-store/i.test(x)));
}
assert.equal(q.summary.operationalPoolReady,q.competencies.every(x=>x.activeDepthMet));
console.log('Cultivation Foundations item activation work queue: PASS (12 competency pools, exact active deficits, fail-closed activation dependencies).');
