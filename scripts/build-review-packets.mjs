import fs from 'node:fs';
import path from 'node:path';
import { catalogAttestationApproval, catalogAttestationStatus } from './catalog-review-attestation.mjs';

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).filter((x) => x.startsWith('--') && x.includes('=')).map((x) => {
  const [key, ...rest] = x.slice(2).split('=');
  return [key, rest.join('=')];
}));
const summaryOnly = process.argv.includes('--summary-only');
const format = args.format ?? 'json';
const filterObject = args.object ?? null;
const filterLane = args.lane ?? null;

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => readJson(path.join(rel, n)));
}
function uniq(values) { return [...new Set(values.filter(Boolean))]; }

const registry = readJson('registry/cultivation-foundations.json');
const modules = new Map(readDirJson('content/modules').map((x) => [x.id, x]));
const lessons = new Map(readDirJson('content/lessons').map((x) => [x.id, x]));
const assessments = new Map(readDirJson('content/assessments').map((x) => [x.id, x]));
const questions = new Map(readDirJson('content/questions').map((x) => [x.id, x]));
const claims = readDirJson('content/claims');
const references = new Map(readDirJson('content/references').map((x) => [x.id, x]));
const competencies = new Map(readDirJson('content/competencies').map((x) => [x.id, x]));
const objectives = new Map(readDirJson('content/learning-objectives').map((x) => [x.id, x]));
const reviews = readDirJson('content/reviews');

function latestReview(objectId, objectVersion, reviewType) {
  return reviews.filter((r) => r.objectId === objectId && String(r.objectVersion) === String(objectVersion) && r.reviewType === reviewType)
    .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))[0] ?? null;
}
function approvalFor(objectType, objectId, objectVersion, reviewType) {
  return latestReview(objectId, objectVersion, reviewType) ?? catalogAttestationApproval(objectType, reviewType, objectId);
}
function stateFromReview(review) {
  if (!review) return 'pending';
  return review.status === 'approved' ? 'approved' : 'revision-required';
}

const tasks = [];
const lessonIds = new Set();
for (const domain of registry.domains ?? []) {
  const module = modules.get(domain.module);
  if (!module) throw new Error(`Review packet builder cannot resolve module ${domain.module}`);
  for (const lessonId of module.lessons ?? []) lessonIds.add(lessonId);
}
for (const lessonId of [...lessonIds].sort()) {
  const lesson = lessons.get(lessonId);
  if (!lesson) throw new Error(`Review packet builder cannot resolve lesson ${lessonId}`);
  const scientific = approvalFor('lesson', lesson.id, lesson.version, 'scientific');
  const scientificState = stateFromReview(scientific);
  tasks.push({lane:'lesson-scientific',objectType:'lesson',objectId:lesson.id,objectVersion:lesson.version,reviewType:'scientific',state:scientificState,latestReviewId:scientific?.id ?? null});
  const editorial = approvalFor('lesson', lesson.id, lesson.version, 'editorial');
  tasks.push({lane:'lesson-editorial',objectType:'lesson',objectId:lesson.id,objectVersion:lesson.version,reviewType:'editorial',state:scientificState === 'approved' ? stateFromReview(editorial) : 'blocked',blockedBy:scientificState === 'approved' ? null : 'scientific-approval',latestReviewId:editorial?.id ?? null});
}
for (const assessment of [...assessments.values()].sort((a,b) => a.id.localeCompare(b.id))) {
  const review = approvalFor('assessment', assessment.id, assessment.version, 'assessment');
  tasks.push({lane:'assessment-definition',objectType:'assessment',objectId:assessment.id,objectVersion:assessment.version,reviewType:'assessment',state:stateFromReview(review),latestReviewId:review?.id ?? null});
}
for (const item of [...questions.values()].sort((a,b) => a.id.localeCompare(b.id))) {
  const review = approvalFor('question', item.id, item.version, 'assessment');
  tasks.push({lane:item.purpose === 'formative' ? 'formative-item' : 'credential-item',objectType:'question',objectId:item.id,objectVersion:item.version,reviewType:'assessment',state:stateFromReview(review),latestReviewId:review?.id ?? null});
}

