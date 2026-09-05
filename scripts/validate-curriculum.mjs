import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: path.join(rel, name), data: readJson(path.join(rel, name)) }));
}

const collections = {
  competencies: readDirJson('content/competencies'),
  objectives: readDirJson('content/learning-objectives'),
  lessons: readDirJson('content/lessons'),
  assessments: readDirJson('content/assessments'),
  questions: readDirJson('content/questions'),
  references: readDirJson('content/references'),
  modules: readDirJson('content/modules'),
  courses: readDirJson('content/courses'),
  programs: readDirJson('content/programs'),
  credentials: readDirJson('content/credentials')
};

const errors = [];
const warnings = [];
const ids = new Map();
const objects = new Map();

for (const entries of Object.values(collections)) {
  for (const entry of entries) {
    const id = entry.data.id;
    if (!id) {
      errors.push(`${entry.file}: missing id`);
      continue;
    }
    if (ids.has(id)) errors.push(`${entry.file}: duplicate id ${id} also in ${ids.get(id)}`);
    ids.set(id, entry.file);
    objects.set(id, entry.data);
  }
}

function requireId(sourceFile, id, label) {
  if (id && !ids.has(id)) errors.push(`${sourceFile}: missing ${label} reference ${id}`);
}

function requireMany(sourceFile, values, label) {
  for (const id of values ?? []) requireId(sourceFile, id, label);
}

for (const { file, data } of collections.objectives) requireId(file, data.competency, 'competency');

for (const { file, data } of collections.lessons) {
  requireMany(file, data.competencies, 'competency');
  requireMany(file, data.learningObjectives, 'learning objective');
  requireMany(file, data.references, 'reference');
  requireId(file, data.assessment, 'assessment');
  if (!(data.learningObjectives?.length > 0)) errors.push(`${file}: lesson must map to at least one learning objective`);
  if (!(data.competencies?.length > 0)) errors.push(`${file}: lesson must map to at least one competency`);
}

for (const { file, data } of collections.questions) {
  requireId(file, data.competency, 'competency');
  requireId(file, data.objective, 'learning objective');
  requireMany(file, data.references, 'reference');
}

for (const { file, data } of collections.assessments) {
  requireMany(file, data.competencies, 'competency');
  requireMany(file, data.objectives, 'learning objective');
  requireMany(file, data.items, 'item');
}

for (const { file, data } of collections.modules) {
  requireMany(file, data.lessons, 'lesson');
  requireMany(file, data.competencies, 'competency');
  requireId(file, data.assessment, 'assessment');
}

for (const { file, data } of collections.courses) {
  requireMany(file, data.modules, 'module');
  requireMany(file, data.competencies, 'competency');
  requireId(file, data.finalAssessment, 'final assessment');
}

for (const { file, data } of collections.programs) {
  requireMany(file, data.courses, 'course');
}

for (const { file, data } of collections.credentials) {
  requireId(file, data.course, 'course');
  requireMany(file, data.eligibility?.requiredAssessments, 'required assessment');
}

for (const { file, data } of collections.references) {
  if (data.status === 'needs-authoritative-source') {
    warnings.push(`${file}: placeholder reference must be replaced before publication`);
  }
}

function assertPublishedDependencies(sourceFile, data) {
  if (data.status !== 'published') return;
  for (const refId of data.references ?? []) {
    const ref = objects.get(refId);
    if (!ref) continue;
    if (ref.status === 'needs-authoritative-source' || ref.evidenceLevel === 'unverified') {
      errors.push(`${sourceFile}: published object depends on unverified reference ${refId}`);
    }
  }
  for (const itemId of data.items ?? []) {
    const item = objects.get(itemId);
    if (item && item.status !== 'active' && item.status !== 'approved' && item.status !== 'published') {
      errors.push(`${sourceFile}: published assessment uses non-approved item ${itemId}`);
    }
  }
}

for (const group of Object.values(collections)) {
  for (const { file, data } of group) assertPublishedDependencies(file, data);
}

const credentialCompetencies = new Set();
for (const { data } of collections.credentials) {
  for (const assessmentId of data.eligibility?.requiredAssessments ?? []) {
    const assessment = objects.get(assessmentId);
    for (const competency of assessment?.competencies ?? []) credentialCompetencies.add(competency);
  }
}

for (const competency of credentialCompetencies) {
  const matchingItems = collections.questions.filter(({ data }) => data.competency === competency);
  if (matchingItems.length === 0) errors.push(`credentialed competency ${competency}: no assessment items exist`);
}

for (const warning of warnings) console.warn(`WARN ${warning}`);

if (errors.length) {
  console.error('Curriculum validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Curriculum validation passed. ${ids.size} unique curriculum objects checked; ${warnings.length} warning(s).`);
