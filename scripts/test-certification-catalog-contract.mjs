import fs from 'node:fs';

const target = JSON.parse(fs.readFileSync('registry/catalog-build-target.json', 'utf8'));
const status = JSON.parse(fs.readFileSync(target.sourceOfTruth, 'utf8'));

const errors = [];
const foundationCount = status.foundationalCertificates?.length ?? 0;
const professionalCount = status.professionalCredentials?.length ?? 0;
const visibleCount = foundationCount + professionalCount;

if (foundationCount !== target.expectedFoundationalCertificates) {
  errors.push(`Expected ${target.expectedFoundationalCertificates} foundational certificates, found ${foundationCount}.`);
}
if (professionalCount !== target.expectedProfessionalCredentials) {
  errors.push(`Expected ${target.expectedProfessionalCredentials} professional credentials, found ${professionalCount}.`);
}
if (visibleCount !== target.expectedVisibleOfferings) {
  errors.push(`Expected ${target.expectedVisibleOfferings} total visible offerings, found ${visibleCount}.`);
}

const declaredAvailable = new Set(
  (status.professionalCredentials ?? []).flatMap((credential) => credential.availableCourses ?? [])
);
for (const courseId of target.currentlyAvailableAcademicCourses ?? []) {
  if (!declaredAvailable.has(courseId)) {
    errors.push(`Catalog build target marks ${courseId} available but readiness registry does not.`);
  }
}
if (declaredAvailable.size !== (target.currentlyAvailableAcademicCourses ?? []).length) {
  errors.push(`Readiness registry declares ${declaredAvailable.size} available academic courses but build target declares ${(target.currentlyAvailableAcademicCourses ?? []).length}.`);
}
if ((target.currentlyAvailableAcademicCourses ?? []).length !== 15) {
  errors.push(`Expected 15 public Technician I/II academic courses, found ${(target.currentlyAvailableAcademicCourses ?? []).length}.`);
}

const issuanceEnabled = [
  ...(status.foundationalCertificates ?? []),
  ...(status.professionalCredentials ?? []),
].filter((offering) => offering.issuanceAvailable);

if (issuanceEnabled.length !== (target.credentialIssuanceEnabled ?? []).length) {
  errors.push(`Credential issuance mismatch: build target expects ${(target.credentialIssuanceEnabled ?? []).length}, readiness registry enables ${issuanceEnabled.length}.`);
}

if (errors.length) {
  console.error('Certification catalog contract failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Certification catalog contract passed: ${visibleCount} offerings represented, ${target.currentlyAvailableAcademicCourses.length} academic courses currently available, ${issuanceEnabled.length} credential issuances enabled.`);
