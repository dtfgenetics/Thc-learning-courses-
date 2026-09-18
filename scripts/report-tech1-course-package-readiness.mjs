import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const exists = (rel) => fs.existsSync(path.join(root, rel));
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const listDir = (rel) => exists(rel) ? fs.readdirSync(path.join(root, rel)) : [];

const programId = 'CREDPROG-CULT-TECH-I-001';
const program = readJson(`content/credential-programs/${programId}.json`);

const categorySpecs = [
  {
    key: 'courseDefinition',
    label: 'controlled course definition',
    stage: 'source-package',
    test: ({ coursePath, course }) =>
      exists(coursePath) &&
      Boolean(course.id && course.version && course.status && course.title && course.description) &&
      Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0 &&
      course.extensions?.credentialPath === programId &&
      course.extensions?.contentCeiling === null
  },
  {
    key: 'instructionalGraph',
    label: 'course-specific instructional graph',
    stage: 'source-package',
    test: ({ courseId }) => {
      const key = courseId.replace(/^COURSE-/, '');
      const modules = listDir('content/modules').filter((name) => name.startsWith(`MOD-${key}-`) && name.endsWith('.json'));
      const lessons = listDir('content/lessons').filter((name) => name.startsWith(`LESSON-${key}-`) && name.endsWith('.json'));
      const objectives = listDir('content/learning-objectives').filter((name) => name.startsWith(`LO-${key}-`) && name.endsWith('.json'));
      return modules.length >= 1 && lessons.length >= 4 && objectives.length >= 4;
    }
  },
  {
    key: 'academicAssessment',
    label: 'academic assessment source',
    stage: 'source-package',
    test: ({ courseId, course, profile }) => {
      const key = courseId.replace(/^COURSE-/, '');
      const formative = exists(`content/assessments/ASSESS-${key}-M01.json`);
      if (profile === 'integrated-practice-lab') return formative && course.finalAssessment === null;
      return formative && course.finalAssessment === `ASSESS-${key}-FINAL` &&
        exists(`content/assessments/${course.finalAssessment}.json`);
    }
  },
  {
    key: 'learnerApplication',
    label: 'learner application package',
    stage: 'source-package',
    test: ({ docsDir, profile }) => profile === 'integrated-practice-lab'
      ? exists(`${docsDir}/INTEGRATED-LAB-LEARNER-PACKET.md`)
      : exists(`${docsDir}/LEARNER-MATERIALS.md`) ||
        exists(`${docsDir}/student/STUDENT-WORKBOOK.md`) ||
        exists(`${docsDir}/STUDENT-WORKBOOK.md`)
  },
  {
    key: 'objectiveAlignment',
    label: 'objective/practice/assessment/remediation evidence',
    stage: 'source-package',
    test: ({ docsDir, courseNumber, profile }) => profile === 'integrated-practice-lab'
      ? exists(`${docsDir}/OBJECTIVE-PERFORMANCE-CROSSWALK.md`) && exists(`${docsDir}/REMEDIATION-RETEST-MATRIX.md`)
      : exists(`${docsDir}/OBJECTIVE-COVERAGE.md`) ||
        exists(`${docsDir}/COURSE${courseNumber}-LESSON-PRACTICE-MAP.json`) ||
        exists(`${docsDir}/COURSE-LESSON-PRACTICE-MAP.json`)
  },
  {
    key: 'evidenceDossier',
    label: 'course evidence/source dossier',
    stage: 'source-package',
    test: ({ docsDir, profile }) => profile === 'integrated-practice-lab'
      ? exists(`${docsDir}/INTEGRATED-EVIDENCE-DOSSIER.md`)
      : exists(`${docsDir}/EVIDENCE-DOSSIER.md`) ||
        exists(`${docsDir}/SOURCE-REGISTER.md`) ||
        exists(`${docsDir}/SOURCE-AUDIT.md`)
  },
  {
    key: 'visualPlan',
    label: 'controlled visual/asset plan',
    stage: 'source-package',
    test: ({ docsDir, courseNumber }) =>
      exists(`visuals/COURSE${courseNumber}-ASSET-REGISTRY.json`) ||
      exists(`${docsDir}/assets/visuals/COURSE${courseNumber}-VISUAL-REFERENCE-MANIFEST.md`) ||
      exists(`${docsDir}/assets/visuals/VISUAL-REFERENCE-MANIFEST.md`)
  },
  {
    key: 'instructorAssessorSupport',
    label: 'instructor/assessor support',
    stage: 'source-package',
    test: ({ docsDir, profile }) => profile === 'integrated-practice-lab'
      ? exists(`${docsDir}/assessor/CAPSTONE-ASSESSOR-GUIDE.md`) && exists(`${docsDir}/assessor/CAPSTONE-CALIBRATION-VALIDATION-PACKET.md`)
      : exists(`${docsDir}/instructor/INSTRUCTOR-GUIDE.md`) ||
        exists(`${docsDir}/INSTRUCTOR-GUIDE.md`) ||
        exists(`${docsDir}/practical/ASSESSOR-GUIDE.md`)
  },
  {
    key: 'accessibilityUxPacket',
    label: 'rendered accessibility/manual UX packet',
    stage: 'source-package',
    test: ({ docsDir, courseNumber, profile }) => profile === 'integrated-practice-lab'
      ? exists(`${docsDir}/accessibility/COURSE7-INTEGRATED-LAB-ACCESSIBILITY-UX-REVIEW.md`)
      : exists(`${docsDir}/accessibility/COURSE${courseNumber}-RENDERED-ACCESSIBILITY-UX-REVIEW.md`) ||
        exists(`${docsDir}/accessibility/RENDERED-ACCESSIBILITY-UX-REVIEW.md`)
  },
  {
    key: 'humanReviewQueue',
    label: 'human review worklist/queue',
    stage: 'source-package',
    test: ({ docsDir }) =>
      exists(`${docsDir}/FINAL-HUMAN-REVIEW-WORKLIST.md`) ||
      exists(`${docsDir}/REVIEW-PACKET.md`)
  },
  {
    key: 'deploymentEvidence',
    label: 'public deployment/release evidence',
    stage: 'deployment',
    test: ({ docsDir }) =>
      exists(`${docsDir}/RELEASE-EVIDENCE.md`) ||
      exists(`${docsDir}/PUBLIC-DEPLOYMENT-EVIDENCE.md`) ||
      exists(`${docsDir}/FINAL-RELEASE-REPORT.md`)
  }
];

