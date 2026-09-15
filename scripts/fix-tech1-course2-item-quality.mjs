import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const write = (rel, value) => fs.writeFileSync(path.join(root, rel), JSON.stringify(value, null, 2) + '\n');

// Rebalance the authored key positions of the 20 summative items without changing the keyed answer text.
for (let i = 1; i <= 20; i++) {
  const id = `ITEM-LH-TECH1-002-${String(i).padStart(3, '0')}`;
  const rel = `content/questions/${id}.json`;
  const item = read(rel);
  const target = (i - 1) % 4;
  const answer = item.choices[item.correct];
  const distractors = item.choices.filter((_, index) => index !== item.correct);
  distractors.splice(target, 0, answer);
  item.choices = distractors;
  item.correct = target;
  write(rel, item);
}

const raw = [
  ['001','COMP-PLANT-BIO-001','LO-LH-TECH1-002-01','apply','moderate','A technician must choose a routine observation route. Which approach best supports a representative crop record?','Include supplied edge, center and process-zone points rather than choosing only convenient plants',['Inspect only the nearest plants','Inspect only visibly abnormal plants','Use one bench as a substitute for the entire room']],
  ['002','COMP-FLOWER-001','LO-LH-TECH1-002-02','apply','moderate','What is the strongest basis for describing developmental stage in a crop record?','Observable morphology, with schedule timing retained as context',['Days since the calendar start date alone','Cultivar name alone','The expected harvest date alone']],
  ['003','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','analyze','moderate','Which statement is a direct observation rather than an unsupported diagnosis?','Four sampled plants in Zone C show marginal leaf necrosis on older leaves',['Zone C has nutrient burn','The cultivar is genetically weak','The irrigation recipe caused the damage']],
  ['004','COMP-PRO-QA-001','LO-LH-TECH1-002-04','apply','moderate','Which record detail is essential for making a crop observation reconstructable?','The identity and location of the crop or plant being described',['A guess about the final diagnosis','A fertilizer recommendation','A prediction of yield']],
  ['005','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','analyze','moderate','A condition appears only along one room edge. What should the technician preserve first?','The spatial concentration and representative comparison observations',['A room-wide diagnosis','A cultivar-wide conclusion','A treatment decision outside the work order']],
  ['006','COMP-PRO-QA-001','LO-LH-TECH1-002-04','apply','easy','Which photo set provides the strongest observation evidence?','A context image and clear close image linked to plant or zone identity and time',['A filtered close-up with no identity','A cropped image saved without location','An edited image that exaggerates color difference']],
  ['007','COMP-FLOWER-001','LO-LH-TECH1-002-02','analyze','moderate','Several plants visibly lag the dominant reproductive morphology even though the room shares one schedule. What is the best record?','Document the dominant stage and the lagging subgroup separately',['Assign every plant the scheduled stage','Delete the exceptions from the sample','Assume the lagging plants are diseased']],
  ['008','COMP-PRO-SOP-001','LO-LH-TECH1-002-05','apply','moderate','A sudden widespread abnormality appears during a routine crop walk. What should Technician I do?','Document the pattern, perform permitted checks and escalate promptly under the supplied procedure',['Redesign the environmental strategy independently','Wait for a confirmed diagnosis before recording anything','Change multiple controls before preserving the original condition']],
  ['009','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','apply','moderate','When root or media condition is visible and relevant to a crop observation, how should it be handled?','Record the visible root-zone evidence as part of the observation context',['Ignore it because only leaves matter','Use odor alone to confirm disease','Treat one visible root as proof of room-wide condition']],
  ['010','COMP-PLANT-BIO-001','LO-LH-TECH1-002-03','analyze','hard','A crop difference appears after an irrigation event. Which statement best preserves the evidence boundary?','Record the timing as context while keeping causation unresolved unless additional evidence supports it',['Record irrigation as the confirmed cause','Remove the timing because context creates bias','Change the irrigation program before documenting the pattern']],
  ['011','COMP-PRO-SOP-001','LO-LH-TECH1-002-05','apply','moderate','What should a shift handoff do with an unresolved crop abnormality?','State what remains unresolved, what was escalated and what follow-up is required',['Omit it until a diagnosis is final','Replace uncertainty with the most likely cause','Record only completed routine tasks']],
  ['012','COMP-PRO-QA-001','LO-LH-TECH1-002-04','analyze','moderate','A crop observation was linked to the wrong plant ID and must be corrected. What is the strongest record practice?','Use the controlled correction process so the original entry and corrected identity remain reconstructable',['Silently overwrite the original ID','Delete the whole observation','Keep the wrong ID because records cannot be corrected']]
];

