import fs from 'node:fs/promises';
import path from 'node:path';
import {
  WEB_QA_ARTIFACT_DIR,
  WEB_QA_BASE_URL,
  WEB_QA_ENFORCE,
  WEB_QA_ROUTE_FILE,
} from '../web-qa.config.mjs';

const routeFile = process.env.WEB_QA_ROUTE_FILE || WEB_QA_ROUTE_FILE;
const artifactDir = process.env.WEB_QA_ARTIFACT_DIR || WEB_QA_ARTIFACT_DIR;
const enforce = process.env.WEB_QA_ENFORCE === '1' || WEB_QA_ENFORCE;
const baseOrigin = new URL(process.env.WEB_QA_BASE_URL || WEB_QA_BASE_URL).origin;
const reportPath = path.join(artifactDir, 'route-health.json');

function stripMarkup(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstPartyAssets(html, route) {
  const assets = new Set();
  const patterns = [
    /<(?:img|script|source)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
    /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[1]?.trim();
      if (!raw || /^(data:|blob:|javascript:|mailto:|tel:)/i.test(raw)) continue;
      try {
        const url = new URL(raw, route);
        if (url.origin === baseOrigin) {
          url.hash = '';
          assets.add(url.toString());
        }
      } catch {}
    }
  }

  return [...assets].slice(0, 100);
}

async function request(url, method = 'GET') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'DTFSeeds-Deterministic-Web-QA/1.0' },
    });
    const contentType = response.headers.get('content-type') || '';
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType,
      body: method === 'GET' ? await response.text() : '',
    };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: url, contentType: '', body: '', error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAsset(url) {
  let result = await request(url, 'HEAD');
  if (result.status === 405 || result.status === 501) result = await request(url, 'GET');
  if (!result.ok) return `${result.status || 'fetch-error'} ${url}${result.error ? ` (${result.error})` : ''}`;
  return null;
}

let manifest;
try {
  manifest = JSON.parse(await fs.readFile(routeFile, 'utf8'));
} catch (error) {
  console.error(`Route manifest unavailable: ${routeFile}`);
  console.error(String(error));
  process.exit(1);
}

const routes = Array.isArray(manifest.routes) && manifest.routes.length
  ? manifest.routes
  : [process.env.WEB_QA_BASE_URL || WEB_QA_BASE_URL];

const results = [];
let findingCount = 0;

for (const route of routes) {
  const findings = [];
  const response = await request(route, 'GET');

  if (!response.ok || response.status >= 400) {
    findings.push(`navigation: ${response.status || 'fetch-error'}${response.error ? ` ${response.error}` : ''}`);
  }

  const isHtml = /\btext\/html\b/i.test(response.contentType) || /<!doctype\s+html|<html[\s>]/i.test(response.body.slice(0, 5000));
  if (!isHtml) findings.push(`content-type: expected HTML, received ${response.contentType || 'unknown'}`);

  if (response.body) {
    const visibleText = stripMarkup(response.body);
    if (visibleText.length <= 20) findings.push(`content: only ${visibleText.length} characters after markup removal`);
    if (!/<(?:main\b|h1\b)|\brole\s*=\s*["']main["']/i.test(response.body)) {
      findings.push('semantics: no main landmark, role=main, or h1 in server HTML');
    }

    const assetFailures = [];
    for (const asset of firstPartyAssets(response.body, response.finalUrl || route)) {
      const failure = await checkAsset(asset);
      if (failure) assetFailures.push(failure);
      if (assetFailures.length >= 20) break;
    }
    for (const failure of assetFailures) findings.push(`asset: ${failure}`);
  }

  findingCount += findings.length;
  results.push({
    route,
    finalUrl: response.finalUrl,
    status: response.status,
    findings,
  });

  if (findings.length) {
    console.error(`Route health findings for ${route}:`);
    for (const finding of findings) console.error(`  - ${finding}`);
  } else {
    console.log(`OK ${response.status} ${route}`);
  }
}

await fs.mkdir(artifactDir, { recursive: true });
await fs.writeFile(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  findingCount,
  enforce,
  results,
}, null, 2) + '\n');

console.log(`Checked ${routes.length} routes; ${findingCount} finding(s). Report: ${reportPath}`);
if (enforce && findingCount > 0) process.exit(1);
