import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const readDir = (dir) => {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith('.json')).map((f) => ({ file: path.join(dir, f), data: JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')) }));
};
const ids = (dir) => new Set(readDir(dir).map((x) => x.data.id));
const references = ids('content/references');
const lessons = ids('content/lessons');
const competencies = ids('content/competencies');
const entries = readDir('content/encyclopedia');
const glossary = readDir('content/glossary');
const entryIds = new Set(entries.map((x) => x.data.id));
const seenSlugs = new Set();

for (const { file, data } of entries) {
  if (!/^ENC-[A-Z0-9-]+$/.test(data.id ?? '')) errors.push(`${file}: invalid encyclopedia id`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug ?? '')) errors.push(`${file}: invalid slug`);
  if (seenSlugs.has(data.slug)) errors.push(`${file}: duplicate slug ${data.slug}`); else seenSlugs.add(data.slug);
  if (!Number.isInteger(data.volume) || data.volume < 1) errors.push(`${file}: volume must be positive integer`);
  if (!['draft','review','approved','published','superseded','retired'].includes(data.status)) errors.push(`${file}: invalid status`);
  if (typeof data.summary !== 'string' || data.summary.length < 80) errors.push(`${file}: summary must be at least 80 characters`);
  if (!Array.isArray(data.sections) || data.sections.length < 3) errors.push(`${file}: at least 3 sections required`);
  for (const [index, section] of (data.sections ?? []).entries()) {
    if (typeof section.body !== 'string' || section.body.length < 120) errors.push(`${file}: section ${index + 1} body must be at least 120 characters`);
    if (!Array.isArray(section.references) || section.references.length < 1) errors.push(`${file}: section ${index + 1} needs a reference`);
    for (const ref of section.references ?? []) if (!references.has(ref)) errors.push(`${file}: section ${index + 1} missing reference ${ref}`);
  }
  if (!Array.isArray(data.references) || data.references.length < 1) errors.push(`${file}: references required`);
  for (const ref of data.references ?? []) if (!references.has(ref)) errors.push(`${file}: missing reference ${ref}`);
  for (const id of data.relatedLessons ?? []) if (!lessons.has(id)) errors.push(`${file}: missing related lesson ${id}`);
  for (const id of data.relatedCompetencies ?? []) if (!competencies.has(id)) errors.push(`${file}: missing related competency ${id}`);
}

const seenTerms = new Set();
for (const { file, data } of glossary) {
  if (!/^GLOSS-[A-Z0-9-]+$/.test(data.id ?? '')) errors.push(`${file}: invalid glossary id`);
  const normalized = String(data.term ?? '').trim().toLowerCase();
  if (seenTerms.has(normalized)) errors.push(`${file}: duplicate glossary term ${data.term}`); else seenTerms.add(normalized);
  if (typeof data.definition !== 'string' || data.definition.length < 40) errors.push(`${file}: definition must be at least 40 characters`);
  for (const ref of data.references ?? []) if (!references.has(ref)) errors.push(`${file}: missing reference ${ref}`);
  for (const id of data.relatedEncyclopedia ?? []) if (!entryIds.has(id)) errors.push(`${file}: missing encyclopedia entry ${id}`);
}

if (entries.length < 15) errors.push(`knowledge base requires at least 15 substantive seed entries; found ${entries.length}`);
if (glossary.length < 20) errors.push(`knowledge base requires at least 20 glossary seed entries; found ${glossary.length}`);

if (errors.length) {
  console.error('Knowledge-base validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Knowledge-base validation passed: ${entries.length} encyclopedia entries, ${glossary.length} glossary entries.`);
