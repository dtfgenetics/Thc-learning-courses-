import assert from 'node:assert/strict';
import { buildWorkerReport, collectBlockers, selectNextTask } from './lib/production-worker-core.mjs';

const registry = {
  system: 'THC Academy',
  version: 'test',
  productionReady: false,
  areas: {
    curriculum: {
      gates: {
        substantiveContentComplete: false,
        catalogExpansionComplete: false,
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
assert.equal(blockers.length, 6);
assert.equal(blockers[0].gate, 'substantiveContentComplete');
assert.equal(blockers[0].mode, 'author');
assert.equal(blockers[1].gate, 'catalogExpansionComplete');
assert.equal(blockers[1].mode, 'author');

const next = selectNextTask(registry, []);
assert.equal(next.disposition, 'start');
assert.equal(next.gate, 'substantiveContentComplete');
assert.equal(next.branch, 'work/curriculum-substantive-content-complete');

const resumed = selectNextTask(registry, [
  { branch: 'content/catalog-expansion', pr: 50, area: 'curriculum', gate: 'substantiveContentComplete', state: 'open' }
]);
assert.equal(resumed.disposition, 'resume');
assert.equal(resumed.branch, 'content/catalog-expansion');
assert.equal(resumed.pr, 50);

const assessmentRegistry = {
  system: 'THC Academy',
  version: 'test',
  productionReady: false,
  areas: {
    curriculum: { gates: { substantiveContentComplete: true, catalogExpansionComplete: true, scientificReviewComplete: true, editorialReviewComplete: true } },
    assessment: {
      gates: {
        blueprintComplete: true,
        developmentFormGeneration: true,
        minimumActivePoolComplete: false,
        humanAssessmentReviewComplete: false,
        pilotStatisticsComplete: false
      }
    },
    credentials: { gates: {} },
    runtime: { gates: {} },
    api: { gates: {} },
    security: { gates: {} },
    accessibility: { gates: {} },
    operations: { gates: {} }
  }
};

const assessmentBlockers = collectBlockers(assessmentRegistry);
assert.deepEqual(
  assessmentBlockers.slice(0, 3).map((row) => row.gate),
  ['minimumActivePoolComplete', 'humanAssessmentReviewComplete', 'pilotStatisticsComplete']
);
const assessmentNext = selectNextTask(assessmentRegistry, []);
assert.equal(assessmentNext.gate, 'minimumActivePoolComplete');
assert.equal(assessmentNext.mode, 'exam');
assert.equal(assessmentNext.branch, 'work/assessment-minimum-active-pool-complete');

const postPoolRegistry = structuredClone(assessmentRegistry);
postPoolRegistry.areas.assessment.gates.minimumActivePoolComplete = true;
const postPoolNext = selectNextTask(postPoolRegistry, []);
assert.equal(postPoolNext.gate, 'humanAssessmentReviewComplete');
assert.equal(postPoolNext.mode, 'certify');
assert.equal(postPoolNext.branch, 'work/assessment-human-assessment-review-complete');

const postReviewRegistry = structuredClone(postPoolRegistry);
postReviewRegistry.areas.assessment.gates.humanAssessmentReviewComplete = true;
const postReviewNext = selectNextTask(postReviewRegistry, []);
assert.equal(postReviewNext.gate, 'pilotStatisticsComplete');
assert.equal(postReviewNext.mode, 'certify');
assert.equal(postReviewNext.branch, 'work/assessment-pilot-statistics-complete');

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
