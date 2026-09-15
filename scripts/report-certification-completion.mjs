import fs from 'node:fs';

const publicStatus = JSON.parse(fs.readFileSync('registry/credential-public-status.json', 'utf8'));
const course1Target = JSON.parse(fs.readFileSync('registry/course1-completion-target.json', 'utf8'));

const offerings = [
  ...(publicStatus.foundationalCertificates ?? []),
  ...(publicStatus.professionalCredentials ?? []),
];

console.log('# Certification completion summary');
console.log(`Visible offerings target: ${offerings.length}`);
console.log(`Issuance-enabled offerings: ${offerings.filter((x) => x.issuanceAvailable).length}`);
console.log(`In development: ${offerings.filter((x) => x.publicStatus === 'in-development').length}`);
console.log(`Planned: ${offerings.filter((x) => x.publicStatus === 'planned').length}`);
console.log(`Course 1 completion domains tracked: ${course1Target.completionDomains.length}`);

for (const offering of offerings) {
  console.log(`- ${offering.title}: ${offering.publicStatus}; issuance=${offering.issuanceAvailable ? 'enabled' : 'blocked'}`);
}
