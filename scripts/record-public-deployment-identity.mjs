import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const has = (name) => args.includes(name);
const baseUrl = (value('--base-url') ?? 'https://dtfseeds.com').replace(/\/$/, '');
const expectedSha = value('--expected-sha');
const write = has('--write');

if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(expectedSha ?? '')) {
  console.error('A full 40- or 64-character --expected-sha is required.');
  process.exit(2);
}

const response = await fetch(`${baseUrl}/api/build-info`, {
  headers: { accept: 'application/json', 'user-agent': 'thc-academy-deployment-ledger/1.0' }
});
if (!response.ok) {
  console.error(JSON.stringify({ verified: false, status: response.status, url: `${baseUrl}/api/build-info` }, null, 2));
  process.exit(1);
}
const identity = await response.json();
const verified = identity?.exactIdentityAvailable === true
  && typeof identity.buildId === 'string'
  && identity.buildId.length > 0
  && typeof identity.sourceSha === 'string'
  && identity.sourceSha.toLowerCase() === expectedSha.toLowerCase();

if (!verified) {
  console.error(JSON.stringify({
    verified: false,
    expectedSourceSha: expectedSha.toLowerCase(),
    observedBuildId: identity?.buildId ?? null,
    observedSourceSha: identity?.sourceSha ?? null
  }, null, 2));
  process.exit(1);
}

const ledgerPaths = [
  ...Array.from({ length: 6 }, (_, i) => `registry/course${i + 2}-deployment-evidence.json`),
  ...Array.from({ length: 8 }, (_, i) => `registry/tech2-course${i + 1}-deployment-evidence.json`)
];
const completionPaths = [
  ...Array.from({ length: 6 }, (_, i) => `registry/course${i + 2}-completion-status.json`),
  ...Array.from({ length: 8 }, (_, i) => `registry/tech2-course${i + 1}-completion-status.json`)
];

const updatedLedgers = [];
for (const rel of ledgerPaths) {
  const file = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.exactDeploymentBuildId = identity.buildId;
  data.exactDeploymentSourceSha = identity.sourceSha.toLowerCase();
  data.curriculumSource = `dtfgenetics/Thc-learning-courses-@${identity.sourceSha.toLowerCase()}`;
  data.curriculumSourceShaPinnedByDeployment = true;
  data.buildIdentityVerifiedAt = new Date().toISOString();
  data.buildIdentityEndpoint = `${baseUrl}/api/build-info`;
  data.evidenceState = data.responsiveManualQaApproved === true
    ? 'public-readback-build-identity-and-manual-responsive-qa-verified'
    : 'public-readback-and-build-identity-verified-manual-responsive-qa-open';
  data.note = 'Anonymous learner routes, representative lesson/assessment readback, the training/credential boundary, and exact Academy build identity were verified against the pinned curriculum source SHA. Manual responsive/accessibility approval, pilot/practical validity, standard setting, and credential release approval remain open.';
  if (write) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  updatedLedgers.push(rel);
}

const identityAction = /(exact deployment build\/source SHA|deployment build\/source SHA|deployment build.*source SHA|record and verify the exact deployment build|record the exact deployment build|pin or otherwise prove exact curriculum-version equivalence)/i;
const updatedCompletionLedgers = [];
for (const rel of completionPaths) {
  const file = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Array.isArray(data.nextMachineActions)) {
    data.nextMachineActions = data.nextMachineActions.filter((action) => !identityAction.test(String(action)));
  }
  if (typeof data.machineCompletionBoundary === 'string') {
    data.machineCompletionBoundary = data.machineCompletionBoundary
      .replace(/Exact DTFSeeds deployment workflow\/site-commit identity is now verified\./i, 'Exact DTFSeeds deployment build/source identity and pinned curriculum-version equivalence are now verified.')
      .replace(/,? exact deployment build\/source SHA verification using the public build-identity contract,? ?/i, ', ')
      .replace(/curriculum-version equivalence where a deployment did not pin the curriculum SHA, and /i, '')
      .replace(/Remaining machine work is deployed responsive\/manual learner-surface QA, and repair/i, 'Remaining machine work is deployed responsive/manual learner-surface QA and repair')
      .replace(/Remaining machine work is deployed responsive\/manual learner-surface QA, repair/i, 'Remaining machine work is deployed responsive/manual learner-surface QA and repair')
      .replace(/Remaining work is deployed responsive\/manual learner-surface QA, and repair/i, 'Remaining machine work is deployed responsive/manual learner-surface QA and repair');
  }
  data.deploymentIdentity = {
    state: 'verified',
    buildId: identity.buildId,
    sourceSha: identity.sourceSha.toLowerCase(),
    endpoint: `${baseUrl}/api/build-info`
  };
  if (write) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  updatedCompletionLedgers.push(rel);
}

console.log(JSON.stringify({
  verified: true,
  write,
  checkedAt: new Date().toISOString(),
  buildId: identity.buildId,
  sourceSha: identity.sourceSha.toLowerCase(),
  deploymentLedgers: updatedLedgers,
  completionLedgers: updatedCompletionLedgers
}, null, 2));
