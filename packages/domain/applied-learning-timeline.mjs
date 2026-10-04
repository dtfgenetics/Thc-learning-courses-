function assertEvents(events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  for (const event of events) {
    if (!event || typeof event !== 'object' || typeof event.timestamp !== 'string' || typeof event.kind !== 'string') {
      throw new TypeError('invalid applied-learning event');
    }
  }
}

export function projectTimeline(events, {
  fields = ['airTemperatureC', 'relativeHumidityPct'],
  includeKinds = ['environment', 'measurement']
} = {}) {
  assertEvents(events);
  const allowed = new Set(includeKinds);
  const ordered = events
    .filter((event) => allowed.has(event.kind))
    .map((event) => ({ ...event, timeMs: Date.parse(event.timestamp) }))
    .filter((event) => Number.isFinite(event.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs || a.id.localeCompare(b.id));

  const timestamps = [...new Set(ordered.map((event) => event.timeMs))];
  const byTime = new Map(timestamps.map((time) => [time, new Map()]));
  for (const event of ordered) {
    for (const field of fields) {
      const value = event.payload?.[field];
      if (typeof value === 'number' && Number.isFinite(value)) byTime.get(event.timeMs).set(field, value);
    }
  }

  const series = Object.fromEntries(fields.map((field) => [
    field,
    timestamps.map((time) => byTime.get(time).get(field) ?? null)
  ]));

  return {
    timestamps,
    series,
    columnar: [
      timestamps.map((time) => time / 1000),
      ...fields.map((field) => series[field])
    ]
  };
}

export function projectTimelineMarkers(events) {
  assertEvents(events);
  return events
    .filter((event) => !['environment', 'measurement'].includes(event.kind))
    .map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      timeMs: Date.parse(event.timestamp),
      kind: event.kind,
      payload: event.payload ?? {},
      annotations: event.annotations ?? []
    }))
    .filter((event) => Number.isFinite(event.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs || a.id.localeCompare(b.id));
}
