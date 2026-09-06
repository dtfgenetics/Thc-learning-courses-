import crypto from 'node:crypto';
import { PersistenceUnavailableError } from './persistence-errors.mjs';

async function queryOrUnavailable(query, text, params) {
  try { return await query(text, params); }
  catch (error) { throw new PersistenceUnavailableError('persistence-unavailable', { cause: error }); }
}

export function createPostgresLearnerStore({ query } = {}) {
  if (typeof query !== 'function') throw new Error('PostgreSQL learner store requires a query(text, params) function');

  async function ensureLearner(externalSubject) {
    if (!externalSubject) throw new Error('externalSubject required');
    const learnerId = crypto.randomUUID();
    const result = await queryOrUnavailable(
      query,
      `insert into learners (id, external_subject)
       values ($1, $2)
       on conflict (external_subject) do update set external_subject = excluded.external_subject
       returning id, external_subject`,
      [learnerId, externalSubject]
    );
    return result.rows?.[0] ?? null;
  }

  return {
    kind: 'postgres-learner-progress',
    async listProgress(externalSubject) {
      const result = await queryOrUnavailable(
        query,
        `select lp.lesson_id, lp.lesson_version, lp.status, lp.completed_at
           from learners l
           join lesson_progress lp on lp.learner_id = l.id
          where l.external_subject = $1
          order by lp.lesson_id, lp.lesson_version`,
        [externalSubject]
      );
      return (result.rows ?? []).map((row) => ({
        lessonId: row.lesson_id,
        lessonVersion: String(row.lesson_version),
        status: row.status,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null
      }));
    },
    async setLessonProgress(externalSubject, { lessonId, lessonVersion, status, completedAt = null } = {}) {
      if (!lessonId) throw new Error('lessonId required');
      if (!lessonVersion) throw new Error('lessonVersion required');
      if (!['not-started', 'in-progress', 'completed'].includes(status)) throw new Error('invalid lesson progress status');
      const learner = await ensureLearner(externalSubject);
      if (!learner?.id) throw new Error('learner-resolution-failed');
      const resolvedCompletedAt = status === 'completed' ? (completedAt ?? new Date().toISOString()) : null;
      const result = await queryOrUnavailable(
        query,
        `insert into lesson_progress (learner_id, lesson_id, lesson_version, status, completed_at)
         values ($1, $2, $3, $4, $5)
         on conflict (learner_id, lesson_id, lesson_version)
         do update set status = excluded.status, completed_at = excluded.completed_at
         returning lesson_id, lesson_version, status, completed_at`,
        [learner.id, lessonId, String(lessonVersion), status, resolvedCompletedAt]
      );
      const row = result.rows?.[0];
      return {
        lessonId: row.lesson_id,
        lessonVersion: String(row.lesson_version),
        status: row.status,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null
      };
    }
  };
}
