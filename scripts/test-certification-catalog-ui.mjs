import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('apps/web/public/index.html', 'utf8');
const publicStatus = JSON.parse(fs.readFileSync('registry/credential-public-status.json', 'utf8'));
const buildTarget = JSON.parse(fs.readFileSync('registry/catalog-build-target.json', 'utf8'));

const offerings = [
  ...(publicStatus.foundationalCertificates ?? []),
  ...(publicStatus.professionalCredentials ?? []),
];

assert.equal(offerings.length, 10, 'The canonical credential data model must retain exactly 10 offerings.');

assert.match(html, /id="credential-pathways"/, 'The learner portal must expose the Academy pathway section.');
assert.match(html, /Start Technician I/i, 'The learner portal must provide an obvious Technician I starting action.');
assert.match(html, /Cultivation Technician II/i, 'The learner portal must show the advanced Technician II pathway.');
assert.match(html, /What is available now/i, 'The learner portal must distinguish currently available academic study from future credential issuance.');
assert.match(html, /Professional certification/i, 'The learner portal must state the professional certification boundary.');
assert.match(html, /Future specialist and leadership pathways/i, 'Future pathways must remain discoverable without competing with the primary learner entry path.');
assert.match(html, /Browse courses/i, 'The learner portal must provide direct course discovery.');

assert.doesNotMatch(
  html,
  /Begin with the available courses below/i,
  'Stale language implying only a subset of Technician I courses is available must not return.'
);

const issuanceTrueMarkers = html.match(/data-issuance-available="true"/g) ?? [];
assert.equal(
  issuanceTrueMarkers.length,
  buildTarget.credentialIssuanceEnabled.length,
  'Learner portal must not claim credential issuance availability before release approval.'
);

for (const courseId of buildTarget.currentlyAvailableAcademicCourses ?? []) {
  const owner = publicStatus.professionalCredentials.find((credential) => credential.availableCourses?.includes(courseId));
  assert.ok(owner, `${courseId} must remain mapped to a canonical credential pathway in the data model.`);
}

// The redesigned landing page intentionally does not render every planned credential as a top-level card.
// Canonical offerings remain in credential-public-status.json and are surfaced through pathway/status views.
const legacyOfferingCards = html.match(/data-credential-offering=/g) ?? [];
assert.equal(
  legacyOfferingCards.length,
  0,
  'The learner-first landing page should not regress to the old ten-card credential wall.'
);

console.log('Certification catalog UI audit passed: canonical offerings remain in the data model, Technician I/II are learner-first, future pathways are secondary, and unfinished credentials are not advertised as issuable.');
