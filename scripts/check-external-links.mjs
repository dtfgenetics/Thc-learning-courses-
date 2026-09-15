import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};

const registryPath = getArg('--registry', 'registry/LINKS.json');
const outputPath = getArg('--output');
const timeoutMs = Number(getArg('--timeout-ms', '15000'));
const check = args.includes('--check');

const registry = JSON.parse(fs.readFileSync(path.join(root, registryPath), 'utf8'));
const links = Array.isArray(registry.links) ? registry.links : [];

async function inspect(link) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(link.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'THC-Academy-Link-Checker/1.0 (+https://dtfseeds.com)'
      }
    });
    clearTimeout(timer);
    const finalUrl = response.url || link.url;
    const ok = response.status >= 200 && response.status < 400;
    return {
      id: link.id,
      requestedUrl: link.url,
      finalUrl,
      httpStatus: response.status,
      contentType: response.headers.get('content-type'),
      checkedAt,
      healthy: ok,
      redirected: finalUrl !== link.url,
      proposedStatus: ok ? 'verified' : (response.status >= 400 && response.status < 500 ? 'broken' : 'candidate')
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      id: link.id,
      requestedUrl: link.url,
      finalUrl: null,
      httpStatus: null,
      contentType: null,
      checkedAt,
      healthy: false,
      redirected: false,
      proposedStatus: 'candidate',
      error: error.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : error.message
    };
  }
}

const results = [];
for (const link of links) results.push(await inspect(link));

const report = {
  generatedAt: new Date().toISOString(),
  registry: registryPath,
  total: results.length,
  healthy: results.filter((item) => item.healthy).length,
  unhealthy: results.filter((item) => !item.healthy).length,
  results
};

console.log(JSON.stringify(report, null, 2));
if (outputPath) {
  const full = path.join(root, outputPath);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  fs.writeFileSync(full, `${JSON.stringify(report, null, 2)}\n`);
}

if (check && report.unhealthy > 0) process.exit(1);
