import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};

const query = getArg('--query');
const lesson = getArg('--lesson');
const limit = Math.max(1, Math.min(25, Number(getArg('--limit', '8')) || 8));
const outputPath = getArg('--output', 'automation/curriculum-ingestion/inbox/media-candidates.json');

if (!query) {
  console.error('Usage: node scripts/collect-wikimedia-media.mjs --query="..." [--lesson=LESSON-ID]');
  process.exit(2);
}

const url = new URL('https://commons.wikimedia.org/w/api.php');
url.searchParams.set('action', 'query');
url.searchParams.set('format', 'json');
url.searchParams.set('formatversion', '2');
url.searchParams.set('generator', 'search');
url.searchParams.set('gsrsearch', query);
url.searchParams.set('gsrnamespace', '6');
url.searchParams.set('gsrlimit', String(limit));
url.searchParams.set('prop', 'imageinfo');
url.searchParams.set('iiprop', 'url|mime|size|extmetadata');
url.searchParams.set('iiurlwidth', '1600');

const response = await fetch(url, {
  headers: {
    'user-agent': 'THC-Academy-Media-Collector/1.0 (+https://dtfseeds.com)'
  }
});
if (!response.ok) {
  console.error(`Wikimedia Commons request failed: HTTP ${response.status}`);
  process.exit(1);
}

const body = await response.json();
const pages = Array.isArray(body.query?.pages) ? body.query.pages : [];

function meta(info, key) {
  const value = info?.extmetadata?.[key]?.value;
  if (value == null) return null;
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const candidates = pages.map((page) => {
  const info = page.imageinfo?.[0] || {};
  const licenseShortName = meta(info, 'LicenseShortName');
  const licenseUrl = meta(info, 'LicenseUrl');
  const usageTerms = meta(info, 'UsageTerms');
  const restrictions = meta(info, 'Restrictions');
  return {
    status: 'candidate',
    title: page.title || null,
    descriptionUrl: info.descriptionurl || null,
    originalUrl: info.url || null,
    previewUrl: info.thumburl || null,
    mime: info.mime || null,
    width: info.width || null,
    height: info.height || null,
    artist: meta(info, 'Artist'),
    credit: meta(info, 'Credit'),
    description: meta(info, 'ImageDescription'),
    licenseShortName,
    licenseUrl,
    usageTerms,
    restrictions,
    attributionRequired: meta(info, 'AttributionRequired'),
    copyrightStatus: meta(info, 'Copyrighted'),
    lessonIds: lesson ? [lesson] : [],
    provenance: {
      sourceType: 'wikimedia-commons',
      pageId: page.pageid || null,
      sourcePage: info.descriptionurl || null
    },
    licenseReviewRequired: true,
    factualReviewRequired: true,
    publishable: false
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  query,
  source: 'Wikimedia Commons Action API',
  candidates
};

const full = path.join(root, outputPath);
fs.mkdirSync(path.dirname(full), {recursive: true});
fs.writeFileSync(full, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
