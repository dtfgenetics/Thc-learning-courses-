import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/live-production-verification.yml','utf8');

assert.match(workflow,/workflow_dispatch:/,'live verification must be manually invoked against a known deployment');
assert.match(workflow,/environment:\s*production/,'live verification must use the protected production environment');
assert.match(workflow,/ref:\s*\$\{\{\s*inputs\.source_sha\s*\}\}/,'workflow must check out the exact supplied source SHA');
assert.match(workflow,/verify-live-production-deployment\.mjs/,'workflow must run the canonical live verifier');
assert.match(workflow,/--base-url/,'workflow must bind verification to an explicit production URL');
assert.match(workflow,/--source-sha/,'workflow must bind verification to an exact source SHA');
assert.match(workflow,/actions\/upload-artifact@v7/,'workflow must preserve the verification output');
assert.match(workflow,/if:\s*always\(\)/,'workflow must preserve failure diagnostics as well as successful evidence');
assert.doesNotMatch(workflow,/secrets\./,'tokenless verification workflow must not consume repository secrets');

console.log('Live production verification workflow contract: PASS');
