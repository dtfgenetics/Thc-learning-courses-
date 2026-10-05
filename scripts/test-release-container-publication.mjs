import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/release.yml', 'utf8');

assert.match(workflow, /packages:\s*write/, 'release workflow must have packages: write permission');
assert.match(workflow, /id-token:\s*write/, 'release workflow must permit OIDC signing for provenance');
assert.match(workflow, /attestations:\s*write/, 'release workflow must permit artifact attestations');
assert.match(workflow, /docker\/login-action@/, 'release workflow must authenticate to a container registry');
assert.match(workflow, /docker\/build-push-action@/, 'release workflow must build and publish the production container');
assert.match(workflow, /deploy\/Dockerfile\.production/, 'release workflow must use deploy/Dockerfile.production');
assert.match(workflow, /ghcr\.io\//, 'release workflow must publish to GHCR');
assert.match(workflow, /github\.sha/, 'release image must be traceable to the exact Git commit');
assert.match(workflow, /id:\s*build/, 'container build must expose a stable step id');
assert.match(workflow, /actions\/attest@v4/, 'release workflow must generate a signed artifact attestation');
assert.match(workflow, /subject-name:\s*ghcr\.io\//, 'attestation must identify the GHCR image without a tag');
assert.match(workflow, /subject-digest:\s*\$\{\{\s*steps\.build\.outputs\.digest\s*\}\}/, 'attestation must bind to the exact container digest');
assert.match(workflow, /push-to-registry:\s*true/, 'attestation must be published with the container registry subject');

const releaseCheck = workflow.indexOf('Run release readiness gate');
const buildPush = workflow.indexOf('docker/build-push-action@');
const attest = workflow.indexOf('actions/attest@v4');
assert.ok(releaseCheck >= 0 && buildPush > releaseCheck, 'container publication must happen only after release readiness passes');
assert.ok(attest > buildPush, 'provenance must be generated only after the production image is built');

console.log('Release container publication contract: PASS');
