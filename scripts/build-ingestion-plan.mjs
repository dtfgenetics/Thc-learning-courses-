import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const hit = args.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};

const manifestPath = getArg('--manifest', 'automation/curriculum-ingestion/manifests/COURSE-LH-TECH1-001.json');
const outputPath = getArg('--output', 'automation/curriculum-ingestion/reports/collection-plan.json');
const tempReport = path.join('automation', 'curriculum-ingestion', 'reports', '.dependency-plan-input.json');

execFileSync(process.execPath, [
  'scripts/audit-curriculum-dependencies.mjs',
  `--manifest=${manifestPath}`,
  `--write-report=${tempReport}`
], {cwd: root, stdio: 'ignore'});

const report = JSON.parse(fs.readFileSync(path.join(root, tempReport), 'utf8'));
const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, 'automation/curriculum-ingestion/source-catalog.json'), 'utf8'));
const sourceById = new Map(sourceCatalog.sources.map((source) => [source.id, source]));

const tasks = [];
for (const requirement of report.requirements) {
  const query = requirement.collectionQueries?.[0] || requirement.topic;
  const base = {
    requirementId: requirement.id,
    lessonIds: requirement.lessonIds,
    topic: requirement.topic,
    query
  };

  if ((requirement.gaps.reviewedReferences ?? 0) > 0) {
    tasks.push({
      ...base,
      type: 'research',
      gap: requirement.gaps.reviewedReferences,
      collectors: ['pubmed', 'crossref'],
      command: `node scripts/collect-research-metadata.mjs --query=${JSON.stringify(query)} --lesson=${requirement.lessonIds[0]} --limit=8`
    });
  }

  if ((requirement.gaps.datasets ?? 0) > 0) {
    tasks.push({
      ...base,
      type: 'dataset',
      gap: requirement.gaps.datasets,
      collectors: ['datagov'],
      command: `node scripts/collect-government-datasets.mjs --query=${JSON.stringify(query)} --lesson=${requirement.lessonIds[0]} --limit=8`
    });
  }

  if ((requirement.gaps.approvedAssets ?? 0) > 0) {
    tasks.push({
      ...base,
      type: 'asset',
      gap: requirement.gaps.approvedAssets,
      collectors: ['internal', 'wikimedia'],
      sequence: ['search-internal-approved-assets', 'collect-external-reference-candidates'],
      command: `node scripts/collect-wikimedia-media.mjs --query=${JSON.stringify(query)} --lesson=${requirement.lessonIds[0]} --limit=8`
    });
  }

  if ((requirement.gaps.verifiedLinks ?? 0) > 0) {
    const preferred = (requirement.preferredSources ?? []).map((id) => ({
      id,
      automation: sourceById.get(id)?.automation || 'unknown'
    }));
    tasks.push({
      ...base,
      type: 'authoritative-link',
      gap: requirement.gaps.verifiedLinks,
      preferredSources: preferred,
      mode: preferred.some((source) => source.automation === 'discovery-provider-required')
        ? 'mixed-automatic-and-discovery'
        : 'automatic-or-curated-authority'
    });
  }
}

const plan = {
  generatedAt: new Date().toISOString(),
  courseId: report.courseId,
  dependencyComplete: report.complete,
  totals: report.totals,
  taskCount: tasks.length,
  tasks,
  policy: {
    externalResultsAreCandidatesOnly: true,
    autoPromotionToTrustedRegistries: false,
    requireProvenance: true,
    requireMediaLicenseReview: true
  }
};

const full = path.join(root, outputPath);
fs.mkdirSync(path.dirname(full), {recursive: true});
fs.writeFileSync(full, `${JSON.stringify(plan, null, 2)}\n`);
if (fs.existsSync(path.join(root, tempReport))) fs.unlinkSync(path.join(root, tempReport));
console.log(JSON.stringify(plan, null, 2));