function sourceFor(task) {
  if (task.objectType === 'lesson') return lessons.get(task.objectId);
  if (task.objectType === 'assessment') return assessments.get(task.objectId);
  if (task.objectType === 'question') return questions.get(task.objectId);
  return null;
}
function mappingsFor(task, source) {
  const competencyIds = uniq(source.competencies ?? (source.competency ? [source.competency] : []));
  const objectiveIds = uniq(source.learningObjectives ?? source.objectives ?? (source.objective ? [source.objective] : []));
  return {
    competencies: competencyIds.map((id) => ({id, title: competencies.get(id)?.title ?? null})),
    objectives: objectiveIds.map((id) => ({id, statement: objectives.get(id)?.statement ?? objectives.get(id)?.description ?? null}))
  };
}
function evidenceIdsFor(source) {
  const ids = [...(source.references ?? [])];
  for (const section of source.content?.sections ?? []) ids.push(...(section.references ?? []));
  return uniq(ids);
}
function claimMatches(task, competencyIds, refIds) {
  return claims.filter((claim) => {
    if ((claim.supportsLessons ?? []).includes(task.objectId)) return true;
    const compMatch = (claim.supportsCompetencies ?? []).some((id) => competencyIds.includes(id));
    const refMatch = (claim.references ?? []).some((id) => refIds.includes(id));
    return task.objectType !== 'lesson' && compMatch && refMatch;
  });
}
function checklistFor(task) {
  if (task.reviewType === 'scientific') return [
    'Verify each factual claim is supported by the cited evidence and scoped to what the source actually studied.',
    'Check that treatment-specific findings are not presented as universal cultivation rules.',
    'Verify terminology, causal language, numeric values and biological relationships.',
    'Record corrections or evidence gaps before approval.'
  ];
  if (task.lane === 'lesson-editorial') return [
    'Confirm scientific approval exists for this exact lesson version.',
    'Check plain-language clarity, structure, terminology consistency and learner accessibility.',
    'Verify examples and summaries preserve the approved scientific meaning.',
    'Check headings, vocabulary and instructional flow for ambiguity or unnecessary complexity.'
  ];
  if (task.objectType === 'assessment') return [
    'Verify the assessment blueprint is traceable to the exact course objectives, competencies, current occupational/JTA scope where applicable, item counts and intended cognitive targets.',
    'Verify the assessment samples the intended construct without adding unrelated reading, memory, cultural or technology demands that are not part of the skill being assessed.',
    'Check passing-score language is explicitly provisional unless formal standard-setting evidence exists for the exact version.',
    'Confirm attempt, feedback, randomization, form-construction, security and accommodation settings preserve both construct validity and answer security.',
    'Check accessibility/accommodation rules allow candidates to demonstrate the intended knowledge or skill without changing a construct that is itself legitimately being measured.',
    'Ensure operational use remains blocked until exact-version human review, required pilot/item evidence, active-item depth and secure operational-store/form evidence are complete.'
  ];
  return [
    'Verify the item directly measures its declared objective/competency and fits the intended occupational role rather than testing authority or responsibilities outside that role.',
    'Verify every factual premise, keyed answer and rationale is supported by the cited evidence and does not overgeneralize treatment-, genotype-, system- or jurisdiction-specific findings.',
    'Confirm there is one defensible keyed answer; distractors must be plausible to an incompletely prepared learner but clearly incorrect under the stated evidence and scenario.',
    'Check the stem is necessary, unambiguous and free of irrelevant clues, excessive reading burden, trick wording, avoidable negatives or hidden assumptions not part of the construct.',
    'Check cognitive level and difficulty are produced by the targeted knowledge/reasoning demand rather than vocabulary complexity, obscure trivia or formatting barriers.',
    'Review fairness and bias: remove irrelevant demographic, cultural, socioeconomic or disability-related barriers and avoid stereotypes or needlessly sensitive context.',
    'Check accessibility: content must remain understandable with reasonable alternate presentation/accommodation when the affected sensory or motor skill is not the construct being measured.',
    'Verify legal/safety/role-authority boundaries, especially pesticide, electrical/HVAC, engineering, laboratory, diagnosis and final-disposition authority.',
    'Ensure secure answer/rationale content is not exposed to unauthenticated learner clients and that review approval is pinned to the exact item version.'
  ];
}
function packetFor(task) {
  const source = sourceFor(task);
  if (!source) throw new Error(`Cannot build packet for missing ${task.objectType} ${task.objectId}`);
  const mappings = mappingsFor(task, source);
  const competencyIds = mappings.competencies.map((x) => x.id);
  const refIds = evidenceIdsFor(source);
  const missingRefs = refIds.filter((id) => !references.has(id));
  if (missingRefs.length) throw new Error(`${task.objectId} has unresolved references: ${missingRefs.join(', ')}`);
  const matchedClaims = claimMatches(task, competencyIds, refIds);
  const history = reviews.filter((r) => r.objectId === task.objectId && String(r.objectVersion) === String(task.objectVersion)).sort((a,b) => Date.parse(a.reviewedAt) - Date.parse(b.reviewedAt));
  return {
    packetVersion: '1.0.0',
    task,
    source,
    mappings,
    claims: matchedClaims.map((c) => ({id:c.id, statement:c.statement, status:c.status, evidenceStatus:c.evidenceStatus, references:c.references ?? []})),
    evidence: refIds.map((id) => {
      const ref = references.get(id);
      return {id:ref.id,title:ref.title ?? null,status:ref.status ?? null,evidenceLevel:ref.evidenceLevel ?? null,url:ref.url ?? null,doi:ref.doi ?? null,pmid:ref.pmid ?? null,pmcid:ref.pmcid ?? null};
    }),
    reviewHistory: history.map((r) => ({id:r.id,reviewType:r.reviewType,status:r.status,reviewedAt:r.reviewedAt,reviewer:r.reviewer ?? null,notes:r.notes ?? null})),
    checklist: checklistFor(task),
    approvalRule: task.state === 'blocked' ? `Blocked by ${task.blockedBy}` : 'Approval must be recorded by an exact-version review or an immutable Git-tree-bound catalog attestation; packet generation never promotes content automatically.'
  };
}

