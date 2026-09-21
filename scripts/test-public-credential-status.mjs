import fs from 'node:fs';

const registryPath = 'registry/credential-public-status.json';
const canonicalPath = 'content/credential-programs/registry.json';

const publicStatus = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));

const errors = [];

if (publicStatus.foundationalCertificates?.length !== 2) {
  errors.push(`Expected 2 foundational certificates, found ${publicStatus.foundationalCertificates?.length ?? 0}`);
}

if (publicStatus.professionalCredentials?.length !== 8) {
  errors.push(`Expected 8 professional credentials, found ${publicStatus.professionalCredentials?.length ?? 0}`);
}

const canonicalIds = new Set((canonical.programs ?? []).map((program) => program.id));
for (const credential of publicStatus.professionalCredentials ?? []) {
  if (!canonicalIds.has(credential.id)) {
    errors.push(`Public credential ${credential.id} is not present in the canonical credential registry.`);
  }
  if (credential.issuanceAvailable && credential.publicStatus !== 'release-ready') {
    errors.push(`${credential.id} cannot set issuanceAvailable=true without publicStatus=release-ready.`);
  }
}

for (const certificate of publicStatus.foundationalCertificates ?? []) {
  if (certificate.issuanceAvailable && certificate.publicStatus !== 'release-ready') {
    errors.push(`${certificate.title} cannot set issuanceAvailable=true without publicStatus=release-ready.`);
  }
}

const technicianI = publicStatus.professionalCredentials?.find((credential) => credential.id === 'CREDPROG-CULT-TECH-I-001');
if (!technicianI) {
  errors.push('Technician I public status entry is required.');
} else {
  const expectedTech1Courses = Array.from({ length: 7 }, (_, index) => `COURSE-LH-TECH1-${String(index + 1).padStart(3, '0')}`);
  if (JSON.stringify(technicianI.availableCourses ?? []) !== JSON.stringify(expectedTech1Courses)) {
    errors.push(`Technician I must expose all seven public academic courses in canonical order; found ${JSON.stringify(technicianI.availableCourses ?? [])}.`);
  }
  if (technicianI.issuanceAvailable) {
    errors.push('Technician I issuance must remain false until release-evidence gates are explicitly complete.');
  }
}

const technicianII = publicStatus.professionalCredentials?.find((credential) => credential.id === 'CREDPROG-CULT-TECH-II-001');
if (!technicianII) {
  errors.push('Technician II public status entry is required.');
} else {
  const expectedTech2Courses = Array.from({ length: 8 }, (_, index) => `COURSE-LH-TECH2-${String(index + 1).padStart(3, '0')}`);
  if (JSON.stringify(technicianII.availableCourses ?? []) !== JSON.stringify(expectedTech2Courses)) {
    errors.push(`Technician II must expose all eight public academic courses in canonical order; found ${JSON.stringify(technicianII.availableCourses ?? [])}.`);
  }
  if (technicianII.issuanceAvailable) {
    errors.push('Technician II issuance must remain false until release-evidence gates are explicitly complete.');
  }
}

const allowedStatuses = new Set(['available-academic', 'in-development', 'planned', 'release-ready']);
for (const offering of [
  ...(publicStatus.foundationalCertificates ?? []),
  ...(publicStatus.professionalCredentials ?? []),
]) {
  if (!allowedStatuses.has(offering.publicStatus)) {
    errors.push(`${offering.id ?? offering.title} uses unsupported publicStatus ${offering.publicStatus}.`);
  }
}

if (errors.length) {
  console.error('Public credential status audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Public credential status audit passed: 2 foundational certificates + 8 professional credentials are represented with fail-closed issuance state.');
