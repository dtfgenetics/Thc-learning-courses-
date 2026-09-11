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
  substantiveContentComplete: { kind: 'authoring', mode: 'author', action: 'continue building substantive curriculum content' },
  catalogExpansionComplete: { kind: 'authoring', mode: 'author', action: 'continue expanding the course, lesson, activity, and assessment catalog' }
};

const BLOCKING_GATES = new Set([
  'substantiveContentComplete',
  'catalogExpansionComplete'
]);

function orderedGateEntries(area, gates) {
  const entries = Object.entries(gates).filter(([gate]) => BLOCKING_GATES.has(gate));
  if (area !== 'curriculum') return entries;
  const priority = ['substantiveContentComplete', 'catalogExpansionComplete'];
  const rank = new Map(priority.map((gate, index) => [gate, index]));
  return entries.sort(([a], [b]) => (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER));
}

export function collectBlockers(registry) {
  const blockers = [];
  const areas = registry?.areas ?? {};
  for (const area of AREA_PRIORITY) {
    const gates = areas[area]?.gates ?? {};
    for (const [gate, value] of orderedGateEntries(area, gates)) {
      if (value === true) continue;
      const task = GATE_TASKS[gate];
      if (!task) continue;
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
      action: 'run certification integrity and release checks',
      reason: 'No unfinished curriculum-content blockers remain'
    };
  }

  return {
    ...blocker,
    disposition: 'start',
    branch: `work/${blocker.area}-${blocker.gate.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
    pr: null,
    reason: `Highest-priority unfinished content area is ${blocker.area}.${blocker.gate}`
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
