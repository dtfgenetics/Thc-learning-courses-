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
