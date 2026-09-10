import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const blocked = ['play' + 'wright'];
const textExtensions = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.sh', '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml',
]);
const ignoredDirectories = new Set(['.git', '.artifacts', 'node_modules']);
const ignoredFiles = new Set([path.normalize('scripts/check-routine-qa-policy.mjs')]);
const findings = [];

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) await walk(absolute);
      continue;
    }

    if (!entry.isFile() || ignoredFiles.has(path.normalize(relative))) continue;
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;

    const content = await fs.readFile(absolute, 'utf8').catch(() => '');
    const lower = content.toLowerCase();
    for (const token of blocked) {
      if (lower.includes(token)) findings.push(`${relative}: contains blocked routine-QA token "${token}"`);
    }

    const lowerPath = relative.toLowerCase();
    for (const token of blocked) {
      if (lowerPath.includes(token)) findings.push(`${relative}: blocked routine-QA token appears in path`);
    }
  }
}

await walk(root);

if (findings.length) {
  console.error('Routine QA policy violation(s):');
  for (const finding of findings) console.error(`- ${finding}`);
  console.error('Routine project QA must remain deterministic and must not include the blocked browser-automation framework.');
  process.exit(1);
}

console.log('Routine QA policy check passed: blocked browser automation is absent from repository text and paths.');
