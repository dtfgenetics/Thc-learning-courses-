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
const roleById = new Map();
for (const name of fs.readdirSync(path.join(root, 'content/job-roles')).filter((name) => name.endsWith('.json'))) {
  const role = readJson(path.join('content/job-roles', name));
  roleById.set(role.id, role);
}

const files = fs.existsSync(performanceDir) ? fs.readdirSync(performanceDir).filter((name) => name.endsWith('.json')).sort() : [];
const seen = new Set();
const performanceById = new Map();
let validated = 0;

for (const name of files) {
  const rel = path.join('content/performance-assessments', name);
  const data = readJson(rel);
  validated += 1;
  if (seen.has(data.id)) errors.push(`${rel}: duplicate performance assessment id ${data.id}`);
  seen.add(data.id);
  performanceById.set(data.id, data);

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

const credentialDir = path.join(root, 'content/credentials');
if (fs.existsSync(credentialDir)) {
  for (const name of fs.readdirSync(credentialDir).filter((entry) => entry.endsWith('.json')).sort()) {
    const rel = path.join('content/credentials', name);
    const credential = readJson(rel);
    for (const assessmentId of credential.eligibility?.requiredPerformanceAssessments ?? []) {
      const definition = performanceById.get(assessmentId);
      if (!definition) {
        errors.push(`${rel}: required performance assessment does not exist: ${assessmentId}`);
        continue;
      }
      if (credential.role && definition.role !== credential.role) {
        errors.push(`${rel}: performance assessment ${assessmentId} belongs to ${definition.role}, expected ${credential.role}`);
      }
      if (definition.purpose !== 'credential') {
        errors.push(`${rel}: required performance assessment ${assessmentId} must have purpose=credential`);
      }
    }
  }
}

if (errors.length) {
  console.error('Performance assessment validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Performance assessment validation passed for ${validated} object(s), including credential cross-references.`);
