import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const publicStatus = JSON.parse(fs.readFileSync('registry/credential-public-status.json', 'utf8'));
const buildTarget = JSON.parse(fs.readFileSync('registry/catalog-build-target.json', 'utf8'));

const offerings = [
  ...(publicStatus.foundationalCertificates ?? []),
  ...(publicStatus.professionalCredentials ?? []),
];

assert.equal(offerings.length, 10, 'The canonical public catalog must contain exactly 10 offerings.');
assert.match(html, /id="credential-pathways"/, 'The learner portal must expose a credential-pathways section.');
assert.match(html, /Certification roadmap/, 'The learner portal should clearly label the credential roadmap.');

for (const offering of offerings) {
  assert.ok(
    html.includes(`data-credential-offering="${offering.title}"`),
    `Public catalog is missing offering: ${offering.title}`
  );
  assert.ok(
    html.includes(`data-offering-status="${offering.publicStatus}"`),
    `Public catalog is missing canonical status ${offering.publicStatus} for ${offering.title}`
  );
}

const offeringMarkers = html.match(/data-credential-offering=/g) ?? [];
assert.equal(
  offeringMarkers.length,
  buildTarget.expectedVisibleOfferings,
  `Expected ${buildTarget.expectedVisibleOfferings} visible credential offerings in the learner portal.`
);

const issuanceTrueMarkers = html.match(/data-issuance-available="true"/g) ?? [];
assert.equal(
  issuanceTrueMarkers.length,
  buildTarget.credentialIssuanceEnabled.length,
  'Learner portal must not claim credential issuance availability before release approval.'
);

for (const courseId of buildTarget.currentlyAvailableAcademicCourses ?? []) {
  const owner = publicStatus.professionalCredentials.find((credential) => credential.availableCourses?.includes(courseId));
  assert.ok(owner, `${courseId} must be mapped to a visible credential pathway.`);
}

assert.match(
  html,
  /Course 1 is the only public academic course currently marked available/i,
  'The learner portal must distinguish current academic-course availability from certification issuance.'
);

assert.match(
  html,
  /Course 1 available below/i,
  'Technician I should expose the currently available public Course 1 entry point.'
);

console.log('Certification catalog UI audit passed: 10 offerings are visible, Course 1 is clearly separated from credential issuance, and no unfinished credential is advertised as issuable.');
