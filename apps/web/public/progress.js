const STORAGE_KEY = 'thc-academy-progress-v1';

export function readProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { completedLessons: [] };
    const parsed = JSON.parse(raw);
    const completedLessons = Array.isArray(parsed.completedLessons)
      ? [...new Set(parsed.completedLessons.filter((id) => typeof id === 'string'))]
      : [];
    return { completedLessons };
  } catch {
    return { completedLessons: [] };
  }
}

export function writeProgress(progress, storage = globalThis.localStorage) {
  const normalized = {
    completedLessons: [...new Set((progress?.completedLessons ?? []).filter((id) => typeof id === 'string'))].sort()
  };
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function setLessonComplete(progress, lessonId, complete = true) {
  const current = new Set(progress?.completedLessons ?? []);
  if (complete) current.add(lessonId);
  else current.delete(lessonId);
  return { completedLessons: [...current].sort() };
}

export function progressFromServerRows(rows = []) {
  return {
    completedLessons: [...new Set(
      rows
        .filter((row) => row?.status === 'completed' && typeof row.lessonId === 'string')
        .map((row) => row.lessonId)
    )].sort()
  };
}

export function createServerProgressClient({ fetchImpl = globalThis.fetch, basePath = '/api/v1' } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Server progress client requires fetch');
  return {
    async load() {
      const response = await fetchImpl(`${basePath}/me/progress`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        credentials: 'same-origin'
      });
      if (!response.ok) throw Object.assign(new Error(`Account progress unavailable (${response.status})`), { status: response.status });
      const body = await response.json();
      return { progress: progressFromServerRows(body.progress), subject: body.learner?.subject ?? null };
    },
    async setLesson({ lessonId, lessonVersion, complete }) {
      const response = await fetchImpl(`${basePath}/me/lessons/${encodeURIComponent(lessonId)}`, {
        method: 'PUT',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ lessonVersion: String(lessonVersion), status: complete ? 'completed' : 'not-started' })
      });
      if (!response.ok) throw Object.assign(new Error(`Account progress update failed (${response.status})`), { status: response.status });
      return response.json();
    }
  };
}

export function courseProgress(course, progress) {
  const lessonIds = (course?.modules ?? []).flatMap((module) => (module.lessons ?? []).map((lesson) => lesson.id));
  const completed = new Set(progress?.completedLessons ?? []);
  const completedCount = lessonIds.filter((id) => completed.has(id)).length;
  return {
    completed: completedCount,
    total: lessonIds.length,
    percent: lessonIds.length ? Math.round((completedCount / lessonIds.length) * 100) : 0
  };
}
