import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const allowedStates = new Set(['revision-required', 'pending']);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    out[key] = argv[++i];
  }
  return out;
}

export function selectNextReviewTask(queue, { lane = null, state = null } = {}) {
  if (!queue || !Array.isArray(queue.tasks)) throw new Error('review queue must contain tasks');
  if (state && !allowedStates.has(state)) throw new Error(`unsupported state filter: ${state}`);

  const priority = { 'revision-required': 0, pending: 1 };
  return queue.tasks
    .filter((task) => allowedStates.has(task.state))
    .filter((task) => !lane || task.lane === lane)
    .filter((task) => !state || task.state === state)
    .sort((a, b) =>
      (priority[a.state] - priority[b.state]) ||
      String(a.lane).localeCompare(String(b.lane)) ||
      String(a.objectId).localeCompare(String(b.objectId))
    )[0] ?? null;
}

export function taskInstructions(task) {
  if (!task) return null;
  const decisionType = task.reviewType;
  return {
    task,
    nextSteps: [
      `Inspect the review packet for ${task.objectId}@${task.objectVersion}.`,
      `Perform the ${decisionType} review as a human reviewer.`,
      `Preview a decision with: npm run review:record -- --object ${task.objectId} --type ${decisionType} --reviewer <reviewer-id> --status <approved|changes-requested|rejected>`,
      'Only after reviewing the preview, add --write. Approved decisions also require --confirm-approved; approved scientific decisions require --evidence.'
    ]
  };
}

function loadQueue() {
  const stdout = execFileSync(process.execPath, [path.join(root, 'scripts/build-review-queue.mjs')], { cwd: root, encoding: 'utf8' });
  return JSON.parse(stdout);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = taskInstructions(selectNextReviewTask(loadQueue(), { lane: args.lane ?? null, state: args.state ?? null }));
    if (!result) {
      console.log(JSON.stringify({ task: null, message: 'No actionable review task matches the requested filters.' }, null, 2));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
