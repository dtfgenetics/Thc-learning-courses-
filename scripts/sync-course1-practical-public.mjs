import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const practicalPath = path.join(root, 'content/performance-assessments/PRACTICAL-LH-TECH1-001-WORKFLOW.json');
const runtimePath = path.join(root, 'apps/web/public/course-assessment.js');
const writeMode = process.argv.includes('--write');
const START = '/* COURSE1_PRACTICAL_PUBLIC_DATA_START */';
const END = '/* COURSE1_PRACTICAL_PUBLIC_DATA_END */';

function publicScoring(scoring = {}) {
  return {
    totalPoints: Number(scoring.totalPoints ?? 0),
    domains: (scoring.domains ?? []).map((domain) => ({
      name: domain.name,
      points: Number(domain.points)
    }))
  };
}

function publicProjection(practical) {
  const workflow = practical.extensions?.learnerWorkflow ?? {};
  return {
    id: practical.id,
    title: practical.title,
    version: practical.version,
    status: practical.status,
    deliveryModes: practical.deliveryModes ?? [],
    evidenceOutputs: practical.evidenceOutputs ?? [],
    scoring: publicScoring(practical.scoring),
    passingStandard: practical.passingStandard ?? { totalPoints: 0, minimumPercent: 0, noCriticalErrors: true },
    criticalErrors: practical.criticalErrors ?? [],
    overview: workflow.overview ?? '',
    academicUse: workflow.academicUse ?? '',
    preparationSteps: workflow.preparationSteps ?? [],
    stages: workflow.stages ?? [],
    supportResources: workflow.supportResources ?? [],
    boundary: workflow.boundary ?? ''
  };
}

const practical = JSON.parse(fs.readFileSync(practicalPath, 'utf8'));
if (practical.status !== 'published') throw new Error(`Course 1 practical must be published before runtime sync; found ${practical.status}`);
if (practical.extensions?.publicAcademicViewing !== true) throw new Error('Course 1 practical must set publicAcademicViewing=true');

const expected = `${START}\nconst COURSE_PRACTICAL_PUBLIC = ${JSON.stringify(publicProjection(practical), null, 2)};\n${END}`;
const source = fs.readFileSync(runtimePath, 'utf8');
const startIndex = source.indexOf(START);
const endIndex = source.indexOf(END);
if (startIndex < 0 || endIndex < startIndex) throw new Error('Course 1 practical public-data markers are missing from course-assessment.js');
const current = source.slice(startIndex, endIndex + END.length);
const normalizedCurrent = current.replace(/\r\n/g, '\n');
const sourceEol = source.includes('\r\n') ? '\r\n' : '\n';

if (writeMode) {
  if (normalizedCurrent !== expected) {
    const sourceExpected = expected.replace(/\n/g, sourceEol);
    const next = `${source.slice(0, startIndex)}${sourceExpected}${source.slice(endIndex + END.length)}`;
    fs.writeFileSync(runtimePath, next);
    console.log('Synchronized Course 1 public practical runtime data from the canonical practical object.');
  } else {
    console.log('Course 1 public practical runtime data is already synchronized.');
  }
  process.exit(0);
}

if (normalizedCurrent !== expected) {
  console.error('Course 1 public practical runtime data is stale. Run: npm run course1:practical-public:sync');
  process.exit(1);
}

console.log('Course 1 public practical runtime data matches the canonical published practical.');
