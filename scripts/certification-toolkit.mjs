#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const TOOL_GROUPS = {
  content: [
    "schema:validate",
    "validate",
    "occupational:validate",
    "knowledge:validate",
    "registry:validate"
  ],
  assessment: [
    "performance:validate",
    "itembank:readiness",
    "exam:form:dev",
    "pilot:validate",
    "pilot:aggregate:test",
    "pilot:readiness"
  ],
  credential: [
    "credential:test",
    "credential:tech2:test",
    "credential:progress:test",
    "credential:issue:test",
    "credential:verify:test",
    "credential:issuance:test",
    "credential:public:test",
    "credential:specialist:readiness",
    "credential:specialist:coverage",
    "credential:coverage"
  ],
  review: [
    "review:validate",
    "review:record:test",
    "review:next:test",
    "review:queue:check",
    "review:packets:check",
    "review:readiness"
  ],
  learner: [
    "academy:web:test",
    "academy:progress:test",
    "academy:accessibility:test",
    "api:learner-progress:test",
    "api:learner-enrollment:test"
  ],
  platform: [
    "runtime:test",
    "api:test",
    "api:failure:test",
    "api:bootstrap:test",
    "db:schema:test",
    "persistence:test",
    "credential:persistence:test",
    "rls:contract:test",
    "ops:validate"
  ],
  release: [
    "staging:smoke",
    "staging:readiness",
    "status:check",
    "release:scope:test",
    "production:readiness"
  ]
};

const MODES = {
  author: ["content"],
  exam: ["content", "assessment"],
  certify: ["content", "assessment", "credential", "review"],
  learner: ["content", "learner"],
  platform: ["platform"],
  release: ["content", "assessment", "credential", "review", "learner", "platform", "release"],
  full: Object.keys(TOOL_GROUPS)
};

function parseArgs(argv) {
  const args = { mode: "full", json: false, continueOnFailure: false, list: false };
  for (const arg of argv) {
    if (arg === "--json") args.json = true;
    else if (arg === "--continue") args.continueOnFailure = true;
    else if (arg === "--list") args.list = true;
    else if (arg.startsWith("--mode=")) args.mode = arg.slice("--mode=".length);
    else if (!arg.startsWith("--")) args.mode = arg;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return args;
}

function listTools() {
  return { modes: MODES, groups: TOOL_GROUPS };
}

function runNpmScript(scriptName) {
  const startedAt = Date.now();
  const result = spawnSync("npm", ["run", scriptName], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  return {
    script: scriptName,
    ok: result.status === 0,
    status: result.status ?? 1,
    durationMs: Date.now() - startedAt,
    signal: result.signal ?? null,
    error: result.error?.message ?? null
  };
}

function uniqueScripts(groups) {
  const seen = new Set();
  const scripts = [];
  for (const group of groups) {
    for (const script of TOOL_GROUPS[group] ?? []) {
      if (!seen.has(script)) {
        seen.add(script);
        scripts.push({ group, script });
      }
    }
  }
  return scripts;
}

function printSummary(summary) {
  console.log("\nCertification toolkit summary");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Checks: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Duration: ${(summary.durationMs / 1000).toFixed(1)}s`);
  if (summary.failedScripts.length) console.log(`Failed scripts: ${summary.failedScripts.join(", ")}`);
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  if (args.list) {
    console.log(JSON.stringify(listTools(), null, 2));
    return;
  }

  const groups = MODES[args.mode];
  if (!groups) {
    console.error(`Unknown mode: ${args.mode}`);
    console.error(`Available modes: ${Object.keys(MODES).join(", ")}`);
    process.exit(2);
  }

  const checks = uniqueScripts(groups);
  const startedAt = Date.now();
  const results = [];

  if (!args.json) {
    console.log(`Certification toolkit: ${args.mode}`);
    console.log(`Groups: ${groups.join(", ")}`);
    console.log(`Checks: ${checks.length}`);
  }

  for (const check of checks) {
    if (!args.json) console.log(`\n[${check.group}] ${check.script}`);
    const result = runNpmScript(check.script);
    results.push({ group: check.group, ...result });
    if (!result.ok && !args.continueOnFailure) break;
  }

  const failedScripts = results.filter((result) => !result.ok).map((result) => result.script);
  const summary = {
    mode: args.mode,
    groups,
    total: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: failedScripts.length,
    failedScripts,
    durationMs: Date.now() - startedAt,
    complete: results.length === checks.length,
    results
  };

  if (args.json) console.log(JSON.stringify(summary, null, 2));
  else printSummary(summary);

  if (summary.failed > 0 || !summary.complete) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
