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
  if (!technicianI.availableCourses?.includes('COURSE-LH-TECH1-001')) {
    errors.push('Technician I must expose COURSE-LH-TECH1-001 as the currently available academic course.');
  }
  if (technicianI.issuanceAvailable) {
    errors.push('Technician I issuance must remain false until release-evidence gates are explicitly complete.');
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
