import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const hit = args.find((value) => value.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};

const query = arg('--query');
const lessonId = arg('--lesson');
const limit = Math.min(20, Math.max(1, Number(arg('--limit', '8')) || 8));
const output = arg('--output', 'automation/curriculum-ingestion/inbox/research-candidates.json');

if (!query) {
  console.error('Usage: node scripts/collect-research-metadata.mjs --query="topic" [--lesson=LESSON-ID] [--limit=8]');
  process.exit(1);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'THC-Academy-Curriculum-Ingestion/1.0 (https://dtfseeds.com)'
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function yearFrom(value) {
  const match = String(value ?? '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function crossrefAuthors(item) {
  return (item.author ?? []).map((author) => [author.given, author.family].filter(Boolean).join(' ')).filter(Boolean);
}

async function collectCrossref() {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', query);
  url.searchParams.set('rows', String(limit));
  url.searchParams.set('select', 'DOI,title,author,published-print,published-online,container-title,URL,type,publisher');
  const data = await fetchJson(url);
  return (data.message?.items ?? []).map((item) => {
    const dateParts = item['published-print']?.['date-parts']?.[0] ?? item['published-online']?.['date-parts']?.[0] ?? [];
    return {
      candidateId: `CROSSREF-${String(item.DOI ?? '').toUpperCase()}`,
      source: 'crossref',
      type: 'journal-metadata',
      title: item.title?.[0] ?? 'Untitled record',
      authors: crossrefAuthors(item),
      year: Number(dateParts[0]) || null,
      journal: item['container-title']?.[0] ?? null,
      publisher: item.publisher ?? null,
      doi: item.DOI ?? null,
      pmid: null,
      url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : null),
      status: 'candidate',
      lessonIds: lessonId ? [lessonId] : []
    };
  });
}

async function collectPubMed() {
  const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  searchUrl.searchParams.set('db', 'pubmed');
  searchUrl.searchParams.set('retmode', 'json');
  searchUrl.searchParams.set('retmax', String(limit));
  searchUrl.searchParams.set('term', query);
  const search = await fetchJson(searchUrl);
  const ids = search.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
  summaryUrl.searchParams.set('db', 'pubmed');
  summaryUrl.searchParams.set('retmode', 'json');
  summaryUrl.searchParams.set('id', ids.join(','));
  const summary = await fetchJson(summaryUrl);

  return ids.map((pmid) => {
    const item = summary.result?.[pmid] ?? {};
    const articleIds = item.articleids ?? [];
    const doi = articleIds.find((entry) => entry.idtype === 'doi')?.value ?? null;
    return {
      candidateId: `PUBMED-${pmid}`,
      source: 'pubmed',
      type: 'peer-reviewed-study',
      title: item.title ?? 'Untitled PubMed record',
      authors: (item.authors ?? []).map((author) => author.name).filter(Boolean),
      year: yearFrom(item.pubdate),
      journal: item.fulljournalname ?? item.source ?? null,
      publisher: null,
      doi,
      pmid,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      status: 'candidate',
      lessonIds: lessonId ? [lessonId] : []
    };
  });
}

const settled = await Promise.allSettled([collectPubMed(), collectCrossref()]);
const errors = settled.filter((result) => result.status === 'rejected').map((result) => result.reason?.message ?? String(result.reason));
const raw = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
const seen = new Set();
const candidates = raw.filter((candidate) => {
  const key = candidate.doi ? `doi:${candidate.doi.toLowerCase()}` : candidate.pmid ? `pmid:${candidate.pmid}` : `title:${candidate.title.toLowerCase()}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const payload = {
  version: 1,
  collectedAt: new Date().toISOString(),
  query,
  lessonId,
  limitPerSource: limit,
  policy: 'candidate-only; requires evidence review before promotion into content/references',
  errors,
  candidates
};

const full = path.join(root, output);
fs.mkdirSync(path.dirname(full), {recursive: true});
fs.writeFileSync(full, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Collected ${candidates.length} unique research candidate(s) into ${output}.`);
if (errors.length) console.warn(`Collector completed with ${errors.length} source error(s): ${errors.join(' | ')}`);
if (candidates.length === 0 && errors.length === settled.length) process.exit(1);
