import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const formatArg = process.argv.find((arg) => arg.startsWith('--format='));
const format = formatArg ? formatArg.split('=')[1] : 'json';

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

const registry = readJson('registry/cultivation-foundations.json');
const questions = readDirJson('content/questions');
const reviews = readDirJson('content/reviews');
const objectiveRecords = new Map(readDirJson('content/learning-objectives').map((row) => [row.id, row]));
const referenceRecords = new Map(readDirJson('content/references').map((row) => [row.id, row]));

const domainByCompetency = new Map();
const domainByObjective = new Map();
const foundationsCompetencies = new Set();
const foundationsObjectives = new Set();
for (const domain of registry.domains ?? []) {
  for (const competency of domain.competencies ?? []) {
    foundationsCompetencies.add(competency);
    domainByCompetency.set(competency, domain.id);
  }
  for (const objective of domain.objectives ?? []) {
    foundationsObjectives.add(objective);
    domainByObjective.set(objective, domain.id);
  }
}

function approvedAssessmentReview(item) {
  return reviews.some((review) =>
    review.objectId === item.id &&
    String(review.objectVersion) === String(item.version) &&
    review.reviewType === 'assessment' &&
    review.status === 'approved'
  );
}

function latestAssessmentReview(item) {
  return reviews
    .filter((review) =>
      review.objectId === item.id &&
      String(review.objectVersion) === String(item.version) &&
      review.reviewType === 'assessment'
    )
    .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0] ?? null;
}

const pending = questions.filter((item) =>
  foundationsCompetencies.has(item.competency) &&
  foundationsObjectives.has(item.objective) &&
  ['summative', 'credential'].includes(item.purpose) &&
  !['retired', 'flagged'].includes(item.status) &&
  !approvedAssessmentReview(item)
);

const errors = [];
const packets = pending.map((item) => {
  const competencyDomain = domainByCompetency.get(item.competency) ?? null;
  const objectiveDomain = domainByObjective.get(item.objective) ?? null;
  if (!competencyDomain || competencyDomain !== objectiveDomain) {
    errors.push(`${item.id} maps competency ${item.competency} and objective ${item.objective} to different or unknown Foundations domains.`);
  }
  if (!Array.isArray(item.choices) || item.choices.length < 2) errors.push(`${item.id} must provide at least two choices.`);
  if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct >= (item.choices?.length ?? 0)) errors.push(`${item.id} has an invalid keyed answer index.`);
  if (!item.rationale?.trim()) errors.push(`${item.id} is missing a rationale.`);
  const refs = [...new Set(item.references ?? [])];
  if (refs.length === 0) errors.push(`${item.id} has no evidence reference.`);
  const missingRefs = refs.filter((id) => !referenceRecords.has(id));
  if (missingRefs.length) errors.push(`${item.id} has unresolved references: ${missingRefs.join(', ')}.`);
  const latestReview = latestAssessmentReview(item);
  return {
    domain: objectiveDomain,
    item: {
      id: item.id,
      version: item.version,
      status: item.status,
      purpose: item.purpose,
      competency: item.competency,
      objective: item.objective,
      objectiveStatement: objectiveRecords.get(item.objective)?.statement ?? objectiveRecords.get(item.objective)?.description ?? null,
      bloomLevel: item.bloomLevel,
      difficulty: item.difficulty,
      type: item.type,
      stem: item.stem,
      choices: item.choices,
      correct: item.correct,
      rationale: item.rationale
    },
    evidence: refs.map((id) => {
      const ref = referenceRecords.get(id);
      return {
        id,
        title: ref?.title ?? null,
        status: ref?.status ?? null,
        evidenceLevel: ref?.evidenceLevel ?? null,
        doi: ref?.doi ?? null,
        url: ref?.url ?? null
      };
    }),
    latestAssessmentReview: latestReview ? {
      id: latestReview.id,
      status: latestReview.status,
      reviewedAt: latestReview.reviewedAt,
      notes: latestReview.notes ?? null
    } : null,
    checklist: [
      'Confirm the item measures the declared objective and competency rather than adjacent content.',
      'Verify the cited evidence supports the keyed answer and the rationale does not exceed the evidence scope.',
      'Confirm exactly one answer is defensible and distractors are plausible without being misleading.',
      'Check Bloom level and difficulty against the reasoning actually required by the stem.',
      'Check plain language, accessibility, safety/legal boundaries, and avoid universal treatment recipes.',
      'Record approval or revision-required as an exact-version human assessment review; this batch never changes lifecycle status.'
    ]
  };
}).sort((a, b) =>
  a.domain.localeCompare(b.domain) ||
  a.item.objective.localeCompare(b.item.objective) ||
  a.item.id.localeCompare(b.item.id)
);

const grouped = {};
for (const packet of packets) {
  grouped[packet.domain] ??= {};
  grouped[packet.domain][packet.item.objective] ??= [];
  grouped[packet.domain][packet.item.objective].push(packet);
}

const summary = {
  course: registry.course,
  pendingAssessmentReviewItems: packets.length,
  domainsWithPendingItems: Object.keys(grouped).length,
  objectivesWithPendingItems: new Set(packets.map((packet) => packet.item.objective)).size,
  structuralErrors: errors.length,
  readyForHumanReview: errors.length === 0,
  note: 'Human review remains required. This report does not approve items, create pilot evidence, or change item lifecycle status.'
};

if (format === 'markdown') {
  console.log(`# Foundations assessment review batch\n\n- Course: ${summary.course}\n- Pending items: ${summary.pendingAssessmentReviewItems}\n- Domains represented: ${summary.domainsWithPendingItems}\n- Objectives represented: ${summary.objectivesWithPendingItems}\n- Structural errors: ${summary.structuralErrors}\n\n> ${summary.note}\n`);
  for (const [domain, objectives] of Object.entries(grouped)) {
    console.log(`\n## ${domain}`);
    for (const [objective, objectivePackets] of Object.entries(objectives)) {
      console.log(`\n### ${objective}`);
      for (const packet of objectivePackets) {
        console.log(`\n#### ${packet.item.id} v${packet.item.version}\n`);
        console.log(`**Stem:** ${packet.item.stem}\n`);
        packet.item.choices.forEach((choice, index) => console.log(`- ${index === packet.item.correct ? '**' : ''}${String.fromCharCode(65 + index)}. ${choice}${index === packet.item.correct ? '**' : ''}`));
        console.log(`\n**Rationale:** ${packet.item.rationale}\n`);
        console.log(`**Evidence:** ${packet.evidence.map((ref) => `${ref.id}${ref.title ? ` — ${ref.title}` : ''}`).join('; ')}\n`);
        console.log('**Review checklist:**');
        packet.checklist.forEach((row) => console.log(`- [ ] ${row}`));
      }
    }
  }
} else {
  console.log(JSON.stringify({summary, grouped}, null, 2));
}

if (check && errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
