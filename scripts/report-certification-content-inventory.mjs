import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const policy = read('registry/certification-content-policy.json');
const dir = path.join(root,'content/courses');
const files = fs.readdirSync(dir).filter((n)=>n.endsWith('.json')).sort();
const rows = [];

for (const file of files) {
  const course = JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  let classification;
  if (/^COURSE-THC-C\d{3}$/.test(course.id)) classification = 'retiredLegacy420';
  else if (/^COURSE-LH-/.test(course.id)) classification = 'canonicalCertificationDevelopment';
  else if (course.credentialBearing === true) classification = 'migrationBacklog';
  else classification = 'publicNoncredential';

  rows.push({
    id:course.id,
    title:course.title,
    status:course.status,
    credentialBearing:course.credentialBearing,
    finalAssessment:course.finalAssessment ?? null,
    classification
  });
}

const groups = Object.fromEntries(
  ['canonicalCertificationDevelopment','migrationBacklog','publicNoncredential','retiredLegacy420']
    .map((key)=>[key,rows.filter((r)=>r.classification===key)])
);

const errors = [];
for (const row of groups.retiredLegacy420) {
  if (!['retired','superseded'].includes(row.status)) {
    errors.push(`${row.id} is a legacy 420-derived course object but is still ${row.status}`);
  }
  if (row.credentialBearing !== false) errors.push(`${row.id} must not be credential-bearing`);
}
for (const row of groups.canonicalCertificationDevelopment) {
  if (!row.id.startsWith('COURSE-LH-')) errors.push(`${row.id} violates canonical certification namespace`);
  if (row.finalAssessment && !row.finalAssessment.startsWith('ASSESS-LH-')) {
    errors.push(`${row.id} uses noncanonical course assessment ${row.finalAssessment}`);
  }
}

const summary = {
  totalCourseObjects:rows.length,
  canonicalCertificationCourses:groups.canonicalCertificationDevelopment.length,
  migrationBacklog:groups.migrationBacklog.length,
  publicNoncredential:groups.publicNoncredential.length,
  retiredLegacy420:groups.retiredLegacy420.length,
  errors:errors.length
};

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({summary,groups,errors},null,2)+'\n');
} else {
  console.log('Certification content inventory');
  console.log(JSON.stringify(summary,null,2));
  if (groups.migrationBacklog.length) {
    console.log('\nMigration backlog (pre-Learning-Hub credential-bearing course objects):');
    for (const row of groups.migrationBacklog) console.log(`- ${row.id}: ${row.title}`);
  }
  if (groups.retiredLegacy420.length) {
    console.log('\nRetired legacy 420-derived course objects:');
    for (const row of groups.retiredLegacy420) console.log(`- ${row.id}: ${row.status}`);
  }
}
if (errors.length) {
  for (const error of errors) console.error('ERROR '+error);
  process.exitCode = 1;
}
