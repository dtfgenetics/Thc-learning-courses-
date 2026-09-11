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
        minimumActivePoolComplete: false,
        humanAssessmentReviewComplete: false,
        pilotStatisticsComplete: false
      }
    },
    runtime: { gates: { productionPersistenceAdapter: false } },
    api: { gates: { productionDatabaseIntegration: false } },
    credentials: { gates: { productionIssuerIdentity: false, productionSigning: false } },
    security: { gates: { securityReviewComplete: false } },
    accessibility: { gates: { contentAccessibilityReviewComplete: false } },
    operations: { gates: { stagingEnvironment: false, productionEnvironment: false } }
  }
};

const blockers = collectBlockers(registry);
assert.equal(blockers.length, 2);
assert.deepEqual(blockers.map((row) => row.gate), ['substantiveContentComplete', 'catalogExpansionComplete']);
assert.ok(blockers.every((row) => row.mode === 'author'));

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

const curriculumComplete = structuredClone(registry);
curriculumComplete.areas.curriculum.gates.substantiveContentComplete = true;
curriculumComplete.areas.curriculum.gates.catalogExpansionComplete = true;
const unrestricted = buildWorkerReport(curriculumComplete, []);
assert.equal(unrestricted.blockerCount, 0);
assert.equal(unrestricted.nextTask.disposition, 'release-check');
assert.equal(unrestricted.nextTask.mode, 'release');
assert.match(unrestricted.nextTask.reason, /No unfinished curriculum-content blockers remain/);

console.log('Certification production worker tests passed with review, pilot, item-pool, infrastructure, and publication gates non-blocking.');
