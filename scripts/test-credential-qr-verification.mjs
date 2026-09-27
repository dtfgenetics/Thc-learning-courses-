import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const portal = fs.readFileSync('apps/web/public/portal.js', 'utf8');
const css = fs.readFileSync('apps/web/public/portal.css', 'utf8');
const server = fs.readFileSync('apps/web/server.mjs', 'utf8');
const vendor = fs.readFileSync('apps/web/public/vendor/qrcode.min.js', 'utf8');

assert.ok(vendor.length > 10000, 'Vendored QRCode.js runtime is unexpectedly small or missing.');
assert.match(html, /<script src="\/vendor\/qrcode\.min\.js"><\/script>/, 'Academy shell must load the vendored QR runtime.');
assert.ok(server.includes("['/vendor/qrcode.min.js'"), 'Academy web server must serve the vendored QR runtime.');

for (const token of [
  'function credentialVerificationUrl',
  "url.searchParams.set('verify'",
  'function appendCredentialQr',
  'globalThis.QRCode',
  'Scan to verify',
  'print-certificate-verification-url',
  "new URLSearchParams(window.location.search).get('verify')",
  'form.requestSubmit()'
]) {
  assert.ok(portal.includes(token), `Credential QR/deep-link contract missing: ${token}`);
}

for (const token of [
  '.print-certificate-verification {',
  '.print-certificate-qr-code',
  '.print-certificate-verification-url'
]) {
  assert.ok(css.includes(token), `Printable credential QR styling missing: ${token}`);
}

assert.ok(
  portal.includes("fetch(\`/api/v1/credentials/\${encodeURIComponent(id)}\`"),
  'Deep-linked verification must continue using the existing public verification endpoint.'
);
for (const forbidden of ['subjectHash', 'payloadHash', 'assessmentEvidence', 'integrityHash']) {
  assert.equal(portal.includes(`searchParams.set('${forbidden}'`), false, `QR URL must not encode private field ${forbidden}`);
}

console.log('Credential QR verification contracts passed.');
