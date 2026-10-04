import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/release.yml', 'utf8');

assert.match(workflow, /packages:\s*write/, 'release workflow must have packages: write permission');
assert.match(workflow, /docker\/login-action@/, 'release workflow must authenticate to a container registry');
assert.match(workflow, /docker\/build-push-action@/, 'release workflow must build and publish the production container');
assert.match(workflow, /deploy\/Dockerfile\.production/, 'release workflow must use deploy/Dockerfile.production');
assert.match(workflow, /ghcr\.io\//, 'release workflow must publish to GHCR');
assert.match(workflow, /github\.sha/, 'release image must be traceable to the exact Git commit');

const releaseCheck = workflow.indexOf('Run release readiness gate');
const buildPush = workflow.indexOf('docker/build-push-action@');
assert.ok(releaseCheck >= 0 && buildPush > releaseCheck, 'container publication must happen only after release readiness passes');

console.log('Release container publication contract: PASS');
