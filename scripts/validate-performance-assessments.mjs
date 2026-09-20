import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const performanceDir = path.join(root, 'content/performance-assessments');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function idsIn(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return new Set();
  return new Set(fs.readdirSync(full).filter((name) => name.endsWith('.json')).map((name) => readJson(path.join(rel, name)).id));
}

const taskIds = idsIn('content/job-tasks');
const competencyIds = idsIn('content/competencies');
const roleIds = idsIn('content/job-roles');
const credentialPrograms = fs.readdirSync(path.join(root, 'content/credential-programs'))
  .filter((name) => name.endsWith('.json') && name !== 'registry.json')
  .map((name) => readJson(path.join('content/credential-programs', name)));
const roleById = new Map();
for (const name of fs.readdirSync(path.join(root, 'content/job-roles')).filter((name) => name.endsWith('.json'))) {
  const role = readJson(path.join('content/job-roles', name));
  roleById.set(role.id, role);
}

const files = fs.existsSync(performanceDir) ? fs.readdirSync(performanceDir).filter((name) => name.endsWith('.json')).sort() : [];
const seen = new Set();
let validated = 0;

for (const name of files) {
  const rel = path.join('content/performance-assessments', name);
  const data = readJson(rel);
  validated += 1;
  if (seen.has(data.id)) errors.push(`${rel}: duplicate performance assessment id ${data.id}`);
  seen.add(data.id);

  if (!roleIds.has(data.role)) errors.push(`${rel}: missing role ${data.role}`);
  const role = roleById.get(data.role);
  const roleTasks = new Set(role?.tasks ?? []);
  for (const task of data.jobTasks ?? []) {
    if (!taskIds.has(task)) errors.push(`${rel}: missing job task ${task}`);
    else if (role && !roleTasks.has(task)) errors.push(`${rel}: task ${task} is not assigned to role ${data.role}`);
  }
  for (const competency of data.competencies ?? []) if (!competencyIds.has(competency)) errors.push(`${rel}: missing competency ${competency}`);

  const sourcePath = path.join(root, data.sourceDocument ?? '');
  if (!data.sourceDocument || !fs.existsSync(sourcePath)) errors.push(`${rel}: sourceDocument does not exist: ${data.sourceDocument}`);

  const total = (data.scoring?.domains ?? []).reduce((sum, domain) => sum + (domain.points ?? 0), 0);
  if (total !== data.scoring?.totalPoints) errors.push(`${rel}: scoring domains total ${total}, expected ${data.scoring?.totalPoints}`);
}

for (const program of credentialPrograms) {
  for (const id of program.assessmentModel?.performanceEvidence ?? []) {
    if (!seen.has(id)) errors.push(`content/credential-programs/${program.id}.json: missing performance assessment ${id}`);
  }
  const capstone = program.assessmentModel?.capstone;
  if (capstone && !seen.has(capstone)) errors.push(`content/credential-programs/${program.id}.json: missing capstone ${capstone}`);
}

if (errors.length) {
  console.error('Performance assessment validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Performance assessment validation passed for ${validated} object(s).`);
