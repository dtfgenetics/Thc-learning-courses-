import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { publicCredentialView } from '../../../packages/domain/credential-runtime.mjs';

const root = process.cwd();
const port = Number(process.env.PORT ?? 8787);
const credentialDefinition = JSON.parse(fs.readFileSync(path.join(root, 'content/credentials/CRED-CULT-FOUNDATIONS-001.json'), 'utf8'));

// Development adapter only. Production must replace this with PostgreSQL-backed storage.
const credentials = new Map();

export function registerCredentialForDevelopment(record) {
  if (process.env.NODE_ENV === 'production') throw new Error('Development credential adapter is disabled in production');
  credentials.set(record.verificationId, record);
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

export function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { ok: true });

  const match = url.pathname.match(/^\/api\/v1\/credentials\/([A-Za-z0-9_-]+)$/);
  if (req.method === 'GET' && match) {
    const record = credentials.get(match[1]);
    if (!record) return json(res, 404, { error: 'credential-not-found' });
    return json(res, 200, publicCredentialView(record, credentialDefinition));
  }

  return json(res, 404, { error: 'not-found' });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  http.createServer(handler).listen(port, () => console.log(`THC Academy API listening on :${port}`));
}
