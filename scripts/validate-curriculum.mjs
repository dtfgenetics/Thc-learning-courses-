import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const showSummary = args.includes('--summary');
const showProfile = args.includes('--profile');

// ============================================================================
// FAST LOOKUP INDEX
// ============================================================================

const startIndexTime = performance.now();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: path.join(rel, name), data: readJson(path.join(rel, name)) }));
}

const collections = {
  competencies: readDirJson('content/competencies'),
  objectives: readDirJson('content/learning-objectives'),
  lessons: readDirJson('content/lessons'),
  claims: readDirJson('content/claims'),
  assessments: readDirJson('content/assessments'),
  questions: readDirJson('content/questions'),
  references: readDirJson('content/references'),
  modules: readDirJson('content/modules'),
  courses: readDirJson('content/courses'),
  programs: readDirJson('content/programs'),
  credentials: readDirJson('content/credentials'),
  reviews: readDirJson('content/reviews')
};

// Build comprehensive ID index and review index
const ids = new Map(); // id -> file path
const objects = new Map(); // id -> full object data
const reviewsByTargetId = new Map(); // targetId -> array of review records
const reviewsByType = new Map(); // 'assessment-item' -> Map of id -> reviews

for (const entries of Object.values(collections)) {
  for (const entry of entries) {
    const id = entry.data.id;
    if (!id) continue;
    ids.set(id, entry.file);
    objects.set(id, entry.data);
  }
}

// Index reviews by target ID and type
for (const { data } of collections.reviews) {
  const targetId = data.targetId;
  if (!reviewsByTargetId.has(targetId)) {
    reviewsByTargetId.set(targetId, []);
  }
  reviewsByTargetId.get(targetId).push(data);
}

const indexTime = performance.now() - startIndexTime;

// ============================================================================
// VALIDATION INFRASTRUCTURE
// ============================================================================

const errors = [];
const warnings = [];
const errorsByCategory = {
  'reference-integrity': [],
  'publication-gate': [],
  'review-requirement': [],
  'state-conflict': [],
  'completeness': [],
  'version-mismatch': [],
  'other': []
};

function addError(category, message) {
  errors.push(message);
  if (errorsByCategory[category]) {
    errorsByCategory[category].push(message);
  } else {
    errorsByCategory['other'].push(message);
  }
}

function requireId(sourceFile, id, label) {
  if (id && !ids.has(id)) {
    addError('reference-integrity', `${sourceFile}: missing ${label} reference ${id}`);
  }
}

function requireMany(sourceFile, values, label) {
  for (const id of values ?? []) requireId(sourceFile, id, label);
}

// ============================================================================
// VALIDATION CHECKS
// ============================================================================

// 1. OBJECTIVE-TO-COMPETENCY MAPPING
const startObjTime = performance.now();
for (const { file, data } of collections.objectives) {
  requireId(file, data.competency, 'competency');
}
const objTime = performance.now() - startObjTime;

// 2. LESSON VALIDATION
const startLessonTime = performance.now();
for (const { file, data } of collections.lessons) {
  requireMany(file, data.competencies, 'competency');
  requireMany(file, data.learningObjectives, 'learning objective');
  requireMany(file, data.references, 'reference');
  requireId(file, data.assessment, 'assessment');
  
  if (!(data.learningObjectives?.length > 0)) {
    addError('completeness', `${file}: lesson must map to at least one learning objective`);
  }
  if (!(data.competencies?.length > 0)) {
    addError('completeness', `${file}: lesson must map to at least one competency`);
  }
  
  if (data.content?.sections) {
    for (const section of data.content.sections) {
      requireMany(file, section.references, 'section reference');
    }
  }
  
  // Published lessons must be complete and have review records
  if (data.status === 'published') {
    if (!data.content) {
      addError('publication-gate', `${file}: published lesson must include structured instructional content`);
    }
    if ((data.content?.sections?.length ?? 0) < 2) {
      addError('completeness', `${file}: published lesson must include at least two instructional sections`);
    }
    if ((data.content?.vocabulary?.length ?? 0) < 1) {
      addError('completeness', `${file}: published lesson must include vocabulary`);
    }
    if ((data.content?.commonMistakes?.length ?? 0) < 1) {
      addError('completeness', `${file}: published lesson must include common mistakes`);
    }
    if (!data.content?.practicalApplication) {
      addError('completeness', `${file}: published lesson must include practical application`);
    }
    if (!data.content?.summary) {
      addError('completeness', `${file}: published lesson must include a summary`);
    }
    
    // Check for review records
    const lessonReviews = reviewsByTargetId.get(data.id) || [];
    const hasApprovedReview = lessonReviews.some((r) => r.status === 'approved' || r.status === 'passed');
    if (!hasApprovedReview) {
      addError('review-requirement', `${file}: published lesson ${data.id} must have an approval review record`);
    }
  }
}
const lessonTime = performance.now() - startLessonTime;

