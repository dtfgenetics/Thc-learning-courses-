import assert from 'node:assert/strict';
import fs from 'node:fs';

const validator = fs.readFileSync('scripts/validate-reviews.mjs', 'utf8');
const statusReporter = fs.readFileSync('scripts/report-system-status.mjs', 'utf8');
const releaseChecker = fs.readFileSync('scripts/check-release-readiness.mjs', 'utf8');
const policy = fs.readFileSync('docs/AUTHORING-VALIDATION-BOUNDARY.md', 'utf8');

assert.match(validator, /staleReviewCount \+= 1/);
assert.doesNotMatch(validator, /objectVersion .* does not match .* current version/);
assert.match(validator, /published lesson .* missing approved/);
assert.match(validator, /active assessment item .* missing an approved assessment review record/);
assert.match(statusReporter, /WARN assessment review readiness drift/);
assert.doesNotMatch(statusReporter, /Assessment review readiness drift:.*process\.exit\(1\)/s);
assert.match(releaseChecker, /approved/);
assert.match(policy, /development is intentionally permissive during authoring and strict at release/i);
assert.match(policy, /Publication, production assessment activation, and credential issuance remain fail-closed/);

console.log('Authoring/release validation boundary regression passed.');
