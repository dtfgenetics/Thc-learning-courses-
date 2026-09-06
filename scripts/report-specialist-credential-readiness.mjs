import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readDir = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(root, dir, f), 'utf8')));
const credentials = readDir('content/credentials');
const courses = new Map(readDir('content/courses').map((x) => [x.id, x]));
const assessments = new Map(readDir('content/assessments').map((x) => [x.id, x]));
const questions = new Map(readDir('content/questions').map((x) => [x.id, x]));

let errors = 0;
console.log('Specialist credential readiness');
for (const credential of credentials) {
  const course = courses.get(credential.course);
  if (!course) { console.error(`ERROR ${credential.id}: missing course ${credential.course}`); errors++; continue; }
  const required = credential.eligibility?.requiredAssessments ?? [];
  let totalItems = 0;
  let activeItems = 0;
  let structural = true;
  for (const assessmentId of required) {
    const assessment = assessments.get(assessmentId);
    if (!assessment) { console.error(`ERROR ${credential.id}: missing assessment ${assessmentId}`); errors++; structural = false; continue; }
    if (!['summative','credential'].includes(assessment.purpose)) { console.error(`ERROR ${credential.id}: ${assessmentId} is not summative/credential purpose`); errors++; structural = false; }
    for (const itemId of assessment.items ?? []) {
      const item = questions.get(itemId);
      if (!item) { console.error(`ERROR ${credential.id}: missing item ${itemId}`); errors++; structural = false; continue; }
      totalItems++;
      if (item.status === 'active') activeItems++;
    }
  }
  const publishedChain = credential.status === 'published' && course.status === 'published' && required.every((id) => assessments.get(id)?.status === 'published');
  const allItemsActive = totalItems > 0 && activeItems === totalItems;
  const issuanceReady = structural && publishedChain && allItemsActive;
  console.log(`${credential.id}: course=${course.status}; credential=${credential.status}; items=${activeItems}/${totalItems} active; issuanceReady=${issuanceReady}`);
  if (issuanceReady && !course.credentialBearing) { console.error(`ERROR ${credential.id}: issuance-ready credential course is not credentialBearing`); errors++; }
}
if (errors) process.exit(1);
