import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

function asMap(definitions) {
  if (definitions instanceof Map) return definitions;
  return new Map(Object.entries(definitions ?? {}));
}

function criticalErrorCount(result) {
  if (Array.isArray(result?.criticalErrors)) return result.criticalErrors.length;
  const count = Number(result?.criticalErrorCount ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function evaluateCredentialEligibility({ credential, evidence, performanceDefinitions = new Map() }) {
  const missing = [];
  const assessmentResults = new Map((evidence.assessments ?? []).map((row) => [row.assessmentId, row]));
  const performanceResults = new Map((evidence.performanceAssessments ?? []).map((row) => [row.assessmentId, row]));
  const performanceById = asMap(performanceDefinitions);

  for (const requiredId of credential.eligibility.requiredAssessments ?? []) {
    const result = assessmentResults.get(requiredId);
    if (!result) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'missing-result' });
      continue;
    }
    if (result.status !== 'passed') {
      missing.push({ type: 'assessment', id: requiredId, reason: 'not-passed' });
      continue;
    }

    const score = Number(result.scorePercent);
    const minimum = Number(credential.eligibility.minimumPassingScorePercent);
    if (!Number.isFinite(score)) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'missing-score' });
      continue;
    }
    if (score < minimum) {
      missing.push({ type: 'assessment', id: requiredId, reason: 'below-minimum-score', required: minimum, actual: score });
    }
  }

  for (const requiredId of credential.eligibility.requiredPerformanceAssessments ?? []) {
    const definition = performanceById.get(requiredId);
    if (!definition) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-performance-definition' });
      continue;
    }

    const result = performanceResults.get(requiredId);
    if (!result) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-result' });
      continue;
    }
    if (result.status !== 'passed') {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'not-passed' });
      continue;
    }

    const score = Number(result.scorePercent);
    const minimum = Number(definition.passingStandard?.minimumPercent);
    if (!Number.isFinite(score)) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'missing-score' });
      continue;
    }
    if (Number.isFinite(minimum) && score < minimum) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'below-performance-minimum-score', required: minimum, actual: score });
    }

    if (definition.passingStandard?.noCriticalErrors === true) {
      const count = criticalErrorCount(result);
      if (count > 0) {
        missing.push({ type: 'performance-assessment', id: requiredId, reason: 'critical-error', count });
      }
    }

    if (credential.eligibility.requireVerifiedPerformanceEvidence === true && result.evidenceVerified !== true) {
      missing.push({ type: 'performance-assessment', id: requiredId, reason: 'performance-evidence-unverified' });
    }
  }

  return {
    credentialId: credential.id,
    credentialVersion: credential.version,
    learnerId: evidence.learnerId ?? null,
    eligible: missing.length === 0,
    missingRequirements: missing
  };
}

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function runCli() {
  const inputPath = getArg('input');
  if (!inputPath) {
    throw new Error('Usage: node scripts/evaluate-credential-eligibility.mjs --input=<learner-evidence.json> [--credential=<credential-id>]');
  }

  const credentialId = getArg('credential') ?? 'CRED-CULT-FOUNDATIONS-001';
  if (!/^CRED-[A-Z0-9-]+$/.test(credentialId)) throw new Error(`Invalid credential id: ${credentialId}`);

  const evidence = readJson(inputPath);
  const credential = readJson(`content/credentials/${credentialId}.json`);
  const performanceDefinitions = new Map();

  for (const assessmentId of credential.eligibility.requiredPerformanceAssessments ?? []) {
    const relPath = `content/performance-assessments/${assessmentId}.json`;
    const fullPath = path.join(root, relPath);
    if (fs.existsSync(fullPath)) performanceDefinitions.set(assessmentId, readJson(relPath));
  }

  const output = evaluateCredentialEligibility({ credential, evidence, performanceDefinitions });
  console.log(JSON.stringify(output, null, 2));
  if (!output.eligible) process.exitCode = 2;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) runCli();
