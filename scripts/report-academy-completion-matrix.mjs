import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const specs = [
  ...Array.from({ length: 7 }, (_, i) => ({
    track: 'Technician I',
    courseNumber: i + 1,
    path: `registry/course${i + 1}-completion-status.json`
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    track: 'Technician II',
    courseNumber: i + 1,
    path: `registry/tech2-course${i + 1}-completion-status.json`
  }))
];

const rows = specs.map((spec) => {
  if (!fs.existsSync(path.join(root, spec.path))) throw new Error(`Missing completion ledger: ${spec.path}`);
  const ledger = read(spec.path);
  if (!ledger.courseId) throw new Error(`${spec.path} missing courseId`);
  if (ledger.goldStandardPackageComplete !== false && ledger.goldStandardPackageComplete !== true) {
    throw new Error(`${spec.path} missing boolean goldStandardPackageComplete`);
  }
  if (ledger.certificationEvidenceValidated !== false && ledger.certificationEvidenceValidated !== true) {
    throw new Error(`${spec.path} missing boolean certificationEvidenceValidated`);
  }
  if (!Array.isArray(ledger.nextMachineActions)) throw new Error(`${spec.path} missing nextMachineActions`);
  if (!Array.isArray(ledger.nextHumanActions)) throw new Error(`${spec.path} missing nextHumanActions`);

  const domains = Array.isArray(ledger.domains) ? ledger.domains : [];
  const humanDomainGates = domains.filter((domain) => domain?.humanGateRequired === true);
  const machineActions = ledger.nextMachineActions.filter(Boolean);
  const humanActions = ledger.nextHumanActions.filter(Boolean);
  const state = ledger.goldStandardPackageComplete && ledger.certificationEvidenceValidated
    ? 'complete'
    : machineActions.length > 0
      ? 'machine-work-open'
      : humanActions.length > 0 || humanDomainGates.length > 0
        ? 'human-gates-open'
        : 'review-ledger';

  return {
    track: spec.track,
    courseNumber: spec.courseNumber,
    courseId: ledger.courseId,
    updated: ledger.updated ?? ledger.updatedAt ?? null,
    academicPublication: ledger.academicPublication ?? ledger.publicAcademicRelease ?? null,
    goldStandardPackageComplete: ledger.goldStandardPackageComplete,
    certificationEvidenceValidated: ledger.certificationEvidenceValidated,
    state,
    machineActionCount: machineActions.length,
    humanActionCount: humanActions.length,
    explicitHumanDomainGateCount: humanDomainGates.length,
    nextMachineActions: machineActions,
    nextHumanActions: humanActions,
    ledger: spec.path
  };
});

const summary = {
  totalCourses: rows.length,
  goldStandardComplete: rows.filter((row) => row.goldStandardPackageComplete).length,
  certificationEvidenceValidated: rows.filter((row) => row.certificationEvidenceValidated).length,
  machineWorkOpen: rows.filter((row) => row.state === 'machine-work-open').length,
  humanGatesOpen: rows.filter((row) => row.state === 'human-gates-open').length,
  technicianI: rows.filter((row) => row.track === 'Technician I').length,
  technicianII: rows.filter((row) => row.track === 'Technician II').length
};

if (args.has('--check')) {
  if (rows.length !== 15) throw new Error(`Expected 15 course completion ledgers, found ${rows.length}`);
  console.log(`Academy completion matrix contract: PASS (${summary.technicianI} Technician I + ${summary.technicianII} Technician II courses)`);
  process.exit(0);
}

if (args.has('--human')) {
  console.log('THC Academy completion matrix');
  console.log(`Courses: ${summary.totalCourses} | Gold-standard complete: ${summary.goldStandardComplete} | Certification evidence validated: ${summary.certificationEvidenceValidated}`);
  console.log('Track | Course | State | Machine actions | Human actions | Academic publication');
  for (const row of rows) {
    console.log(`${row.track} | ${row.courseNumber} | ${row.state} | ${row.machineActionCount} | ${row.humanActionCount} | ${row.academicPublication ?? 'not-recorded'}`);
  }
  process.exit(0);
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), summary, courses: rows }, null, 2));
