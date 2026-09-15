import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const programTestPath = path.join(root, 'scripts/test-tech2-program-structure.mjs');
let programTest = fs.readFileSync(programTestPath, 'utf8');
const anchor = "'COURSE-LH-TECH2-005':{final:'ASSESS-LH-TECH2-005-FINAL',practical:'PRACTICAL-TECH2-E-PROPAGATION-CANOPY-PERFORMANCE-REVIEW'}";
const addition = `${anchor},\n'COURSE-LH-TECH2-006':{final:'ASSESS-LH-TECH2-006-FINAL',practical:'PRACTICAL-TECH2-F-POSTHARVEST-DEVIATION-LOT-SCOPE'}`;
if (!programTest.includes("'COURSE-LH-TECH2-006':{final:'ASSESS-LH-TECH2-006-FINAL'")) {
  if (!programTest.includes(anchor)) throw new Error('Course 005 built-course anchor not found in Technician II program test');
  programTest = programTest.replace(anchor, addition);
}
programTest = programTest.replace('five built-course mappings', 'six built-course mappings');
fs.writeFileSync(programTestPath, programTest);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts['tech2:course6:test'] = 'node scripts/test-tech2-course6.mjs';
if (!pkg.scripts.test.includes('npm run tech2:course6:test')) {
  const testAnchor = 'npm run tech2:course5:test';
  if (!pkg.scripts.test.includes(testAnchor)) throw new Error('Course 005 npm-test anchor not found');
  pkg.scripts.test = pkg.scripts.test.replace(testAnchor, `${testAnchor} && npm run tech2:course6:test`);
}
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const status = `# Technician II Course 006 Build Status\n\nCourse 006 is built as the dedicated postharvest deviation and lot-scope course aligned to Technician II Curriculum Map Units 08–09 and Practical F.\n\nGenerated: six objectives, four applied lessons, one dedicated deviation-investigation module, 12 distinct formative items, 24 summative items, Practical F mapping, and deterministic regression coverage. The course explicitly distinguishes room RH from product water activity, preserves lot genealogy and affected-scope evidence, and does not confer independent product release or disposition authority.\n\nStatus remains **draft** pending human technical/assessment review, accessibility review, Practical F validation, pilot/performance evidence, private operational credential forms, standard setting and final release approval.\n`;
fs.writeFileSync(path.join(root, 'docs/academy-v2/TECH2_COURSE006_BUILD_STATUS.md'), status);

console.log('Finalized Technician II Course 006 integration contracts.');
