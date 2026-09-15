import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2)
  .filter((arg) => arg.startsWith('--') && arg.includes('='))
  .map((arg) => {
    const [key, ...rest] = arg.slice(2).split('=');
    return [key, rest.join('=')];
  }));

const outputDir = args.output ?? null;
const requestedId = args.id ?? null;

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      file: path.join(rel, name).replaceAll('\\', '/'),
      data: readJson(path.join(rel, name))
    }));
}

function esc(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

const pending = readDirJson('automation/curriculum-ingestion/reviews/pending');
const approved = readDirJson('automation/curriculum-ingestion/reviews/approved');
const lessons = new Map(readDirJson('content/lessons').map(({data}) => [data.id, data]));
const references = new Map(readDirJson('content/references').map(({data}) => [data.id, data]));
const claims = new Map(readDirJson('content/claims').map(({data}) => [data.id, data]));
const linkRegistryRaw = readJson('registry/LINKS.json');
const links = Array.isArray(linkRegistryRaw) ? linkRegistryRaw : (linkRegistryRaw.links ?? linkRegistryRaw.items ?? []);

const selected = pending.filter(({data}) => !requestedId || data.id === requestedId);
if (requestedId && selected.length === 0) throw new Error(`Pending evidence review not found: ${requestedId}`);

const failures = [];
const packets = [];

for (const {file, data} of selected) {
  if (data.status !== 'needs-scientific-review') {
    failures.push(`${file}: expected status=needs-scientific-review, got ${data.status}`);
    continue;
  }

  const lessonRecords = [];
  for (const lessonId of data.lessonIds ?? []) {
    const lesson = lessons.get(lessonId);
    if (!lesson) failures.push(`${file}: unresolved lesson ${lessonId}`);
    else lessonRecords.push({id: lesson.id, title: lesson.title, version: lesson.version, status: lesson.status});
  }

  const evidence = [];
  for (const referenceId of data.referenceIds ?? []) {
    const ref = references.get(referenceId);
    if (!ref) {
      failures.push(`${file}: unresolved reference ${referenceId}`);
      continue;
    }
    const matchingLinks = links.filter((link) =>
      link.url === ref.url ||
      link.canonicalUrl === ref.url ||
      (link.publisher && ref.publisher && link.publisher === ref.publisher && (link.lessonIds ?? []).some((id) => (data.lessonIds ?? []).includes(id)))
    );
    evidence.push({
      id: ref.id,
      title: ref.title ?? null,
      publisher: ref.publisher ?? null,
      year: ref.year ?? null,
      status: ref.status ?? null,
      evidenceLevel: ref.evidenceLevel ?? null,
      url: ref.url ?? null,
      doi: ref.doi ?? null,
      pmid: ref.pmid ?? null,
      pmcid: ref.pmcid ?? null,
      notes: ref.notes ?? null,
      verifiedLinks: matchingLinks.map((link) => ({id: link.id, url: link.canonicalUrl ?? link.url, lastCheckedAt: link.lastCheckedAt ?? null}))
    });
  }

  const existingClaim = claims.get(data.claimId) ?? null;
  const alreadyApproved = approved.some(({data: item}) => item.id === data.id);
  if (alreadyApproved) failures.push(`${file}: same review id also exists under reviews/approved`);

  packets.push({
    packetVersion: '1.0.0',
    reviewId: data.id,
    pendingFile: file,
    action: data.action,
    claimId: data.claimId,
    proposedStatement: data.statement,
    domain: data.domain,
    proposedClaimVersion: data.version,
    proposedClaimStatus: data.claimStatus ?? 'draft',
    reviewDueAt: data.reviewDueAt ?? null,
    aiAssisted: data.review?.aiAssisted === true,
    editor: data.review?.editor ?? null,
    currentScientificReviewer: data.review?.scientificReviewer ?? null,
    rationale: data.review?.rationale ?? null,
    notes: data.review?.notes ?? null,
    lessons: lessonRecords,
    evidence,
    sourceContext: data.sourceContext ?? [],
    competencyIds: data.competencyIds ?? [],
    objectiveIds: data.objectiveIds ?? [],
    existingClaim: existingClaim ? {
      id: existingClaim.id,
      version: existingClaim.version ?? null,
      status: existingClaim.status ?? null,
      evidenceStatus: existingClaim.evidenceStatus ?? null,
      statement: existingClaim.statement ?? null,
      references: existingClaim.references ?? [],
      supportsLessons: existingClaim.supportsLessons ?? []
    } : null,
    checklist: [
      'Open every evidence source and verify the proposed atomic statement is supported by what the source actually says.',
      'Confirm jurisdiction, population, crop/system, regulatory scope and transferability limits are preserved.',
      'Check causal wording, numeric values, terminology and exceptions; remove any claim stronger than the evidence.',
      'Confirm every listed lesson genuinely uses this evidence for the same underlying principle.',
      'Confirm the claim is atomic enough to be independently revised, superseded or re-reviewed later.',
      'Record corrections or rejection reasons before any promotion to canonical claims.'
    ],
    decisionRule: 'Packet generation never approves a claim. Human review must explicitly update the review record, provide a real reviewer identity and approval timestamp, move an approved record into reviews/approved, pass CI, and only then run the existing promotion command.'
  });
}

if (failures.length) {
  console.error(`Evidence review packet generation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const summary = {
  generatedAt: new Date().toISOString(),
  pendingReviewCount: pending.length,
  selectedReviewCount: packets.length,
  approvedReviewCount: approved.length,
  selectedReviewIds: packets.map((packet) => packet.reviewId),
  scope: requestedId ? 'single-review' : 'all-pending'
};

function markdown(packet) {
  const lines = [
    `# Evidence review packet — ${packet.reviewId}`,
    '',
    `**Claim ID:** \`${packet.claimId}\`  `,
    `**Action:** ${packet.action}  `,
    `**Domain:** ${packet.domain}  `,
    `**AI-assisted draft:** ${packet.aiAssisted ? 'yes' : 'no'}  `,
    `**Current state:** needs scientific review`,
    '',
    '## Proposed atomic claim',
    '',
    packet.proposedStatement,
    '',
    '## Lessons using the proposed claim',
    '',
    '| Lesson | Title | Version |',
    '|---|---|---|',
    ...packet.lessons.map((lesson) => `| ${esc(lesson.id)} | ${esc(lesson.title)} | ${esc(lesson.version)} |`),
    '',
    '## Evidence to inspect',
    ''
  ];

  for (const source of packet.evidence) {
    lines.push(`### ${source.id} — ${source.title ?? 'Untitled source'}`);
    lines.push('');
    lines.push(`- Publisher: ${source.publisher ?? 'n/a'}`);
    lines.push(`- Evidence level: ${source.evidenceLevel ?? 'n/a'}`);
    lines.push(`- Repository status: ${source.status ?? 'n/a'}`);
    if (source.url) lines.push(`- Source: ${source.url}`);
    if (source.doi) lines.push(`- DOI: ${source.doi}`);
    if (source.pmid) lines.push(`- PMID: ${source.pmid}`);
    if (source.verifiedLinks.length) lines.push(`- Verified registry link(s): ${source.verifiedLinks.map((link) => `${link.id} (${link.url})`).join('; ')}`);
    if (source.notes) lines.push(`- Source notes: ${source.notes}`);
    lines.push('');
  }

  lines.push('## Exact lesson contexts', '');
  for (const context of packet.sourceContext) {
    lines.push(`- ${context.lessonId} / ${context.referenceId}${context.contextTitle ? ` — ${context.contextTitle}` : ''}${context.jsonPath ? ` — \`${context.jsonPath}\`` : ''}`);
  }
  lines.push('', '## Draft rationale and scope notes', '', packet.rationale ?? 'No rationale supplied.', '');
  if (packet.notes) lines.push(packet.notes, '');
  if (packet.existingClaim) {
    lines.push('## Existing canonical claim', '', `This proposal targets an existing claim (${packet.existingClaim.id}, version ${packet.existingClaim.version ?? 'unknown'}). Compare the proposed statement against the current canonical statement before approving.`, '', `> ${packet.existingClaim.statement ?? ''}`, '');
  }
  lines.push('## Human review checklist', '', ...packet.checklist.map((item) => `- [ ] ${item}`), '');
  lines.push('## Reviewer decision', '', '- Decision: **APPROVE / REVISE / REJECT**', '- Reviewer name/credential: ____________________', '- Review date/time: ____________________', '- Required corrections or scope notes: ____________________', '');
  lines.push('## Promotion rule', '', packet.decisionRule, '');
  return `${lines.join('\n')}\n`;
}

const output = {summary, packets};
if (outputDir) {
  const full = path.join(root, outputDir);
  fs.rmSync(full, {recursive: true, force: true});
  fs.mkdirSync(full, {recursive: true});
  fs.writeFileSync(path.join(full, 'index.json'), `${JSON.stringify(output, null, 2)}\n`);
  for (const packet of packets) fs.writeFileSync(path.join(full, `${packet.reviewId}.md`), markdown(packet));
  fs.writeFileSync(path.join(full, 'README.md'), `# Evidence review packet bundle\n\nGenerated ${summary.generatedAt}. Contains ${summary.selectedReviewCount} pending evidence review packet(s). Packet generation does not approve or promote claims.\n`);
  console.log(JSON.stringify({...summary, outputDir}, null, 2));
} else {
  console.log(JSON.stringify(output, null, 2));
}