// 3. CLAIM VALIDATION
const startClaimTime = performance.now();
for (const { file, data } of collections.claims) {
  requireMany(file, data.references, 'reference');
  requireMany(file, data.supportsCompetencies, 'competency');
  requireMany(file, data.supportsLessons, 'lesson');
  
  if (data.status === 'published' && data.evidenceStatus !== 'reviewed') {
    addError('publication-gate', `${file}: published scientific claim must have reviewed evidence`);
  }
  if (data.evidenceStatus === 'needs-evidence') {
    warnings.push(`${file}: scientific claim still needs reviewed evidence`);
  }
}
const claimTime = performance.now() - startClaimTime;

// 4. QUESTION/ITEM VALIDATION WITH REVIEW ENFORCEMENT
const startQuestionTime = performance.now();
for (const { file, data } of collections.questions) {
  requireId(file, data.competency, 'competency');
  requireId(file, data.objective, 'learning objective');
  requireMany(file, data.references, 'reference');
  
  if (['multiple-choice', 'scenario', 'case-study'].includes(data.type)) {
    if (!Number.isInteger(data.correct)) {
      addError('state-conflict', `${file}: ${data.type} correct answer must be an integer choice index`);
    }
    if (Number.isInteger(data.correct) && (data.correct < 0 || data.correct >= (data.choices?.length ?? 0))) {
      addError('state-conflict', `${file}: correct answer index ${data.correct} is outside the choices array`);
    }
  }
  if (data.type === 'multiple-response' && !Array.isArray(data.correct)) {
    addError('state-conflict', `${file}: multiple-response correct answer must be an array of choice indexes`);
  }
  
  // CRITICAL: Active and published items MUST have approval review records
  if (data.status === 'active' || data.status === 'published') {
    const itemReviews = reviewsByTargetId.get(data.id) || [];
    const hasApprovedReview = itemReviews.some((r) => r.status === 'approved' || r.status === 'passed');
    const hasMinimumReviewRecords = itemReviews.length > 0;
    
    if (!hasMinimumReviewRecords) {
      addError('review-requirement', `${file}: ${data.status} assessment item ${data.id} has no review records (required before activation)`);
    } else if (!hasApprovedReview) {
      addError('review-requirement', `${file}: ${data.status} assessment item ${data.id} has review records but none are marked approved`);
    }
  }
}
const questionTime = performance.now() - startQuestionTime;

// 5. ASSESSMENT VALIDATION
const startAssessmentTime = performance.now();
for (const { file, data } of collections.assessments) {
  requireMany(file, data.competencies, 'competency');
  requireMany(file, data.objectives, 'learning objective');
  requireMany(file, data.items, 'item');
}
const assessmentTime = performance.now() - startAssessmentTime;

// 6. MODULE VALIDATION
const startModuleTime = performance.now();
for (const { file, data } of collections.modules) {
  requireMany(file, data.lessons, 'lesson');
  requireMany(file, data.competencies, 'competency');
  requireId(file, data.assessment, 'assessment');
}
const moduleTime = performance.now() - startModuleTime;

// 7. COURSE VALIDATION
const startCourseTime = performance.now();
for (const { file, data } of collections.courses) {
  requireMany(file, data.modules, 'module');
  requireMany(file, data.competencies, 'competency');
  requireId(file, data.finalAssessment, 'final assessment');
}
const courseTime = performance.now() - startCourseTime;

