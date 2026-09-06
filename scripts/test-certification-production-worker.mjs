import assert from 'node:assert/strict';
import { buildWorkerReport, collectBlockers, selectNextTask } from './lib/production-worker-core.mjs';

const registry = {
  system: 'THC Academy',
  version: 'test',
  productionReady: false,
  areas: {
    curriculum: {
      gates: {
        substantiveContentComplete: true,
        scientificReviewComplete: false,
        editorialReviewComplete: false
      }
    },
    assessment: {
      gates: {
        blueprintComplete: true,
        minimumActivePoolComplete: false
      }
    },
    runtime: { gates: { productionPersistenceAdapter: false } },
    api: { gates: {} },
    credentials: { gates: {} },
    security: { gates: {} },
    accessibility: { gates: {} },
    operations: { gates: {} }
  }
};

const blockers = collectBlockers(registry);
assert.equal(blockers.length, 4);
assert.equal(blockers[0].gate, 'scientificReviewComplete');
assert.equal(blockers[0].mode, 'certify');

const next = selectNextTask(registry, []);
assert.equal(next.disposition, 'start');
assert.equal(next.gate, 'scientificReviewComplete');
assert.equal(next.branch, 'work/curriculum-scientific-review-complete');

const resumed = selectNextTask(registry, [
  { branch: 'reviews/curriculum', pr: 50, area: 'curriculum', gate: 'scientificReviewComplete', state: 'open' }
]);
assert.equal(resumed.disposition, 'resume');
assert.equal(resumed.branch, 'reviews/curriculum');
assert.equal(resumed.pr, 50);

const completeRegistry = {
  system: 'THC Academy',
  version: 'test',
  productionReady: true,
  areas: Object.fromEntries(
    ['curriculum', 'assessment', 'credentials', 'runtime', 'api', 'security', 'accessibility', 'operations']
      .map((area) => [area, { gates: {} }])
  )
};
const complete = buildWorkerReport(completeRegistry, []);
assert.equal(complete.blockerCount, 0);
assert.equal(complete.nextTask.disposition, 'release-check');
assert.equal(complete.nextTask.mode, 'release');

console.log('Certification production worker tests passed.');
