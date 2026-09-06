export const AREA_PRIORITY = [
  'curriculum',
  'assessment',
  'credentials',
  'runtime',
  'api',
  'security',
  'accessibility',
  'operations'
];

export const GATE_TASKS = {
  scientificReviewComplete: { kind: 'review', mode: 'certify', action: 'complete scientific review evidence' },
  editorialReviewComplete: { kind: 'review', mode: 'certify', action: 'complete editorial review evidence' },
  minimumActivePoolComplete: { kind: 'assessment', mode: 'exam', action: 'expand and activate the assessment item pool' },
  humanAssessmentReviewComplete: { kind: 'review', mode: 'certify', action: 'complete human assessment review' },
  pilotStatisticsComplete: { kind: 'pilot', mode: 'certify', action: 'collect and validate pilot statistics' },
  productionPersistenceAdapter: { kind: 'platform', mode: 'platform', action: 'implement the production persistence adapter' },
  authenticationIntegrated: { kind: 'security', mode: 'platform', action: 'integrate production authentication' },
  authorizationIntegrated: { kind: 'security', mode: 'platform', action: 'integrate production authorization' },
  productionIssuerIdentity: { kind: 'credential', mode: 'certify', action: 'configure the production credential issuer identity' },
  productionSigning: { kind: 'credential', mode: 'certify', action: 'implement production credential signing' },
  revocationPersistence: { kind: 'credential', mode: 'certify', action: 'persist credential revocation state' },
  productionDatabaseIntegration: { kind: 'platform', mode: 'platform', action: 'connect the API to the production database' },
  adminMfaEnforced: { kind: 'security', mode: 'platform', action: 'enforce administrator MFA' },
  rowLevelAuthorization: { kind: 'security', mode: 'platform', action: 'enforce row-level authorization' },
  securityReviewComplete: { kind: 'review', mode: 'platform', action: 'complete the security review' },
  contentAccessibilityReviewComplete: { kind: 'accessibility', mode: 'learner', action: 'complete content accessibility review' },
  assessmentAccessibilityReviewComplete: { kind: 'accessibility', mode: 'learner', action: 'complete assessment accessibility review' },
  frontendAccessibilityTestingComplete: { kind: 'accessibility', mode: 'learner', action: 'complete frontend accessibility testing' },
  stagingEnvironment: { kind: 'operations', mode: 'release', action: 'establish and validate staging' },
  productionEnvironment: { kind: 'operations', mode: 'release', action: 'establish and validate production environment' },
  backupRestoreTested: { kind: 'operations', mode: 'release', action: 'test backup and restore' },
  monitoringAndAlerting: { kind: 'operations', mode: 'release', action: 'implement monitoring and alerting' }
};

export function collectBlockers(registry) {
  const blockers = [];
  const areas = registry?.areas ?? {};
  for (const area of AREA_PRIORITY) {
    const gates = areas[area]?.gates ?? {};
    for (const [gate, value] of Object.entries(gates)) {
      if (value === true) continue;
      const task = GATE_TASKS[gate] ?? {
        kind: area,
        mode: area === 'curriculum' ? 'author' : 'full',
        action: `resolve ${gate}`
      };
      blockers.push({ area, gate, ...task });
    }
  }
  return blockers;
}

export function normalizeActiveWork(activeWork = []) {
  return activeWork
    .filter(Boolean)
    .map((item) => ({
      branch: item.branch ?? null,
      pr: item.pr ?? null,
      area: item.area ?? null,
      gate: item.gate ?? null,
      state: item.state ?? 'open'
    }))
    .filter((item) => item.state === 'open');
}

export function selectNextTask(registry, activeWork = []) {
  const blockers = collectBlockers(registry);
  const active = normalizeActiveWork(activeWork);

  for (const blocker of blockers) {
    const owner = active.find((item) => item.gate === blocker.gate || (!item.gate && item.area === blocker.area));
    if (owner) {
      return {
        ...blocker,
        disposition: 'resume',
        branch: owner.branch,
        pr: owner.pr,
        reason: `Existing open work owns ${blocker.area}.${blocker.gate}`
      };
    }
  }

  const blocker = blockers[0] ?? null;
  if (!blocker) {
    return {
      disposition: 'release-check',
      mode: 'release',
      action: 'run the full production release gate',
      reason: 'No unresolved readiness gates remain'
    };
  }

  return {
    ...blocker,
    disposition: 'start',
    branch: `work/${blocker.area}-${blocker.gate.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
    pr: null,
    reason: `Highest-priority unresolved gate is ${blocker.area}.${blocker.gate}`
  };
}

export function buildWorkerReport(registry, activeWork = []) {
  const blockers = collectBlockers(registry);
  return {
    system: registry?.system ?? 'THC Academy',
    version: registry?.version ?? null,
    productionReadyClaim: registry?.productionReady === true,
    blockerCount: blockers.length,
    blockers,
    nextTask: selectNextTask(registry, activeWork)
  };
}