const makeFormative = (entry, index) => {
  const [num, competency, objective, bloomLevel, difficulty, stem, correctText, wrong] = entry;
  const target = index % 4;
  const choices = [...wrong];
  choices.splice(target, 0, correctText);
  return {
    id: `ITEM-LH-TECH1-002-M01-${num}`,
    version: 1,
    status: 'draft',
    purpose: 'formative',
    competency,
    objective,
    bloomLevel,
    difficulty,
    type: 'multiple-choice',
    stem,
    choices,
    correct: target,
    rationale: correctText + '. This response preserves the Course 002 evidence, identity, role-boundary or documentation principle being assessed.',
    references: competency === 'COMP-FLOWER-001'
      ? ['REF-FLOWER-MORPH-2023-001']
      : competency === 'COMP-PRO-QA-001'
        ? ['REF-MHRA-GXP-DATA-INTEGRITY']
        : ['REF-PLANT-BIO-001'],
    extensions: { courseId: 'COURSE-LH-TECH1-002', itemSet: 'course2-module1-formative' }
  };
};

const formative = raw.map(makeFormative);
for (const item of formative) write(`content/questions/${item.id}.json`, item);

const moduleAssessment = read('content/assessments/ASSESS-LH-TECH1-002-M01.json');
moduleAssessment.version = '1.1.0';
moduleAssessment.items = formative.map((x) => x.id);
write('content/assessments/ASSESS-LH-TECH1-002-M01.json', moduleAssessment);

const finalAssessment = read('content/assessments/ASSESS-LH-TECH1-002-FINAL.json');
finalAssessment.version = '1.1.0';
finalAssessment.extensions = {
  ...finalAssessment.extensions,
  distinctFormativeBank: true,
  formativeAssessment: 'ASSESS-LH-TECH1-002-M01'
};
write('content/assessments/ASSESS-LH-TECH1-002-FINAL.json', finalAssessment);

const course = read('content/courses/COURSE-LH-TECH1-002.json');
course.version = '0.2.1';
course.extensions = {
  ...course.extensions,
  dedicatedItemCount: 32,
  formativeItemCount: 12,
  summativeItemCount: 20
};
write('content/courses/COURSE-LH-TECH1-002.json', course);