// 8. PROGRAM VALIDATION
const startProgramTime = performance.now();
for (const { file, data } of collections.programs) {
  requireMany(file, data.courses, 'course');
}
const programTime = performance.now() - startProgramTime;

// 9. CREDENTIAL VALIDATION
const startCredentialTime = performance.now();
for (const { file, data } of collections.credentials) {
  requireId(file, data.course, 'course');
  requireMany(file, data.eligibility?.requiredAssessments, 'required assessment');
}
const credentialTime = performance.now() - startCredentialTime;

// 10. REFERENCE VALIDATION
const startRefTime = performance.now();
for (const { file, data } of collections.references) {
  if (data.status === 'needs-authoritative-source') {
    warnings.push(`${file}: placeholder reference must be replaced before publication`);
  }
}
const refTime = performance.now() - startRefTime;

// 11. PUBLISHED DEPENDENCIES VALIDATION
const startDepsTime = performance.now();
function assertPublishedDependencies(sourceFile, data) {
  if (data.status !== 'published') return;
  
  for (const refId of data.references ?? []) {
    const ref = objects.get(refId);
    if (!ref) continue;
    if (ref.status === 'needs-authoritative-source' || ref.evidenceLevel === 'unverified') {
      addError('publication-gate', `${sourceFile}: published object depends on unverified reference ${refId}`);
    }
  }
  
  for (const itemId of data.items ?? []) {
    const item = objects.get(itemId);
    if (item && !['active', 'approved', 'published'].includes(item.status)) {
      addError('publication-gate', `${sourceFile}: published assessment uses non-approved item ${itemId}`);
    }
  }
}

for (const group of Object.values(collections)) {
  for (const { file, data } of group) {
    assertPublishedDependencies(file, data);
  }
}
const depsTime = performance.now() - startDepsTime;

// 12. CREDENTIALED COMPETENCY COVERAGE
const startCredCompTime = performance.now();
const credentialCompetencies = new Set();
for (const { data } of collections.credentials) {
  for (const assessmentId of data.eligibility?.requiredAssessments ?? []) {
    const assessment = objects.get(assessmentId);
    for (const competency of assessment?.competencies ?? []) {
      credentialCompetencies.add(competency);
    }
  }
}

for (const competency of credentialCompetencies) {
  const matchingItems = collections.questions.filter(({ data }) => data.competency === competency);
  if (matchingItems.length === 0) {
    addError('completeness', `credentialed competency ${competency}: no assessment items exist`);
  }
}
const credCompTime = performance.now() - startCredCompTime;

// 13. FINAL ASSESSMENT BLUEPRINT COVERAGE
const startBlueprintTime = performance.now();
const finalAssessment = objects.get('ASSESS-CULT-FOUNDATIONS-FINAL-001');
if (finalAssessment?.blueprint) {
  const minimumActive = finalAssessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0;
  const targetBank = finalAssessment.itemSelection?.targetBankItemsPerCompetency ?? 0;
  console.log('Assessment bank coverage:');
  for (const row of finalAssessment.blueprint) {
    const competency = row.competency;
    const allItems = collections.questions.filter(({ data }) => data.competency === competency);
    const summativeItems = allItems.filter(({ data }) => ['summative', 'credential'].includes(data.purpose));
    const activeItems = summativeItems.filter(({ data }) => data.status === 'active');
    console.log(`- ${competency}: ${summativeItems.length} summative/credential item(s), ${activeItems.length} active; minimum active ${minimumActive}, target bank ${targetBank}`);
    if (summativeItems.length === 0) {
      addError('completeness', `${competency}: final-assessment blueprint has no summative or credential items`);
    }
  }
}
const blueprintTime = performance.now() - startBlueprintTime;

