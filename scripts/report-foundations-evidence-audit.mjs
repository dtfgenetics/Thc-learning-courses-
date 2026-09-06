import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readDirJson(rel) {
  const dir = path.join(root, rel);
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(rel, name)));
}

const registry = readJson('registry/cultivation-foundations.json');
const modules = new Map(readDirJson('content/modules').map((value) => [value.id, value]));
const lessons = new Map(readDirJson('content/lessons').map((value) => [value.id, value]));
const references = new Map(readDirJson('content/references').map((value) => [value.id, value]));

const reviewedStatuses = new Set(['reviewed', 'reviewed-source']);
const weakEvidence = new Set(['unverified', 'experiential']);

function hasLocator(reference) {
  return Boolean(reference?.doi || reference?.pmid || reference?.pmcid || reference?.url);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

const domainReports = [];
const structuralErrors = [];

for (const domain of registry.domains ?? []) {
  const module = modules.get(domain.module);
  if (!module) {
    structuralErrors.push(`${domain.id}: missing module ${domain.module}`);
    continue;
  }

  const lessonIds = unique(module.lessons ?? [domain.lesson]);
  const lessonReports = [];

  for (const lessonId of lessonIds) {
    const lesson = lessons.get(lessonId);
    if (!lesson) {
      structuralErrors.push(`${domain.id}: missing lesson ${lessonId}`);
      continue;
    }

    const lessonRefs = unique(lesson.references ?? []);
    const sections = lesson.content?.sections ?? [];
    const sectionRefs = unique(sections.flatMap((section) => section.references ?? []));
    const allRefs = unique([...lessonRefs, ...sectionRefs]);
    const uncitedSections = sections
      .map((section, index) => ({ index: index + 1, title: section.title ?? `section-${index + 1}`, references: section.references ?? [] }))
      .filter((section) => section.references.length === 0)
      .map(({ index, title }) => ({ index, title }));

    const missingReferences = allRefs.filter((id) => !references.has(id));
    for (const refId of missingReferences) structuralErrors.push(`${lesson.id}: unresolved reference ${refId}`);

    const resolved = allRefs.map((id) => references.get(id)).filter(Boolean);
    const unreviewedReferences = resolved
      .filter((reference) => !reviewedStatuses.has(reference.status))
      .map((reference) => ({ id: reference.id, status: reference.status }));
    const weakEvidenceReferences = resolved
      .filter((reference) => weakEvidence.has(reference.evidenceLevel))
      .map((reference) => ({ id: reference.id, evidenceLevel: reference.evidenceLevel }));
    const missingLocatorReferences = resolved
      .filter((reference) => !hasLocator(reference))
      .map((reference) => reference.id);
    const supersededOrRetracted = resolved
      .filter((reference) => ['superseded', 'retracted'].includes(reference.status))
      .map((reference) => ({ id: reference.id, status: reference.status }));

    if (allRefs.length === 0) structuralErrors.push(`${lesson.id}: lesson has no references`);

    const evidenceMetadataAttentionRequired =
      uncitedSections.length > 0 ||
      missingReferences.length > 0 ||
      unreviewedReferences.length > 0 ||
      weakEvidenceReferences.length > 0 ||
      missingLocatorReferences.length > 0 ||
      supersededOrRetracted.length > 0;

    lessonReports.push({
      lessonId: lesson.id,
      lessonVersion: String(lesson.version),
      title: lesson.title,
      referenceCount: allRefs.length,
      references: allRefs,
      sectionCount: sections.length,
      uncitedSections,
      missingReferences,
      unreviewedReferences,
      weakEvidenceReferences,
      missingLocatorReferences,
      supersededOrRetracted,
      evidenceMetadataAttentionRequired,
      humanScientificReviewRequired: true
    });
  }

  domainReports.push({
    domainId: domain.id,
    moduleId: domain.module,
    lessons: lessonReports,
    evidenceMetadataAttentionRequired: lessonReports.some((lesson) => lesson.evidenceMetadataAttentionRequired),
    humanScientificReviewRequired: true
  });
}

const lessonReports = domainReports.flatMap((domain) => domain.lessons);
const reviewedReferenceGateDerived =
  domainReports.length === (registry.domains ?? []).length &&
  domainReports.length > 0 &&
  lessonReports.length > 0 &&
  domainReports.every((domain) => domain.lessons.length > 0 && !domain.evidenceMetadataAttentionRequired);
const reviewedReferenceGateDeclared = registry.gates?.allDomainsHaveReviewedReferences === true;

if (reviewedReferenceGateDeclared !== reviewedReferenceGateDerived) {
  structuralErrors.push(
    `registry/cultivation-foundations.json: allDomainsHaveReviewedReferences=${reviewedReferenceGateDeclared} does not match derived evidence state ${reviewedReferenceGateDerived}`
  );
}

const summary = {
  curriculum: registry.course,
  curriculumVersion: String(registry.version),
  domainCount: domainReports.length,
  lessonCount: lessonReports.length,
  lessonsNeedingEvidenceMetadataAttention: lessonReports.filter((lesson) => lesson.evidenceMetadataAttentionRequired).length,
  lessonsRequiringHumanScientificReview: lessonReports.length,
  totalReferences: unique(lessonReports.flatMap((lesson) => lesson.references)).length,
  uncitedSectionCount: lessonReports.reduce((sum, lesson) => sum + lesson.uncitedSections.length, 0),
  missingReferenceCount: lessonReports.reduce((sum, lesson) => sum + lesson.missingReferences.length, 0),
  unreviewedReferenceCount: lessonReports.reduce((sum, lesson) => sum + lesson.unreviewedReferences.length, 0),
  weakEvidenceReferenceCount: lessonReports.reduce((sum, lesson) => sum + lesson.weakEvidenceReferences.length, 0),
  missingLocatorReferenceCount: lessonReports.reduce((sum, lesson) => sum + lesson.missingLocatorReferences.length, 0),
  supersededOrRetractedReferenceCount: lessonReports.reduce((sum, lesson) => sum + lesson.supersededOrRetracted.length, 0),
  allDomainsHaveReviewedReferencesDeclared: reviewedReferenceGateDeclared,
  allDomainsHaveReviewedReferencesDerived: reviewedReferenceGateDerived,
  structuralErrorCount: structuralErrors.length
};

console.log(JSON.stringify({ summary, structuralErrors, domains: domainReports }, null, 2));

if (check && structuralErrors.length > 0) {
  throw new Error(`Foundations evidence audit found ${structuralErrors.length} structural evidence error(s).`);
}