const test = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst root = process.cwd();\nconst read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));\nconst exists = (p) => fs.existsSync(path.join(root, p));\nconst course = read('content/courses/COURSE-LH-TECH1-002.json');\nassert.equal(course.status, 'draft');\nassert.equal(course.finalAssessment, 'ASSESS-LH-TECH1-002-FINAL');\nassert.ok(course.modules.includes('MOD-LH-TECH1-002-OBSERVATION'));\nassert.equal(course.extensions?.dedicatedCourseAssessmentRequired, false);\nassert.equal(course.extensions?.dedicatedPerformanceValidationRequired, true);\nassert.equal(course.extensions?.dedicatedItemCount, 32);\n\nconst module = read('content/modules/MOD-LH-TECH1-002-OBSERVATION.json');\nassert.equal(module.lessons.length, 4);\nassert.equal(module.assessment, 'ASSESS-LH-TECH1-002-M01');\nfor (const lessonId of module.lessons) {\n  assert.ok(exists(\`content/lessons/\${lessonId}.json\`), \`missing Course 002 lesson \${lessonId}\`);\n  const lesson = read(\`content/lessons/\${lessonId}.json\`);\n  assert.ok(lesson.estimatedMinutes >= 45);\n  assert.ok(lesson.content?.overview?.length >= 40);\n  for (const objective of lesson.learningObjectives) assert.ok(exists(\`content/learning-objectives/\${objective}.json\`), \`missing objective \${objective}\`);\n}\n\nconst formative = read('content/assessments/ASSESS-LH-TECH1-002-M01.json');\nconst final = read('content/assessments/ASSESS-LH-TECH1-002-FINAL.json');\nassert.equal(formative.purpose, 'formative');\nassert.equal(formative.items.length, 12);\nassert.equal(final.status, 'draft');\nassert.equal(final.purpose, 'summative');\nassert.equal(final.items.length, 20);\nassert.equal(new Set(final.items).size, 20);\nassert.equal(new Set([...formative.items, ...final.items]).size, 32, 'formative and summative Course 002 items must be distinct');\nassert.deepEqual(new Set(final.objectives), new Set(['LO-LH-TECH1-002-01','LO-LH-TECH1-002-02','LO-LH-TECH1-002-03','LO-LH-TECH1-002-04','LO-LH-TECH1-002-05']));\nconst objectiveCounts = new Map(final.objectives.map((id) => [id, 0]));\nconst keyCounts = [0,0,0,0];\nlet appliedOrHigher = 0;\nfor (const itemId of final.items) {\n  const file = \`content/questions/\${itemId}.json\`;\n  assert.ok(exists(file), \`missing item \${itemId}\`);\n  const item = read(file);\n  assert.equal(item.status, 'draft');\n  assert.equal(item.purpose, 'summative');\n  assert.ok(final.competencies.includes(item.competency));\n  assert.ok(final.objectives.includes(item.objective));\n  assert.ok(Array.isArray(item.references) && item.references.length > 0);\n  objectiveCounts.set(item.objective, objectiveCounts.get(item.objective) + 1);\n  keyCounts[item.correct]++;\n  if (['apply','analyze','evaluate','create'].includes(item.bloomLevel)) appliedOrHigher++;\n}\nfor (const [id, count] of objectiveCounts) assert.ok(count >= 4, \`\${id} requires at least four course-specific summative items; found \${count}\`);\nassert.ok(appliedOrHigher >= 18, \`Course 002 summative bank should be predominantly applied/analyze; found \${appliedOrHigher}/20\`);\nassert.ok(Math.max(...keyCounts) <= 6, \`summative answer-key positions should be balanced; found \${keyCounts.join(',')}\`);\nfor (const itemId of formative.items) {\n  const item = read(\`content/questions/\${itemId}.json\`);\n  assert.equal(item.purpose, 'formative');\n  assert.ok(formative.objectives.includes(item.objective));\n}\nassert.equal(final.extensions?.linkedCredentialPractical, 'PRACTICAL-TECH1-A');\nconsole.log('Course 002 production slice passed: four lessons, five objectives, 12 distinct formative items and 20 balanced summative items are wired while release remains draft-gated.');\n`;
fs.writeFileSync(path.join(root, 'scripts/test-tech1-course2.mjs'), test);

const statusPath = path.join(root, 'docs/academy-v2/COURSE002_BUILD_STATUS.md');
if (fs.existsSync(statusPath)) {
  let status = fs.readFileSync(statusPath, 'utf8');
  status = status.replace('twenty source-backed Course 002 summative-development items;', 'thirty-two distinct source-backed Course 002 items: twelve formative and twenty summative-development items;');
  status = status.replace('The initial dedicated bank contains 20 Course 002 items', 'The dedicated bank contains 32 Course 002 items: 12 formative items and 20 summative-development items');
  status = status.replace('It is a development seed bank, not a production-ready credential bank.', 'The formative and summative item sets are non-overlapping, and authored answer-key positions are balanced. It remains a development bank, not a production-ready credential bank.');
  fs.writeFileSync(statusPath, status);
}

console.log('Course 002 item-quality repair applied: distinct formative bank created and summative key positions rebalanced.');
