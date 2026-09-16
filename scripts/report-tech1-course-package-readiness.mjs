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
    test: ({ docsDir }) =>
      exists(`${docsDir}/LEARNER-MATERIALS.md`) ||
      exists(`${docsDir}/student/STUDENT-WORKBOOK.md`) ||
      exists(`${docsDir}/STUDENT-WORKBOOK.md`)
  },
  {
    key: 'objectiveAlignment',
    label: 'objective/practice/assessment/remediation evidence',
    test: ({ docsDir, courseNumber }) =>
      exists(`${docsDir}/OBJECTIVE-COVERAGE.md`) ||
      exists(`${docsDir}/COURSE${courseNumber}-LESSON-PRACTICE-MAP.json`) ||
      exists(`${docsDir}/COURSE-LESSON-PRACTICE-MAP.json`)
  },
  {
    key: 'evidenceDossier',
    label: 'course evidence/source dossier',
    test: ({ docsDir }) =>
      exists(`${docsDir}/EVIDENCE-DOSSIER.md`) ||
      exists(`${docsDir}/SOURCE-REGISTER.md`) ||
      exists(`${docsDir}/SOURCE-AUDIT.md`)
  },
  {
    key: 'visualPlan',
    label: 'controlled visual/asset plan',
    test: ({ docsDir, courseNumber }) =>
      exists(`visuals/COURSE${courseNumber}-ASSET-REGISTRY.json`) ||
      exists(`${docsDir}/assets/visuals/COURSE${courseNumber}-VISUAL-REFERENCE-MANIFEST.md`) ||
      exists(`${docsDir}/assets/visuals/VISUAL-REFERENCE-MANIFEST.md`)
  },
  {
    key: 'instructorAssessorSupport',
    label: 'instructor/assessor support',
    test: ({ docsDir }) =>
      exists(`${docsDir}/instructor/INSTRUCTOR-GUIDE.md`) ||
      exists(`${docsDir}/INSTRUCTOR-GUIDE.md`) ||
      exists(`${docsDir}/practical/ASSESSOR-GUIDE.md`)
  },
  {
    key: 'accessibilityUxPacket',
    label: 'rendered accessibility/manual UX packet',
    test: ({ docsDir, courseNumber }) =>
      exists(`${docsDir}/accessibility/COURSE${courseNumber}-RENDERED-ACCESSIBILITY-UX-REVIEW.md`) ||
      exists(`${docsDir}/accessibility/RENDERED-ACCESSIBILITY-UX-REVIEW.md`)
  },
  {
    key: 'humanReviewQueue',
    label: 'human review worklist/queue',
    test: ({ docsDir }) =>
      exists(`${docsDir}/FINAL-HUMAN-REVIEW-WORKLIST.md`) ||
      exists(`${docsDir}/REVIEW-PACKET.md`)
  },
  {
    key: 'deploymentEvidence',
    label: 'public deployment/release evidence',
    test: ({ docsDir }) =>
      exists(`${docsDir}/RELEASE-EVIDENCE.md`) ||
      exists(`${docsDir}/PUBLIC-DEPLOYMENT-EVIDENCE.md`) ||
      exists(`${docsDir}/FINAL-RELEASE-REPORT.md`)
  }
];

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
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  rows.push({
    courseId,
    title: course.title ?? null,
    lifecycle: course.status ?? 'missing',
    profile,
    checks,
    machinePackageSignals: `${passed}/${total}`,
    missing: categorySpecs.filter((spec) => !checks[spec.key]).map((spec) => spec.label),
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
    machinePackageSignalComplete: rows.filter((row) => row.missing.length === 0).length,
    humanValidationOpen: true,
    professionalCredentialIssuanceReady: false
  }
};

if (args.has('--human')) {
  console.log('Technician I course-package readiness');
  console.log('Course | State | Machine signals | Missing');
  for (const row of rows) {
    console.log(`${row.courseId} | ${row.lifecycle} | ${row.machinePackageSignals} | ${row.missing.length ? row.missing.join('; ') : 'none'}`);
  }
  console.log(`Machine package signals complete: ${result.summary.machinePackageSignalComplete}/${result.summary.courses}`);
  console.log('Human validation remains open. This report does not grant academic approval or professional credential issuance.');
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (args.has('--require-machine-package') && rows.some((row) => row.missing.length > 0)) process.exit(2);
