import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readDir = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(root, dir, f), 'utf8')));
const credentials = readDir('content/credentials');
const courses = new Map(readDir('content/courses').map((x) => [x.id, x]));
const assessments = new Map(readDir('content/assessments').map((x) => [x.id, x]));
const questionList = readDir('content/questions');
const questions = new Map(questionList.map((x) => [x.id, x]));

let errors = 0;
console.log('Specialist credential readiness');
for (const credential of credentials) {
  const course = courses.get(credential.course);
  if (!course) { console.error(`ERROR ${credential.id}: missing course ${credential.course}`); errors++; continue; }
  const required = credential.eligibility?.requiredAssessments ?? [];
  let structural = true;
  let assessmentPoolsReady = true;
  const assessmentSummaries = [];

  for (const assessmentId of required) {
    const assessment = assessments.get(assessmentId);
    if (!assessment) { console.error(`ERROR ${credential.id}: missing assessment ${assessmentId}`); errors++; structural = false; assessmentPoolsReady = false; continue; }
    if (!['summative','credential'].includes(assessment.purpose)) { console.error(`ERROR ${credential.id}: ${assessmentId} is not summative/credential purpose`); errors++; structural = false; assessmentPoolsReady = false; }

    const staticItems = assessment.items ?? [];
    const blueprint = assessment.blueprint ?? [];

    if (staticItems.length > 0) {
      let activeItems = 0;
      for (const itemId of staticItems) {
        const item = questions.get(itemId);
        if (!item) { console.error(`ERROR ${credential.id}: missing item ${itemId}`); errors++; structural = false; assessmentPoolsReady = false; continue; }
        if (item.status === 'active') activeItems++;
      }
      const ready = staticItems.length > 0 && activeItems === staticItems.length;
      if (!ready) assessmentPoolsReady = false;
      assessmentSummaries.push(`${assessment.id}: static ${activeItems}/${staticItems.length} active`);
      continue;
    }

    if (blueprint.length > 0) {
      const minActive = assessment.itemSelection?.minimumActiveItemsPerCompetency;
      if (!Number.isInteger(minActive) || minActive < 1) {
        console.error(`ERROR ${credential.id}: blueprint assessment ${assessment.id} requires minimumActiveItemsPerCompetency`);
        errors++; structural = false; assessmentPoolsReady = false;
        continue;
      }
      let totalActive = 0;
      let totalRequired = 0;
      const deficient = [];
      for (const row of blueprint) {
        const pool = questionList.filter((item) => item.competency === row.competency && ['summative','credential'].includes(item.purpose));
        const activePool = pool.filter((item) => item.status === 'active' && (!assessment.itemSelection?.requireReferenceBackedItems || (item.references?.length ?? 0) > 0));
        totalActive += activePool.length;
        totalRequired += minActive;
        if (activePool.length < minActive) deficient.push(`${row.competency} ${activePool.length}/${minActive}`);
      }
      const ready = deficient.length === 0;
      if (!ready) assessmentPoolsReady = false;
      assessmentSummaries.push(`${assessment.id}: blueprint pool ${totalActive}/${totalRequired} active minimum${deficient.length ? `; deficient=${deficient.join(', ')}` : ''}`);
      continue;
    }

    console.error(`ERROR ${credential.id}: assessment ${assessment.id} has neither static items nor a blueprint`);
    errors++; structural = false; assessmentPoolsReady = false;
  }

  const publishedChain = credential.status === 'published' && course.status === 'published' && required.length > 0 && required.every((id) => assessments.get(id)?.status === 'published');
  const issuanceReady = structural && publishedChain && assessmentPoolsReady;
  console.log(`${credential.id}: course=${course.status}; credential=${credential.status}; ${assessmentSummaries.join(' | ') || 'no assessment pool'}; issuanceReady=${issuanceReady}`);
  if (issuanceReady && !course.credentialBearing) { console.error(`ERROR ${credential.id}: issuance-ready credential course is not credentialBearing`); errors++; }
}
if (errors) process.exit(1);
