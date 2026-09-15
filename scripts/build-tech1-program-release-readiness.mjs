import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const writeText = (rel, value) => fs.writeFileSync(path.join(root, rel), value);
const read = (rel) => JSON.parse(readText(rel));
const write = (rel, value) => writeText(rel, JSON.stringify(value, null, 2) + '\n');

// 1) Correct the stale Technician I capstone alias in the planning registry.
const credentialRegistryPath = 'content/credential-programs/registry.json';
const credentialRegistry = read(credentialRegistryPath);
const tech1Registry = credentialRegistry.programs?.find((row) => row.id === 'CREDPROG-CULT-TECH-I-001');
if (!tech1Registry) throw new Error('Technician I registry entry not found');
tech1Registry.credentialAssessment = 'ASSESS-CRED-TECH1-001';
tech1Registry.capstone = 'CAPSTONE-TECH1-SHIFT-001';
write(credentialRegistryPath, credentialRegistry);

// 2) Extend global curriculum validation to include professional credential programs.
const validatorPath = 'scripts/validate-curriculum.mjs';
let validator = readText(validatorPath);
if (!validator.includes("credentialPrograms: readDirJson('content/credential-programs')")) {
  const collectionNeedle = "  credentials: readDirJson('content/credentials'),\n  reviews: readDirJson('content/reviews')";
  if (!validator.includes(collectionNeedle)) throw new Error('Unable to locate curriculum collection insertion point');
  validator = validator.replace(collectionNeedle, "  credentials: readDirJson('content/credentials'),\n  credentialPrograms: readDirJson('content/credential-programs'),\n  reviews: readDirJson('content/reviews')");
}
if (!validator.includes('// 9A. PROFESSIONAL CREDENTIAL PROGRAM VALIDATION')) {
  const validationNeedle = "const credentialTime = performance.now() - startCredentialTime;\n\n// 10. REFERENCE VALIDATION";
  if (!validator.includes(validationNeedle)) throw new Error('Unable to locate credential-program validation insertion point');
  const insertion = `const credentialTime = performance.now() - startCredentialTime;\n\n// 9A. PROFESSIONAL CREDENTIAL PROGRAM VALIDATION\nconst startCredentialProgramTime = performance.now();\nfor (const { file, data } of collections.credentialPrograms) {\n  if (!data.id?.startsWith('CREDPROG-')) continue;\n  requireMany(file, data.requiredCourses, 'required course');\n  requireMany(file, data.competencies, 'competency');\n  requireId(file, data.assessmentModel?.credentialAssessment, 'credential assessment');\n}\nconst credentialProgramTime = performance.now() - startCredentialProgramTime;\n\n// 10. REFERENCE VALIDATION`;
  validator = validator.replace(validationNeedle, insertion);
}
writeText(validatorPath, validator);

// 3) Wire the release-readiness regression into the deterministic package suite.
const pkgPath = 'package.json';
const pkg = read(pkgPath);
pkg.scripts['tech1:release-readiness'] = 'node scripts/report-tech1-release-readiness.mjs --human';
pkg.scripts['tech1:release-readiness:test'] = 'node scripts/test-tech1-release-readiness.mjs';
if (!pkg.scripts.test.includes('npm run tech1:release-readiness:test')) {
  const testNeedle = 'npm run tech1:course7:test';
  if (!pkg.scripts.test.includes(testNeedle)) throw new Error('Unable to locate Course 007 test in npm test chain');
  pkg.scripts.test = pkg.scripts.test.replace(testNeedle, `${testNeedle} && npm run tech1:release-readiness:test`);
}
write(pkgPath, pkg);

console.log('Technician I program release-readiness integration patched: registry capstone aligned, credential-program references validated, release-readiness test wired.');
