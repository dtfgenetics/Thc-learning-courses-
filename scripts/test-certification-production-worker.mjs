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

const assessmentRegistry = {
  system: 'THC Academy',
  version: 'test',
  productionReady: false,
  areas: {
    curriculum: { gates: { substantiveContentComplete: true, scientificReviewComplete: true, editorialReviewComplete: true } },
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
  ['humanAssessmentReviewComplete', 'pilotStatisticsComplete', 'minimumActivePoolComplete']
);
const assessmentNext = selectNextTask(assessmentRegistry, []);
assert.equal(assessmentNext.gate, 'humanAssessmentReviewComplete');
assert.equal(assessmentNext.mode, 'certify');
assert.equal(assessmentNext.branch, 'work/assessment-human-assessment-review-complete');

const postReviewRegistry = structuredClone(assessmentRegistry);
postReviewRegistry.areas.assessment.gates.humanAssessmentReviewComplete = true;
const postReviewNext = selectNextTask(postReviewRegistry, []);
assert.equal(postReviewNext.gate, 'pilotStatisticsComplete');
assert.equal(postReviewNext.mode, 'certify');
assert.equal(postReviewNext.branch, 'work/assessment-pilot-statistics-complete');

const postPilotRegistry = structuredClone(postReviewRegistry);
postPilotRegistry.areas.assessment.gates.pilotStatisticsComplete = true;
const postPilotNext = selectNextTask(postPilotRegistry, []);
assert.equal(postPilotNext.gate, 'minimumActivePoolComplete');
assert.equal(postPilotNext.mode, 'exam');
assert.equal(postPilotNext.branch, 'work/assessment-minimum-active-pool-complete');

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
