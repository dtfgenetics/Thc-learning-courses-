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
const agency = getArg('--agency', 'all').toLowerCase();
const limit = Math.max(1, Math.min(25, Number(getArg('--limit', '8')) || 8));
const outputPath = getArg('--output', 'automation/curriculum-ingestion/inbox/dataset-candidates.json');

if (!query) {
  console.error('Usage: node scripts/collect-government-datasets.mjs --query="..." [--lesson=LESSON-ID] [--agency=usda|osha|epa|all]');
  process.exit(2);
}

const key = process.env.DATA_GOV_API_KEY || 'DEMO_KEY';
const usingDemoKey = key === 'DEMO_KEY';
const url = new URL('https://api.gsa.gov/technology/datagov/v4/search');
url.searchParams.set('q', query);
url.searchParams.set('org_type', 'Federal Government');
url.searchParams.set('per_page', String(Math.min(25, Math.max(limit * 3, limit))));
url.searchParams.set('sort', 'relevance');

const response = await fetch(url, {
  headers: {
    'X-Api-Key': key,
    'user-agent': 'THC-Academy-Dataset-Collector/1.0 (+https://dtfseeds.com)'
  }
});
if (!response.ok) {
  console.error(`Data.gov request failed: HTTP ${response.status}`);
  process.exit(1);
}

const body = await response.json();
const patterns = {
  usda: /department of agriculture|\busda\b/i,
  osha: /occupational safety and health|department of labor|\bosha\b/i,
  epa: /environmental protection agency|\bepa\b/i
};

function publisherName(item) {
  if (typeof item.publisher === 'string') return item.publisher;
  if (typeof item.dcat?.publisher === 'string') return item.dcat.publisher;
  return item.dcat?.publisher?.name || item.organization?.name || '';
}

function distributions(item) {
  const values = Array.isArray(item.dcat?.distribution) ? item.dcat.distribution : [];
  return values.map((entry) => ({
    title: entry.title || null,
    format: entry.format || entry.mediaType || null,
    url: entry.downloadURL || entry.accessURL || null
  })).filter((entry) => entry.url);
}

const raw = Array.isArray(body.results) ? body.results : [];
const filtered = raw.filter((item) => {
  if (agency === 'all') return true;
  const pattern = patterns[agency];
  return pattern ? pattern.test(`${publisherName(item)} ${item.organization?.name || ''}`) : true;
});

const candidates = filtered.slice(0, limit).map((item) => {
  const dcat = item.dcat || {};
  const sourceUrl = dcat.landingPage || item.landingPage || item.harvest_record || item.harvest_record_raw;
  return {
    status: 'candidate',
    title: item.title || dcat.title || 'Untitled dataset',
    description: item.description || dcat.description || null,
    publisher: publisherName(item) || 'Unknown publisher',
    sourceUrl: sourceUrl || null,
    catalogUrl: item.slug ? `https://catalog.data.gov/dataset/${item.slug}` : null,
    identifier: item.identifier || dcat.identifier || null,
    license: dcat.license || null,
    modified: dcat.modified || null,
    lastHarvestedAt: item.last_harvested_date || null,
    keywords: item.keyword || dcat.keyword || [],
    distributions: distributions(item),
    lessonIds: lesson ? [lesson] : [],
    provenance: {
      sourceType: 'government-catalog',
      sourceId: 'datagov-v4',
      harvestRecord: item.harvest_record || null,
      harvestRecordRaw: item.harvest_record_raw || null
    },
    reviewRequired: true
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  query,
  agency,
  source: 'Data.gov Catalog API v4',
  usingDemoKey,
  warning: usingDemoKey ? 'DEMO_KEY is rate-limited and is for manual exploration only. Configure DATA_GOV_API_KEY for production automation.' : null,
  candidates
};

const full = path.join(root, outputPath);
fs.mkdirSync(path.dirname(full), {recursive: true});
fs.writeFileSync(full, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
