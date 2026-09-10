import { access } from 'node:fs/promises';

const forbiddenPaths = [
  'games',
  'site',
  'wordpress',
  'web-qa.config.mjs',
  'lighthouserc.cjs',
  '.github/workflows/web-quality.yml',
  'scripts/discover-public-routes.mjs',
  'scripts/check-public-route-health.mjs',
  'skills/dev-debugger',
  'skills/pixel-perfect-visual-qa',
  'skills/lighthouse-site-auditor',
];

const forbiddenTopLevelProductNames = [
  'growlens',
  'grow-doc',
  'seed-man',
  'weedopolis',
  'high-land',
  'high-iq',
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const violations = [];
for (const path of forbiddenPaths) {
  if (await exists(path)) violations.push(path);
}
for (const name of forbiddenTopLevelProductNames) {
  if (await exists(name)) violations.push(name);
}

if (violations.length) {
  console.error('Repository scope violation: Thc-learning-courses- is reserved for learning courses, tests/assessments, certifications/credentials, and directly related learner/review/release infrastructure.');
  console.error('Move unrelated DTF website, game, GrowLens, Grow Doc, or site-wide QA code to its owning repository.');
  for (const path of violations) console.error(`  - ${path}`);
  process.exit(1);
}

console.log('Repository scope OK: no known site/game/tool ownership paths are present.');
