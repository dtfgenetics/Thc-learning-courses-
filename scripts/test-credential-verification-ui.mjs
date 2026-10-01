import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const path = 'apps/web/public/portal.js';
const source = fs.readFileSync(path, 'utf8');
const syntax = spawnSync(process.execPath, ['--check', path], { encoding:'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);

assert.ok(source.includes("record.valid !== true || !['issued','valid'].includes(record.status)"), 'certificate printing must fail closed when public verification says invalid');
assert.ok(source.includes("record.valid === true && ['issued','valid'].includes(record.status)"), 'verification UI must only show print action for computed-valid credentials');
assert.ok(source.includes("'Not currently valid'"), 'verification UI must visibly distinguish invalid credentials');
assert.ok(source.includes("'Verified active'"), 'verification UI must visibly identify active verified credentials');
assert.ok(source.includes('appendCredentialQr'), 'printable certificate must retain QR verification support');

console.log('Credential verification UI validity tests passed.');
