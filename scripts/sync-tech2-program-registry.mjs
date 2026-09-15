import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const writeMode = process.argv.includes('--write');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, value) => fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);

const programPath = 'content/credential-programs/CREDPROG-CULT-TECH-II-001.json';
const registryPath = 'content/credential-programs/registry.json';
const program = read(programPath);
const registry = read(registryPath);
const entry = (registry.programs ?? []).find((row) => row.id === program.id);
if (!entry) throw new Error(`Missing ${program.id} in ${registryPath}`);

const canonicalCourses = (program.requiredCourses ?? []).map((id) => {
  const course = read(`content/courses/${id}.json`);
  if (course.id !== id) throw new Error(`Course id mismatch for ${id}: ${course.id}`);
  return { id, title: course.title };
});

const expected = {
  title: program.title,
  plannedCourses: canonicalCourses,
  credentialAssessment: program.assessmentModel?.credentialAssessment,
  capstone: program.assessmentModel?.capstone
};

const diffs = [];
if (entry.title !== expected.title) diffs.push(`title: ${entry.title} != ${expected.title}`);
if (JSON.stringify(entry.plannedCourses) !== JSON.stringify(expected.plannedCourses)) diffs.push('plannedCourses differ from canonical required course ids/titles');
if (entry.credentialAssessment !== expected.credentialAssessment) diffs.push(`credentialAssessment: ${entry.credentialAssessment} != ${expected.credentialAssessment}`);
if (entry.capstone !== expected.capstone) diffs.push(`capstone: ${entry.capstone} != ${expected.capstone}`);

if (writeMode) {
  entry.title = expected.title;
  entry.plannedCourses = expected.plannedCourses;
  entry.credentialAssessment = expected.credentialAssessment;
  entry.capstone = expected.capstone;
  write(registryPath, registry);
  console.log(`Synchronized ${program.id} registry entry from canonical program/course objects.`);
} else {
  if (diffs.length) {
    console.error(`Technician II program registry drift detected:\n- ${diffs.join('\n- ')}`);
    process.exit(1);
  }
  console.log('Technician II program registry is synchronized with canonical program/course objects.');
}
