import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const writeJson = (rel, value) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`);
};

const programId = 'CREDPROG-CULT-TECH-II-001';
const shared = {
  version: '0.1.0',
  status: 'draft',
  credentialBearing: true,
  level: 'Cultivation Technician II / advanced occupational pathway',
  intendedAudience: [
    'Learners who have completed or can demonstrate the Technician I prerequisite pathway',
    'Cultivation technicians developing supervised troubleshooting, verification, reconciliation, and peer-support capability'
  ],
  prerequisites: ['THC Cultivation Technician I pathway or approved equivalent prerequisite evidence'],
  deliveryModes: ['self-directed-web', 'instructor-facilitated', 'supervised-lab', 'workplace-equivalent'],
  evidencePolicy: 'Use canonical evidence-backed science and operational references for durable principles. Facility SOPs, labels, equipment manuals, validated sensor procedures, and jurisdiction-specific requirements control when more specific. Reused modules are development dependencies and do not substitute for course-specific occupational review.',
  assessmentPolicy: 'This draft course shell is not credential evidence merely because its structure exists. Dedicated instruction, formative work, course-level summative assessment where applicable, human technical review, accessibility review, and mapped performance evidence must be completed and validated before release.'
};

const courseDefs = [
  {
    id: 'COURSE-LH-TECH2-001', title: 'Advanced Crop Observation & Diagnostic Reasoning',
    description: 'Develops structured multi-factor crop observation, evidence collection, differential reasoning, uncertainty communication, and escalation for abnormal crop conditions within Technician II authority.',
    modules: ['MOD-NUTRIENT-DIAG-001', 'MOD-IPM-ADV-001', 'MOD-FLOWER-ADV-001'],
    competencies: ['COMP-NUTRIENT-DIAG-001', 'COMP-IPM-ADV-001', 'COMP-FLOWER-ADV-001'],
    outcomes: ['Separate observations from interpretations and unsupported conclusions.', 'Build evidence-based differentials across nutrition, environment, irrigation, pest, disease, and developmental causes.', 'Document confidence, missing evidence, and escalation boundaries before corrective action.']
  },
  {
    id: 'COURSE-LH-TECH2-002', title: 'Environmental Data, Sensors & Equipment Response',
    description: 'Builds advanced interpretation of environmental and lighting data, sensor validity, spatial patterns, alarms, and safe equipment-response boundaries.',
    modules: ['MOD-ENV-ADV-001', 'MOD-LIGHT-ADV-001'],
    competencies: ['COMP-ENV-ADV-001', 'COMP-LIGHT-ADV-001'],
    outcomes: ['Evaluate whether environmental data are representative and fit for a decision.', 'Interpret spatial and time-series environmental and lighting patterns in crop context.', 'Differentiate operator-level verification from repairs or adjustments requiring authorized technical staff.']
  },
  {
    id: 'COURSE-LH-TECH2-003', title: 'Fertigation Execution, Verification & Root-Zone Interpretation',
    description: 'Develops verification of water and fertigation inputs, irrigation execution, root-zone response, and evidence-based troubleshooting without exceeding authorization.',
    modules: ['MOD-WATER-QUALITY-ADV-001', 'MOD-IRRIGATION-ADV-001', 'MOD-NUTRIENT-DIAG-001'],
    competencies: ['COMP-WATER-QUALITY-ADV-001', 'COMP-IRRIGATION-ADV-001', 'COMP-NUTRIENT-DIAG-001'],
    outcomes: ['Verify source water, batch, meter, and irrigation information before interpreting crop response.', 'Interpret irrigation and root-zone evidence as a connected system rather than isolated readings.', 'Escalate chemistry, equipment, or crop-risk conditions that exceed Technician II authority.']
  },
  {
    id: 'COURSE-LH-TECH2-004', title: 'Plant Health, IPM & Biosecurity Troubleshooting',
    description: 'Develops advanced scouting, trend interpretation, containment reasoning, treatment follow-up, and biosecurity escalation within approved IPM programs.',
    modules: ['MOD-IPM-ADV-001', 'MOD-SPACE-BIOSEC-001'],
    competencies: ['COMP-IPM-ADV-001', 'COMP-SPACE-BIOSEC-001'],
    outcomes: ['Evaluate plant-health observations using distribution, severity, timing, and trend evidence.', 'Verify whether authorized IPM actions produced the intended response without inventing treatment authority.', 'Protect containment, sanitation, and movement boundaries while escalating uncertain or high-risk findings.']
  },
  {
    id: 'COURSE-LH-TECH2-005', title: 'Production Records, Traceability & Inventory Reconciliation',
    description: 'Develops reconstructable records, discrepancy investigation, traceability reconciliation, controlled-document use, and defensible handoff of unresolved data-quality conditions.',
    modules: ['MOD-PRO-SOP-001', 'MOD-PRO-QA-001', 'MOD-CROP-PLAN-001'],
    competencies: ['COMP-PRO-SOP-001', 'COMP-PRO-QA-001', 'COMP-CROP-PLAN-001'],
    outcomes: ['Reconcile physical observations and controlled records without forcing false agreement.', 'Identify data-integrity, identity, count, movement, and document-control discrepancies requiring escalation.', 'Produce a reconstructable investigation and shift handoff for unresolved traceability conditions.']
  },
  {
    id: 'COURSE-LH-TECH2-006', title: 'Harvest/Postharvest Deviations & Quality Response',
    description: 'Develops postharvest process verification, deviation scoping, lot-identity protection, quality-risk recognition, and escalation without conferring product-disposition authority.',
    modules: ['MOD-FLOWER-ADV-001', 'MOD-POSTHARVEST-PROCESS-001', 'MOD-POSTHARVEST-QA-001'],
    competencies: ['COMP-FLOWER-ADV-001', 'COMP-POSTHARVEST-PROCESS-001', 'COMP-POSTHARVEST-QA-001'],
    outcomes: ['Interpret harvest and postharvest process evidence in lot and timeline context.', 'Scope deviations while protecting lot identity, holds, and traceability.', 'Escalate quality and disposition decisions outside assigned authority.']
  },
  {
    id: 'COURSE-LH-TECH2-007', title: 'Production Metrics, Shift Coordination & Peer Support',
    description: 'Develops production-metric interpretation, task coordination, peer verification, deviation communication, and shift-level prioritization within a senior technician role.',
    modules: ['MOD-CROP-PLAN-001', 'MOD-PRO-QA-001', 'MOD-PRO-SOP-001'],
    competencies: ['COMP-CROP-PLAN-001', 'COMP-PRO-QA-001', 'COMP-PRO-SOP-001'],
    outcomes: ['Calculate and interpret routine production metrics without overstating what the data prove.', 'Prioritize and communicate work using risk, crop stage, dependencies, and unresolved deviations.', 'Support peer execution while preserving role, approval, and escalation boundaries.']
  },
  {
    id: 'COURSE-LH-TECH2-008', title: 'Integrated Technician II Simulation Lab',
    description: 'Integrates Technician II diagnostic reasoning, sensor/equipment verification, fertigation/root-zone troubleshooting, IPM follow-up, production reconciliation, postharvest deviation response, and shift coordination through supervised performance evidence.',
    modules: ['MOD-ENV-ADV-001', 'MOD-IRRIGATION-ADV-001', 'MOD-IPM-ADV-001', 'MOD-POSTHARVEST-QA-001', 'MOD-PRO-QA-001'],
    competencies: ['COMP-ENV-ADV-001', 'COMP-IRRIGATION-ADV-001', 'COMP-IPM-ADV-001', 'COMP-POSTHARVEST-QA-001', 'COMP-PRO-QA-001', 'COMP-CROP-PLAN-001'],
    outcomes: ['Integrate evidence across crop, environment, root zone, plant health, postharvest, and records.', 'Choose safe next actions while identifying actions that require escalation or additional evidence.', 'Produce defensible performance artifacts and a senior-technician shift summary without unresolved critical errors.'],
    lab: true
  }
];

for (const def of courseDefs) {
  writeJson(`content/courses/${def.id}.json`, {
    id: def.id,
    title: def.title,
    ...shared,
    description: def.description,
    modules: def.modules,
    competencies: def.competencies,
    finalAssessment: null,
    learningOutcomes: def.outcomes,
    extensions: {
      credentialPath: programId,
      maturity: 'course-shell-draft',
      developmentDependencies: def.modules,
      contentCeiling: null,
      dedicatedCourseAssessmentRequired: !def.lab,
      dedicatedLabModuleRequired: Boolean(def.lab),
      integratedPerformanceValidationRequired: Boolean(def.lab),
      humanTechnicalReviewRequired: true,
      accessibilityReviewRequired: true,
      legacySourceCourse: 'COURSE-CULT-TECH-II-001',
      publicCredentialItemsAreDevelopmentOnly: true,
      operationalCredentialBankMustBePrivate: true,
      ...(def.lab ? {
        mappedPerformanceAssessments: [
          'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP',
          'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION',
          'PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING',
          'PRACTICAL-TECH2-D-IPM-TREND-TREATMENT-FOLLOWUP',
          'PRACTICAL-TECH2-E-PROPAGATION-CANOPY-PERFORMANCE-REVIEW',
          'PRACTICAL-TECH2-F-POSTHARVEST-DEVIATION-LOT-SCOPE',
          'PRACTICAL-TECH2-G-TRACEABILITY-METRICS-SHIFT-COORDINATION',
          'CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT'
        ]
      } : {})
    }
  });
}

const competencies = [...new Set(courseDefs.flatMap((c) => c.competencies))];
writeJson(`content/credential-programs/${programId}.json`, {
  id: programId,
  title: 'THC Cultivation Technician II',
  version: '0.1.0',
  status: 'draft',
  credentialType: 'professional-credential',
  occupationalClaim: 'The credential holder can verify routine cultivation systems, interpret crop, environmental, root-zone and production information, troubleshoot common deviations within scope, reconcile records, support peer execution, and escalate conditions that exceed assigned authority or competence.',
  targetRoles: ['Senior Cultivation Technician', 'Cultivation Technician II', 'Advanced Grow Technician'],
  proficiencyTarget: ['operational', 'diagnostic'],
  prerequisiteCredentials: ['CREDPROG-CULT-TECH-I-001'],
  requiredCourses: courseDefs.map((c) => c.id),
  competencies,
  resourceMappings: ['RES-THC-C001'],
  assessmentModel: {
    courseTests: true,
    credentialAssessment: 'ASSESS-CULT-TECH-II-CREDENTIAL-001',
    performanceEvidence: [
      'PRACTICAL-TECH2-A-CROP-DIAGNOSTIC-WORKUP',
      'PRACTICAL-TECH2-B-SENSOR-EQUIPMENT-VERIFICATION',
      'PRACTICAL-TECH2-C-FERTIGATION-ROOTZONE-TROUBLESHOOTING',
      'PRACTICAL-TECH2-D-IPM-TREND-TREATMENT-FOLLOWUP',
      'PRACTICAL-TECH2-E-PROPAGATION-CANOPY-PERFORMANCE-REVIEW',
      'PRACTICAL-TECH2-F-POSTHARVEST-DEVIATION-LOT-SCOPE',
      'PRACTICAL-TECH2-G-TRACEABILITY-METRICS-SHIFT-COORDINATION'
    ],
    capstone: 'CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT',
    passingRule: 'Development rule only: complete the eight-course pathway, satisfy the provisional written/scenario blueprint, pass all required practical evidence and the integrated capstone without unresolved critical errors, and satisfy portfolio evidence requirements. Final cut scores and operational credential forms require validation and formal standard setting before release.',
    standardSettingStatus: 'not-started',
    noCriticalErrorsRequired: true
  },
  validation: {
    jobTaskAnalysis: 'draft',
    smeEmployerValidation: 'not-started',
    assessmentReview: 'draft',
    accessibilityReview: 'not-started'
  },
  maintenance: { renewalRequired: false, renewalPeriodMonths: null, continuingEducationRequired: false },
  limitations: [
    'Does not confer government licensure or independent pesticide, electrical, refrigerant, engineering, product-disposition, supervisory, or management authority.',
    'Public Technician II credential-purpose items in this repository are development blueprints and are not an operational secure credential bank.',
    'Facility-specific procedures, equipment authorizations, seed-to-sale systems, and jurisdiction-specific requirements require implementation training and employer authorization.'
  ]
});

const test = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));\nconst program = read('content/credential-programs/CREDPROG-CULT-TECH-II-001.json');\nconst expected = ${JSON.stringify(courseDefs.map(c => c.id))};\nassert.deepEqual(program.requiredCourses, expected);\nassert.equal(program.status, 'draft');\nassert.equal(program.prerequisiteCredentials.includes('CREDPROG-CULT-TECH-I-001'), true);\nassert.equal(program.assessmentModel.credentialAssessment, 'ASSESS-CULT-TECH-II-CREDENTIAL-001');\nassert.equal(program.assessmentModel.performanceEvidence.length, 7);\nassert.equal(program.assessmentModel.capstone, 'CAPSTONE-TECH2-SENIOR-TECHNICIAN-DIAGNOSTIC-SHIFT');\nfor (const id of expected) {\n  const course = read('content/courses/' + id + '.json');\n  assert.equal(course.status, 'draft', id + ' must remain draft');\n  assert.equal(course.credentialBearing, true);\n  assert.equal(course.finalAssessment, null);\n  assert.equal(course.extensions.credentialPath, program.id);\n  assert.equal(course.extensions.legacySourceCourse, 'COURSE-CULT-TECH-II-001');\n  assert.ok(course.modules.length > 0 && course.competencies.length > 0);\n}\nfor (const id of program.assessmentModel.performanceEvidence) assert.ok(fs.existsSync(path.join('content/performance-assessments', id + '.json')), 'missing ' + id);\nassert.ok(fs.existsSync(path.join('content/performance-assessments', program.assessmentModel.capstone + '.json')), 'missing capstone');\nassert.ok(fs.existsSync('content/courses/COURSE-CULT-TECH-II-001.json'), 'legacy Technician II source course must be preserved');\nconst legacy = read('content/courses/COURSE-CULT-TECH-II-001.json');\nassert.equal(legacy.finalAssessment, 'ASSESS-CULT-TECH-II-CREDENTIAL-001');\nconst exam = read('content/assessments/ASSESS-CULT-TECH-II-CREDENTIAL-001.json');\nassert.equal(exam.status, 'draft');\nassert.equal(exam.purpose, 'credential');\nassert.equal(exam.items.length, 0, 'public credential definition must not contain an operational selected form');\nconsole.log('Technician II eight-course program shell and legacy-preservation contract passed.');\n`;
fs.writeFileSync(path.join(root, 'scripts/test-tech2-program-structure.mjs'), test);

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts['tech2:program:test'] = 'node scripts/test-tech2-program-structure.mjs';
if (!pkg.scripts.test.includes('npm run tech2:program:test')) {
  pkg.scripts.test = pkg.scripts.test.replace('npm run credential:tech2:test', 'npm run tech2:program:test && npm run credential:tech2:test');
}
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

fs.mkdirSync(path.join(root, 'docs/academy-v2'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/academy-v2/TECH2_PROGRAM_SHELL_STATUS.md'), `# Technician II Program Shell Status\n\nEight Learning Hub course shells now map the planned Technician II sequence without deleting the existing monolithic Technician II course, development item bank, practicals, capstone, or runtime contracts.\n\nThe new course shells and professional credential-program object remain **draft**. They are structural curriculum containers, not release claims. Dedicated instruction, course assessments, review, accessibility evidence, pilot evidence, performance validation, secure operational credential forms, standard setting, and final release approval remain required.\n\nPublic \`ITEM-TECH2-*\` material remains development-only and must not be promoted as an operational secure credential bank.\n`);

console.log('Built Technician II eight-course program shell.');
