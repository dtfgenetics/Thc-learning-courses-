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

function assignmentView(row) {
  if (!row?.assigned_evaluator_id) return null;
  return {
    evaluatorId: row.assigned_evaluator_id,
    assignedBy: row.assigned_by ?? null,
    assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : null,
    updatedAt: row.assignment_updated_at ? new Date(row.assignment_updated_at).toISOString() : null
  };
}

function queueRow(row) {
  return {
    learnerSubject: row.external_subject,
    enrollmentStatus: row.enrollment_status,
    enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : null,
    practicalStatus: row.practical_status ?? 'not-recorded',
    scorePercent: row.score_percent == null ? null : Number(row.score_percent),
    criticalErrorCount: Number(row.critical_error_count ?? 0),
    followUpStatus: row.follow_up_status ?? 'none',
    reassessmentTargetDate: row.reassessment_target_date ?? '',
    assignedEvaluatorId: row.assigned_evaluator_id ?? null,
    assignedBy: row.assigned_by ?? null,
    assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : null,
    evaluatedAt: row.evaluated_at ? new Date(row.evaluated_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

function assignmentFilterSql(filter) {
  if (filter === 'mine') return 'a.evaluator_id = $7';
  if (filter === 'unassigned') return 'a.evaluator_id is null';
  if (filter === 'assigned') return 'a.evaluator_id is not null';
  return 'true';
}

export function createPostgresPracticalEvaluatorStore({ query } = {}) {
  if (typeof query !== 'function') throw new Error('PostgreSQL practical evaluator store requires a query(text, params) function');

  async function learnerIdForSubject(externalSubject) {
    const result = await queryOrUnavailable(query, 'select id from learners where external_subject = $1 limit 1', [externalSubject]);
    return result.rows?.[0]?.id ?? null;
  }

  async function listRows({ courseId, assessmentId, assessmentVersion, search = '', practicalStatus = '', assignmentFilter = '', evaluatorId = '', page = 1, pageSize = 25, all = false } = {}) {
    if (!courseId || !assessmentId || !assessmentVersion) throw new Error('courseId, assessmentId and assessmentVersion required');
    const offset = Math.max(0, (Number(page) - 1) * Number(pageSize));
    const assignmentSql = assignmentFilterSql(assignmentFilter);
    const pagination = all ? '' : 'limit $8 offset $9';
    const params = [courseId, assessmentId, String(assessmentVersion), search, practicalStatus, assignmentFilter, evaluatorId];
    if (!all) params.push(Number(pageSize), offset);
    const result = await queryOrUnavailable(
      query,
      `select l.external_subject,
              e.status as enrollment_status,
              e.enrolled_at,
              p.status as practical_status,
              p.score_percent,
              p.critical_error_count,
              p.evidence_json ->> 'followUpStatus' as follow_up_status,
              p.evidence_json ->> 'reassessmentTargetDate' as reassessment_target_date,
              a.evaluator_id as assigned_evaluator_id,
              a.assigned_by,
              a.assigned_at,
              p.evaluated_at,
              p.updated_at,
              count(*) over()::integer as total_count
         from learners l
         join enrollments e on e.learner_id = l.id and e.course_id = $1
         left join performance_assessment_results p
           on p.learner_id = l.id and p.assessment_id = $2 and p.assessment_version = $3
         left join practical_evaluation_assignments a
           on a.learner_id = l.id and a.course_id = $1 and a.assessment_id = $2 and a.assessment_version = $3
        where ($4 = '' or l.external_subject ilike ('%' || $4 || '%'))
          and ($5 = '' or coalesce(p.status, 'not-recorded') = $5)
          and ${assignmentSql}
        order by p.updated_at desc nulls last, e.enrolled_at desc, l.external_subject
        ${pagination}`,
      params
    );
    const rows = result.rows ?? [];
    return { rows: rows.map(queueRow), total: Number(rows[0]?.total_count ?? 0) };
  }

  return {
    kind: 'postgres-practical-evaluator',
    async listCourseLearners(options = {}) {
      const page = Math.max(1, Math.trunc(Number(options.page) || 1));
      const pageSize = Math.max(10, Math.min(100, Math.trunc(Number(options.pageSize) || 25)));
      const result = await listRows({ ...options, page, pageSize });
      return { items: result.rows, page, pageSize, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / pageSize)) };
    },
    async listCourseReportRows(options = {}) {
      const result = await listRows({ ...options, all: true });
      return result.rows;
    },
    async getEvaluation(externalSubject, { courseId = null, assessmentId, assessmentVersion } = {}) {
      if (!externalSubject || !assessmentId || !assessmentVersion) throw new Error('externalSubject, assessmentId and assessmentVersion required');
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return { learnerExists: false, evaluation: null, assignment: null };
      const result = await queryOrUnavailable(
        query,
        `select p.assessment_id, p.assessment_version, p.status, p.score_percent, p.critical_error_count,
                p.evidence_json, p.evaluator_id, p.evaluated_at, p.updated_at,
                a.evaluator_id as assigned_evaluator_id, a.assigned_by, a.assigned_at, a.updated_at as assignment_updated_at
           from learners l
           left join performance_assessment_results p
             on p.learner_id = l.id and p.assessment_id = $2 and p.assessment_version = $3
           left join practical_evaluation_assignments a
             on a.learner_id = l.id and a.assessment_id = $2 and a.assessment_version = $3
            and ($4::text is null or a.course_id = $4)
          where l.id = $1
          limit 1`,
        [learnerId, assessmentId, String(assessmentVersion), courseId]
      );
      const row = result.rows?.[0] ?? null;
      return { learnerExists: true, evaluation: row?.assessment_id ? rowView(row) : null, assignment: assignmentView(row) };
    },
    async claimEvaluator(externalSubject, { courseId, assessmentId, assessmentVersion, evaluatorId, assignedBy = evaluatorId } = {}) {
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return { learnerExists: false, assignment: null };
      const result = await queryOrUnavailable(
        query,
        `with assigned as (
           insert into practical_evaluation_assignments
             (learner_id, course_id, assessment_id, assessment_version, evaluator_id, assigned_by, assigned_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,now(),now())
           on conflict (learner_id, course_id, assessment_id, assessment_version)
           do update set evaluator_id = excluded.evaluator_id, assigned_by = excluded.assigned_by, assigned_at = now(), updated_at = now()
           where practical_evaluation_assignments.evaluator_id = excluded.evaluator_id
           returning evaluator_id as assigned_evaluator_id, assigned_by, assigned_at, updated_at as assignment_updated_at
         ), audited as (
           insert into audit_events (event_type, actor_id, subject_type, subject_id, metadata)
           select 'course-practical-assignment-claimed', $6, 'learner', $7,
                  jsonb_build_object('courseId',$2,'assessmentId',$3,'assessmentVersion',$4,'assignedEvaluatorId',$5)
             from assigned
           returning id
         )
         select assigned.* from assigned cross join audited`,
        [learnerId, courseId, assessmentId, String(assessmentVersion), evaluatorId, assignedBy, externalSubject]
      );
      if (!result.rows?.[0]) return { learnerExists: true, conflict: true, assignment: null };
      return { learnerExists: true, conflict: false, assignment: assignmentView(result.rows[0]) };
    },
    async setEvaluatorAssignment(externalSubject, { courseId, assessmentId, assessmentVersion, evaluatorId, assignedBy } = {}) {
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return { learnerExists: false, assignment: null };
      if (!evaluatorId) {
        await queryOrUnavailable(
          query,
          `with removed as (
             delete from practical_evaluation_assignments
              where learner_id=$1 and course_id=$2 and assessment_id=$3 and assessment_version=$4
              returning evaluator_id
           )
           insert into audit_events (event_type, actor_id, subject_type, subject_id, metadata)
           select 'course-practical-assignment-cleared', $5, 'learner', $6,
                  jsonb_build_object('courseId',$2,'assessmentId',$3,'assessmentVersion',$4,'previousEvaluatorId',removed.evaluator_id)
             from removed`,
          [learnerId, courseId, assessmentId, String(assessmentVersion), assignedBy, externalSubject]
        );
        return { learnerExists: true, assignment: null };
      }
      const result = await queryOrUnavailable(
        query,
        `with assigned as (
           insert into practical_evaluation_assignments
             (learner_id, course_id, assessment_id, assessment_version, evaluator_id, assigned_by, assigned_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,now(),now())
           on conflict (learner_id, course_id, assessment_id, assessment_version)
           do update set evaluator_id=excluded.evaluator_id, assigned_by=excluded.assigned_by, assigned_at=now(), updated_at=now()
           returning evaluator_id as assigned_evaluator_id, assigned_by, assigned_at, updated_at as assignment_updated_at
         ), audited as (
           insert into audit_events (event_type, actor_id, subject_type, subject_id, metadata)
           select 'course-practical-assignment-set', $6, 'learner', $7,
                  jsonb_build_object('courseId',$2,'assessmentId',$3,'assessmentVersion',$4,'assignedEvaluatorId',$5)
             from assigned
           returning id
         )
         select assigned.* from assigned cross join audited`,
        [learnerId, courseId, assessmentId, String(assessmentVersion), evaluatorId, assignedBy, externalSubject]
      );
      return { learnerExists: true, assignment: assignmentView(result.rows?.[0] ?? null) };
    },
    async releaseEvaluator(externalSubject, { courseId, assessmentId, assessmentVersion, evaluatorId } = {}) {
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return { learnerExists: false, released: false };
      const result = await queryOrUnavailable(
        query,
        `with removed as (
           delete from practical_evaluation_assignments
            where learner_id=$1 and course_id=$2 and assessment_id=$3 and assessment_version=$4 and evaluator_id=$5
            returning evaluator_id
         ), audited as (
           insert into audit_events (event_type, actor_id, subject_type, subject_id, metadata)
           select 'course-practical-assignment-released', $5, 'learner', $6,
                  jsonb_build_object('courseId',$2,'assessmentId',$3,'assessmentVersion',$4,'previousEvaluatorId',removed.evaluator_id)
             from removed
           returning id
         )
         select removed.evaluator_id from removed cross join audited`,
        [learnerId, courseId, assessmentId, String(assessmentVersion), evaluatorId, externalSubject]
      );
      return { learnerExists: true, released: Boolean(result.rows?.[0]) };
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
                                      'scorePercent', $5, 'criticalErrorCount', $6,
                                      'followUpStatus', $7::jsonb ->> 'followUpStatus'))
           returning id
         )
         select saved.* from saved cross join audited`,
        [learnerId, record.assessmentId, String(record.assessmentVersion), record.status,
          record.scorePercent == null ? null : Number(record.scorePercent), Number(record.criticalErrorCount ?? 0),
          JSON.stringify(record.evidence ?? {}), record.evaluatorId, record.evaluatedAt ?? null, externalSubject]
      );
      return { learnerExists: true, evaluation: rowView(result.rows?.[0] ?? null) };
    }
  };
}
