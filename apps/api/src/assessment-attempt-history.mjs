import { PersistenceUnavailableError } from './persistence-errors.mjs';

async function queryOrUnavailable(query, text, params) {
  try { return await query(text, params); }
  catch (error) { throw new PersistenceUnavailableError('persistence-unavailable', { cause: error }); }
}

export function createAssessmentAttemptHistoryReader({ query } = {}) {
  if (typeof query !== 'function') throw new Error('Assessment attempt history reader requires query(text, params)');

  return async function listAssessmentAttempts(externalSubject, assessmentId) {
    if (!externalSubject) throw new Error('externalSubject required');
    if (!/^ASSESS-[A-Z0-9-]+$/.test(String(assessmentId ?? ''))) throw new Error('valid assessmentId required');
    const result = await queryOrUnavailable(
      query,
      `select a.id, a.assessment_id, a.assessment_version, a.form_id, a.status,
              a.started_at, a.submitted_at, a.scored_at, a.score_percent, a.passed
         from learners l
         join assessment_attempts a on a.learner_id = l.id
        where l.external_subject = $1 and a.assessment_id = $2
        order by a.started_at desc, a.id desc`,
      [externalSubject, assessmentId]
    );
    return (result.rows ?? []).map((row) => ({
      id: row.id,
      assessmentId: row.assessment_id,
      assessmentVersion: String(row.assessment_version),
      formId: row.form_id,
      status: row.status,
      startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
      submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
      scoredAt: row.scored_at ? new Date(row.scored_at).toISOString() : null,
      scorePercent: row.score_percent == null ? null : Number(row.score_percent),
      passed: row.passed == null ? null : Boolean(row.passed)
    }));
  };
}
