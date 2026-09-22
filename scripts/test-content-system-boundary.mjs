import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const boundary = readJson('registry/content-system-boundary.json');
const curriculum = readJson('registry/curriculum.json');

const fail = (message) => {
  console.error(`CONTENT SYSTEM BOUNDARY VIOLATION: ${message}`);
  process.exitCode = 1;
};

const encyclopedia = boundary?.systems?.encyclopedia;
const certification = boundary?.systems?.certification;
const legacy = boundary?.systems?.legacy420Catalog;

if (encyclopedia?.targetCount !== 420) {
  fail('encyclopedia target must remain exactly 420 topics');
}
if (encyclopedia?.canonicalIdPattern !== 'THC-ENC-001..THC-ENC-420') {
  fail('canonical encyclopedia identity must remain THC-ENC-001..THC-ENC-420');
}
if (certification?.mustRemainIndependent !== true) {
  fail('certification curriculum must remain independent from encyclopedia completion');
}
if (legacy?.status !== 'crosswalk-only') {
  fail('historical THC-C001..THC-C420 catalog must remain crosswalk-only');
}
if (boundary?.countingRules?.noCombinedCompletionPercentage !== true) {
  fail('encyclopedia and certification may not share one completion percentage');
}

const certificationCollections = {
  courses: curriculum.courses ?? [],
  lessons: curriculum.lessons ?? [],
  assessments: curriculum.assessments ?? []
};

for (const [collection, ids] of Object.entries(certificationCollections)) {
  for (const id of ids) {
    if (/^THC-ENC-\d{3}$/.test(id)) {
      fail(`${collection} contains encyclopedia topic ${id}`);
    }
    if (/^THC-C\d{3}$/.test(id)) {
      fail(`${collection} contains exact historical catalog record ${id}`);
    }
  }
}

const courseIds = certificationCollections.courses;
if (!courseIds.some((id) => id.startsWith('COURSE-'))) {
  fail('certification curriculum must contain dedicated COURSE-* objects');
}

console.log('Content-system boundary OK: 420 encyclopedia topics are separate from certification courses, lessons, and assessments.');