// 14. REGISTRY VALIDATION
const startRegistryTime = performance.now();
const foundationsRegistryPath = path.join(root, 'registry/cultivation-foundations.json');
if (fs.existsSync(foundationsRegistryPath)) {
  const registry = readJson('registry/cultivation-foundations.json');
  for (const domain of registry.domains ?? []) {
    requireId('registry/cultivation-foundations.json', domain.module, 'module');
    requireId('registry/cultivation-foundations.json', domain.lesson, 'lesson');
    requireMany('registry/cultivation-foundations.json', domain.competencies, 'competency');
    requireMany('registry/cultivation-foundations.json', domain.objectives, 'learning objective');
  }
  
  const missingLessonMappings = (registry.domains ?? []).filter((domain) => !domain.module || !domain.lesson);
  if (registry.gates?.allDomainsHaveLessons === true && missingLessonMappings.length > 0) {
    addError('state-conflict', 'registry/cultivation-foundations.json: allDomainsHaveLessons is true but one or more domains lack module/lesson mappings');
  }

  if (registry.gates?.approvedItemPoolsComplete === true && finalAssessment?.blueprint) {
    const minimumActive = finalAssessment.itemSelection?.minimumActiveItemsPerCompetency ?? 0;
    for (const row of finalAssessment.blueprint) {
      const activeItems = collections.questions.filter(({ data }) =>
        data.competency === row.competency &&
        ['summative', 'credential'].includes(data.purpose) &&
        data.status === 'active'
      );
      if (activeItems.length < minimumActive) {
        addError('publication-gate', `registry/cultivation-foundations.json: approvedItemPoolsComplete is true but ${row.competency} has ${activeItems.length}/${minimumActive} active items`);
      }
    }
  }
}
const registryTime = performance.now() - startRegistryTime;

// ============================================================================
// OUTPUT
// ============================================================================

const totalTime = performance.now() - startIndexTime;

if (showProfile) {
  console.log('\n📊 VALIDATION PERFORMANCE PROFILE:');
  console.log(`Index build:        ${indexTime.toFixed(1)}ms`);
  console.log(`Objectives:         ${objTime.toFixed(1)}ms`);
  console.log(`Lessons:            ${lessonTime.toFixed(1)}ms`);
  console.log(`Claims:             ${claimTime.toFixed(1)}ms`);
  console.log(`Questions/Items:    ${questionTime.toFixed(1)}ms (review checks included)`);
  console.log(`Assessments:        ${assessmentTime.toFixed(1)}ms`);
  console.log(`Modules:            ${moduleTime.toFixed(1)}ms`);
  console.log(`Courses:            ${courseTime.toFixed(1)}ms`);
  console.log(`Programs:           ${programTime.toFixed(1)}ms`);
  console.log(`Credentials:        ${credentialTime.toFixed(1)}ms`);
  console.log(`References:         ${refTime.toFixed(1)}ms`);
  console.log(`Dependencies:       ${depsTime.toFixed(1)}ms`);
  console.log(`Cred. Competency:   ${credCompTime.toFixed(1)}ms`);
  console.log(`Blueprint:          ${blueprintTime.toFixed(1)}ms`);
  console.log(`Registry:           ${registryTime.toFixed(1)}ms`);
  console.log(`────────────────────────────────`);
  console.log(`TOTAL:              ${totalTime.toFixed(1)}ms`);
  console.log();
}

// Show warnings
for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

// Show errors with summary if requested
if (showSummary && errors.length > 0) {
  console.error('\n📋 VALIDATION ERROR SUMMARY:');
  for (const [category, msgs] of Object.entries(errorsByCategory)) {
    if (msgs.length > 0) {
      console.error(`  ${category}: ${msgs.length} error(s)`);
    }
  }
  console.error(`\nTotal: ${errors.length} error(s)\n`);
}

if (errors.length) {
  console.error('Curriculum validation failed:');
  
  // Show errors grouped by category
  for (const [category, msgs] of Object.entries(errorsByCategory)) {
    if (msgs.length > 0) {
      console.error(`\n${category.toUpperCase()} (${msgs.length}):`);
      for (const msg of msgs) {
        console.error(`  - ${msg}`);
      }
    }
  }
  
  process.exit(1);
}

console.log(`\n✅ Curriculum validation passed`);
console.log(`   ${ids.size} unique curriculum objects checked`);
console.log(`   ${collections.reviews.length} review records indexed`);
console.log(`   ${warnings.length} warning(s)`);
console.log(`   Completed in ${totalTime.toFixed(1)}ms\n`);
