import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'content');

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
  courses: readDirJson('content/courses')
};

const errors = [];
const ids = new Map();

for (const [kind, entries] of Object.entries(collections)) {
  for (const entry of entries) {
    const id = entry.data.id;
    if (!id) {
      errors.push(`${entry.file}: missing id`);
      continue;
    }
    if (ids.has(id)) errors.push(`${entry.file}: duplicate id ${id} also in ${ids.get(id)}`);
    ids.set(id, entry.file);
  }
}

function requireId(sourceFile, id, label) {
  if (id && !ids.has(id)) errors.push(`${sourceFile}: missing ${label} reference ${id}`);
}

for (const { file, data } of collections.objectives) requireId(file, data.competency, 'competency');
for (const { file, data } of collections.lessons) {
  for (const id of data.competencies ?? []) requireId(file, id, 'competency');
  for (const id of data.learningObjectives ?? []) requireId(file, id, 'learning objective');
  for (const id of data.references ?? []) requireId(file, id, 'reference');
  requireId(file, data.assessment, 'assessment');
}
for (const { file, data } of collections.questions) {
  requireId(file, data.competency, 'competency');
  requireId(file, data.objective, 'learning objective');
  for (const id of data.references ?? []) requireId(file, id, 'reference');
}
for (const { file, data } of collections.assessments) {
  for (const id of data.competencies ?? []) requireId(file, id, 'competency');
  for (const id of data.objectives ?? []) requireId(file, id, 'learning objective');
  for (const id of data.items ?? []) requireId(file, id, 'item');
}
for (const { file, data } of collections.modules) {
  for (const id of data.lessons ?? []) requireId(file, id, 'lesson');
  for (const id of data.competencies ?? []) requireId(file, id, 'competency');
  requireId(file, data.assessment, 'assessment');
}
for (const { file, data } of collections.courses) {
  for (const id of data.modules ?? []) requireId(file, id, 'module');
  for (const id of data.competencies ?? []) requireId(file, id, 'competency');
  requireId(file, data.finalAssessment, 'final assessment');
}

for (const { file, data } of collections.references) {
  if (data.status === 'needs-authoritative-source') {
    console.warn(`WARN ${file}: placeholder reference must be replaced before publication`);
  }
}

if (errors.length) {
  console.error('Curriculum validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Curriculum validation passed. ${ids.size} unique curriculum objects checked.`);
