import { PersistenceUnavailableError } from './persistence-errors.mjs';

async function queryOrUnavailable(query, text, params) {
  try { return await query(text, params); }
  catch (error) { throw new PersistenceUnavailableError('persistence-unavailable', { cause: error }); }
}

function rowView(row) {
  if (!row) return null;
  return {
    assessmentId: row.assessment_id,
    assessmentVersion: String(row.assessment_version),
    status: row.status,
    scorePercent: row.score_percent == null ? null : Number(row.score_percent),
    criticalErrorCount: Number(row.critical_error_count ?? 0),
    evidence: row.evidence_json && typeof row.evidence_json === 'object' ? row.evidence_json : {},
    evaluatorId: row.evaluator_id ?? null,
    evaluatedAt: row.evaluated_at ? new Date(row.evaluated_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

export function createPostgresPracticalEvaluatorStore({ query } = {}) {
  if (typeof query !== 'function') throw new Error('PostgreSQL practical evaluator store requires a query(text, params) function');

  async function learnerIdForSubject(externalSubject) {
    const result = await queryOrUnavailable(query, 'select id from learners where external_subject = $1 limit 1', [externalSubject]);
    return result.rows?.[0]?.id ?? null;
  }

  return {
    kind: 'postgres-practical-evaluator',
    async getEvaluation(externalSubject, { assessmentId, assessmentVersion } = {}) {
      if (!externalSubject || !assessmentId || !assessmentVersion) throw new Error('externalSubject, assessmentId and assessmentVersion required');
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return { learnerExists: false, evaluation: null };
      const result = await queryOrUnavailable(
        query,
        `select assessment_id, assessment_version, status, score_percent, critical_error_count,
                evidence_json, evaluator_id, evaluated_at, updated_at
           from performance_assessment_results
          where learner_id = $1 and assessment_id = $2 and assessment_version = $3
          limit 1`,
        [learnerId, assessmentId, String(assessmentVersion)]
      );
      return { learnerExists: true, evaluation: rowView(result.rows?.[0] ?? null) };
    },
    async saveEvaluation(externalSubject, record = {}) {
      if (!externalSubject || !record.assessmentId || !record.assessmentVersion || !record.status || !record.evaluatorId) throw new Error('complete practical evaluation record required');
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return { learnerExists: false, evaluation: null };
      const result = await queryOrUnavailable(
        query,
        `with saved as (
           insert into performance_assessment_results
             (learner_id, assessment_id, assessment_version, status, score_percent, critical_error_count,
              evidence_json, evaluator_id, evaluated_at, updated_at)
           values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, now())
           on conflict (learner_id, assessment_id, assessment_version)
           do update set status = excluded.status,
                         score_percent = excluded.score_percent,
                         critical_error_count = excluded.critical_error_count,
                         evidence_json = excluded.evidence_json,
                         evaluator_id = excluded.evaluator_id,
                         evaluated_at = excluded.evaluated_at,
                         updated_at = now()
           returning assessment_id, assessment_version, status, score_percent, critical_error_count,
                     evidence_json, evaluator_id, evaluated_at, updated_at
         ), audited as (
           insert into audit_events (event_type, actor_id, subject_type, subject_id, metadata)
           values ('course-practical-evaluation-saved', $8, 'learner', $10,
                   jsonb_build_object('assessmentId', $2, 'assessmentVersion', $3, 'status', $4,
                                      'scorePercent', $5, 'criticalErrorCount', $6))
           returning id
         )
         select saved.* from saved cross join audited`,
        [
          learnerId,
          record.assessmentId,
          String(record.assessmentVersion),
          record.status,
          record.scorePercent == null ? null : Number(record.scorePercent),
          Number(record.criticalErrorCount ?? 0),
          JSON.stringify(record.evidence ?? {}),
          record.evaluatorId,
          record.evaluatedAt ?? null,
          externalSubject
        ]
      );
      return { learnerExists: true, evaluation: rowView(result.rows?.[0] ?? null) };
    }
  };
}