const sourceSpecs = categorySpecs.filter((spec) => spec.stage === 'source-package');
const deploymentSpecs = categorySpecs.filter((spec) => spec.stage === 'deployment');
const rows = [];
for (const [index, courseId] of (program.requiredCourses ?? []).entries()) {
  const courseNumber = String(index + 1);
  const slug = `course-${String(index + 1).padStart(3, '0')}`;
  const coursePath = `content/courses/${courseId}.json`;
  const docsDir = `docs/learning-hub/tech1/${slug}`;
  const course = exists(coursePath) ? readJson(coursePath) : {};
  const profile = courseId.endsWith('-007') ? 'integrated-practice-lab' : 'ordinary-course';
  const context = { courseId, courseNumber, coursePath, docsDir, course, profile };
  const checks = Object.fromEntries(categorySpecs.map((spec) => [spec.key, Boolean(spec.test(context))]));
  const sourceMissing = sourceSpecs.filter((spec) => !checks[spec.key]).map((spec) => spec.label);
  const deploymentMissing = deploymentSpecs.filter((spec) => !checks[spec.key]).map((spec) => spec.label);
  const sourcePassed = sourceSpecs.length - sourceMissing.length;
  const deploymentPassed = deploymentSpecs.length - deploymentMissing.length;
  rows.push({
    courseId,
    title: course.title ?? null,
    lifecycle: course.status ?? 'missing',
    profile,
    checks,
    sourcePackageSignals: `${sourcePassed}/${sourceSpecs.length}`,
    deploymentSignals: `${deploymentPassed}/${deploymentSpecs.length}`,
    sourcePackageMissing: sourceMissing,
    deploymentMissing,
    missing: [...sourceMissing, ...deploymentMissing],
    humanValidationOpen: true
  });
}

const result = {
  credentialProgram: programId,
  contract: 'docs/LEARNING-HUB-COURSE-PACKAGE-CONTRACT.md',
  generatedAt: new Date().toISOString(),
  rows,
  summary: {
    courses: rows.length,
    sourceObjectsPresent: rows.filter((row) => row.lifecycle !== 'missing').length,
    sourcePackageComplete: rows.filter((row) => row.sourcePackageMissing.length === 0).length,
    deploymentVerified: rows.filter((row) => row.deploymentMissing.length === 0).length,
    fullMachinePackageComplete: rows.filter((row) => row.missing.length === 0).length,
    humanValidationOpen: true,
    professionalCredentialIssuanceReady: false
  }
};

if (args.has('--human')) {
  console.log('Technician I course-package readiness');
  console.log('Course | State | Source package | Deployment | Missing');
  for (const row of rows) {
    console.log(`${row.courseId} | ${row.lifecycle} | ${row.sourcePackageSignals} | ${row.deploymentSignals} | ${row.missing.length ? row.missing.join('; ') : 'none'}`);
  }
  console.log(`Source packages complete: ${result.summary.sourcePackageComplete}/${result.summary.courses}`);
  console.log(`Deployment evidence verified: ${result.summary.deploymentVerified}/${result.summary.courses}`);
  console.log(`Full machine packages complete: ${result.summary.fullMachinePackageComplete}/${result.summary.courses}`);
  console.log('Human validation remains open. This report does not grant academic approval or professional credential issuance.');
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (args.has('--require-source-package') && rows.some((row) => row.sourcePackageMissing.length > 0)) process.exit(2);
if (args.has('--require-deployment') && rows.some((row) => row.deploymentMissing.length > 0)) process.exit(3);
if (args.has('--require-machine-package') && rows.some((row) => row.missing.length > 0)) process.exit(4);
