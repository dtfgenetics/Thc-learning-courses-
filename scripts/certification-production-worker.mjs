#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildWorkerReport } from './lib/production-worker-core.mjs';

function parseArgs(argv) {
  const args = {
    readiness: 'registry/system-readiness.json',
    activeWork: null,
    json: false
  };

  for (const arg of argv) {
    if (arg === '--json') args.json = true;
    else if (arg.startsWith('--readiness=')) args.readiness = arg.slice('--readiness='.length);
    else if (arg.startsWith('--active-work=')) args.activeWork = arg.slice('--active-work='.length);
    else throw new Error(`Unknown option: ${arg}`);
  }

  return args;
}

function readJson(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function printHuman(report) {
  console.log(`${report.system} certification production worker`);
  console.log(`Production-ready claim: ${report.productionReadyClaim}`);
  console.log(`Unresolved gates: ${report.blockerCount}`);

  if (report.blockers.length) {
    console.log('\nPriority queue:');
    report.blockers.forEach((blocker, index) => {
      console.log(`${index + 1}. ${blocker.area}.${blocker.gate} -> ${blocker.action} [${blocker.mode}]`);
    });
  }

  const next = report.nextTask;
  console.log('\nNext action:');
  console.log(`Disposition: ${next.disposition}`);
  if (next.area && next.gate) console.log(`Gate: ${next.area}.${next.gate}`);
  console.log(`Action: ${next.action}`);
  console.log(`Toolkit mode: ${next.mode}`);
  if (next.branch) console.log(`Branch: ${next.branch}`);
  if (next.pr) console.log(`PR: ${next.pr}`);
  console.log(`Reason: ${next.reason}`);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const registry = readJson(args.readiness);
  const activeWork = args.activeWork ? readJson(args.activeWork) : [];
  const report = buildWorkerReport(registry, activeWork);

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
} catch (error) {
  console.error(`Certification production worker failed: ${error.message}`);
  process.exit(1);
}