let selected = tasks;
if (filterObject) selected = selected.filter((t) => t.objectId === filterObject);
if (filterLane) selected = selected.filter((t) => t.lane === filterLane);
if (filterObject && selected.length === 0) throw new Error(`No review task found for ${filterObject}`);
const packets = selected.map(packetFor);
const summary = {
  curriculum: registry.course,
  curriculumVersion: registry.version,
  taskCount: selected.length,
  packetCount: packets.length,
  states: Object.fromEntries(['approved','pending','blocked','revision-required'].map((state) => [state, selected.filter((t) => t.state === state).length])),
  lanes: Object.fromEntries([...new Set(selected.map((t) => t.lane))].sort().map((lane) => [lane, selected.filter((t) => t.lane === lane).length])),
  unresolvedPackets: selected.length - packets.length,
  catalogAttestation: catalogAttestationStatus()
};

function markdown(packet) {
  const src = packet.source;
  const lines = [`# Review packet: ${packet.task.objectId}`, '', `- Lane: ${packet.task.lane}`, `- Review type: ${packet.task.reviewType}`, `- Version: ${packet.task.objectVersion}`, `- Queue state: ${packet.task.state}`, ''];
  if (src.title) lines.push(`## ${src.title}`, '');
  lines.push('## Traceability', ...packet.mappings.competencies.map((x) => `- Competency: ${x.id}${x.title ? ` — ${x.title}` : ''}`), ...packet.mappings.objectives.map((x) => `- Objective: ${x.id}${x.statement ? ` — ${x.statement}` : ''}`), '');
  lines.push('## Evidence', ...packet.evidence.map((x) => `- ${x.id}: ${x.title ?? 'Untitled'} [${x.status ?? 'unknown'}; level ${x.evidenceLevel ?? 'n/a'}]${x.url ? ` — ${x.url}` : ''}`), '');
  if (packet.claims.length) lines.push('## Claims', ...packet.claims.map((x) => `- ${x.id}: ${x.statement}`), '');
  lines.push('## Review checklist', ...packet.checklist.map((x) => `- [ ] ${x}`), '', '## Approval rule', packet.approvalRule, '', '## Source object', '```json', JSON.stringify(src, null, 2), '```');
  return lines.join('\n');
}

if (summaryOnly) console.log(JSON.stringify(summary, null, 2));
else if (format === 'markdown') {
  if (packets.length !== 1) throw new Error('Markdown output requires --object=<ID> so exactly one packet is selected.');
  console.log(markdown(packets[0]));
} else {
  console.log(JSON.stringify({summary, packets}, null, 2));
}
