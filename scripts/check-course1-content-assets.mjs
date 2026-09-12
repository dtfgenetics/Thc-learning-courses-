import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const courseId = 'COURSE-LH-TECH1-001';
const course = JSON.parse(fs.readFileSync(path.join(root, 'content/courses', `${courseId}.json`), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'visuals/ASSET-REGISTRY.json'), 'utf8'));
const failures = [];
const lessonIds = [];

for (const moduleId of course.modules ?? []) {
  const module = JSON.parse(fs.readFileSync(path.join(root, 'content/modules', `${moduleId}.json`), 'utf8'));
  for (const lessonId of module.lessons ?? []) lessonIds.push(lessonId);
}

const producedAssets = (registry.assets ?? []).filter((asset) => asset.status === 'produced');
const visualCoverage = new Map(lessonIds.map((id) => [id, []]));
for (const asset of producedAssets) {
  for (const lessonId of asset.primaryLessons ?? []) {
    if (!visualCoverage.has(lessonId)) failures.push(`${asset.id}: maps to unknown Course 1 lesson ${lessonId}`);
    else visualCoverage.get(lessonId).push(asset.id);
  }
  const source = path.join(root, asset.sourcePath ?? '');
  if (!asset.sourcePath || !fs.existsSync(source)) failures.push(`${asset.id}: produced asset source file is missing (${asset.sourcePath ?? 'no sourcePath'})`);
  if (asset.learnerPath && !asset.learnerPath.startsWith('/assets/course1/')) failures.push(`${asset.id}: learnerPath must stay inside /assets/course1/`);
  if (fs.existsSync(source) && source.endsWith('.svg')) {
    const svg = fs.readFileSync(source, 'utf8');
    if (!/<title\b[^>]*>[^<]+<\/title>/.test(svg)) failures.push(`${asset.id}: SVG needs an accessible <title>`);
    if (!/<desc\b[^>]*>[^<]+<\/desc>/.test(svg)) failures.push(`${asset.id}: SVG needs an accessible <desc>`);
    if (!/role="img"/.test(svg)) failures.push(`${asset.id}: SVG needs role="img"`);
  }
}

const structuredTypes = new Set(['table', 'steps', 'comparison', 'document', 'scenario', 'activity', 'image']);
let totalMinutes = 0;
let totalBlocks = 0;
let totalScenarios = 0;
let totalActivities = 0;

for (const lessonId of lessonIds) {
  const lesson = JSON.parse(fs.readFileSync(path.join(root, 'content/lessons', `${lessonId}.json`), 'utf8'));
  const content = lesson.content ?? {};
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const types = new Set(blocks.map((block) => block?.type).filter(Boolean));
  totalMinutes += Number(lesson.estimatedMinutes ?? 0);
  totalBlocks += blocks.length;
  totalScenarios += blocks.filter((block) => block?.type === 'scenario').length;
  totalActivities += blocks.filter((block) => block?.type === 'activity').length;

  if (lesson.status !== 'published') failures.push(`${lessonId}: learner lesson must be published`);
  if (typeof content.overview !== 'string' || content.overview.trim().length < 80) failures.push(`${lessonId}: overview is too shallow`);
  if (!Array.isArray(content.vocabulary) || content.vocabulary.length < 3) failures.push(`${lessonId}: needs at least 3 vocabulary entries`);
  if (!Array.isArray(content.sections) || content.sections.length < 3) failures.push(`${lessonId}: needs at least 3 instructional sections`);
  if (!Array.isArray(content.workedExamples) || content.workedExamples.length < 3) failures.push(`${lessonId}: needs at least 3 worked examples`);
  if (!Array.isArray(content.commonMistakes) || content.commonMistakes.length < 3) failures.push(`${lessonId}: needs at least 3 common mistakes`);
  if (typeof content.practicalApplication !== 'string' || content.practicalApplication.trim().length < 80) failures.push(`${lessonId}: practical application is too shallow`);
  if (typeof content.summary !== 'string' || content.summary.trim().length < 80) failures.push(`${lessonId}: summary is too shallow`);
  if (blocks.length < 8) failures.push(`${lessonId}: needs at least 8 rich-content blocks`);
  if (![...types].some((type) => type === 'scenario' || type === 'activity')) failures.push(`${lessonId}: needs scenario or activity practice`);
  if ([...types].filter((type) => structuredTypes.has(type)).length < 3) failures.push(`${lessonId}: needs at least 3 distinct structured block types`);
  if (!Array.isArray(lesson.references) || lesson.references.length < 1) failures.push(`${lessonId}: needs authoritative references`);
  if ((visualCoverage.get(lessonId) ?? []).length < 1) failures.push(`${lessonId}: no produced Course 1 visual is mapped to this lesson`);
}

if (registry.courseId !== courseId) failures.push(`visual registry courseId must be ${courseId}`);
if (registry.policy?.expandable !== true || registry.policy?.maximumAssetCount !== null) failures.push('Course 1 visual registry must remain expandable with no maximum asset count');

console.log(`Course 1 content/asset inventory: lessons=${lessonIds.length}, estimatedMinutes=${totalMinutes}, richBlocks=${totalBlocks}, scenarios=${totalScenarios}, activities=${totalActivities}, producedVisuals=${producedAssets.length}`);
console.log(`Visual lesson coverage: ${lessonIds.filter((id) => (visualCoverage.get(id) ?? []).length > 0).length}/${lessonIds.length}`);

if (failures.length) {
  console.error(`Course 1 content/asset audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Course 1 lesson depth, structured practice, reference, accessibility, and produced-visual coverage audit passed.');
