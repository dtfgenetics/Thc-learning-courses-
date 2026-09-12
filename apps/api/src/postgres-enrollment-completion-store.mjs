import { PersistenceUnavailableError } from './persistence-errors.mjs';

async function queryOrUnavailable(query, text, params) {
  try { return await query(text, params); }
  catch (error) { throw new PersistenceUnavailableError('persistence-unavailable', { cause: error }); }
}

function enrollmentView(row) {
  if (!row) return null;
  return {
    courseId: row.course_id,
    courseVersion: String(row.course_version),
    status: row.status,
    enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null
  };
}

function historyView(row) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    eventType: row.event_type,
    fromStatus: metadata.fromStatus ?? null,
    toStatus: metadata.toStatus ?? null,
    reason: metadata.reason ?? null,
    courseId: metadata.courseId ?? null,
    courseVersion: metadata.courseVersion == null ? null : String(metadata.courseVersion),
    previousCompletedAt: metadata.previousCompletedAt ?? null,
    completedAt: metadata.completedAt ?? null,
    academicSnapshot: metadata.academicSnapshot && typeof metadata.academicSnapshot === 'object' ? metadata.academicSnapshot : {},
    occurredAt: row.created_at ? new Date(row.created_at).toISOString() : null
  };
}

export function createPostgresEnrollmentCompletionStore({ query } = {}) {
  if (typeof query !== 'function') throw new Error('PostgreSQL enrollment completion store requires a query(text, params) function');
  return {
    kind: 'postgres-enrollment-completion',
    async setEnrollmentAcademicStatus(externalSubject, { courseId, courseVersion, status, completedAt = null, reason, academicSnapshot = {} } = {}) {
      if (!externalSubject || !courseId || !courseVersion) throw new Error('subject, courseId and courseVersion required');
      if (!['active', 'completed'].includes(status)) throw new Error('academic enrollment status must be active or completed');
      if (!reason) throw new Error('academic enrollment transition reason required');
      const result = await queryOrUnavailable(
        query,
        `with current as (
           select e.id, e.course_id, e.course_version, e.status, e.enrolled_at, e.completed_at
             from learners l
             join enrollments e on e.learner_id = l.id
            where l.external_subject = $1 and e.course_id = $2 and e.course_version = $3
            limit 1
            for update
         ), changed as (
           update enrollments e
              set status = $4,
                  completed_at = case when $4 = 'completed' then coalesce(e.completed_at, $5::timestamptz) else null end
             from current c
            where e.id = c.id
              and c.status <> 'withdrawn'
              and (c.status <> $4 or ($4 = 'completed' and c.completed_at is null))
           returning e.id, e.course_id, e.course_version, e.status, e.enrolled_at, e.completed_at,
                     c.status as previous_status, c.completed_at as previous_completed_at
         ), audited as (
           insert into audit_events (event_type, actor_id, subject_type, subject_id, metadata)
           select case when changed.status = 'completed' then 'course-enrollment-academic-completed' else 'course-enrollment-academic-reopened' end,
                  'system:academic-completion', 'learner', $1,
                  jsonb_build_object(
                    'courseId', changed.course_id,
                    'courseVersion', changed.course_version,
                    'fromStatus', changed.previous_status,
                    'toStatus', changed.status,
                    'reason', $6,
                    'previousCompletedAt', changed.previous_completed_at,
                    'completedAt', changed.completed_at,
                    'academicSnapshot', $7::jsonb
                  )
             from changed
           returning id
         )
         select changed.course_id, changed.course_version, changed.status, changed.enrolled_at, changed.completed_at,
                true as changed, audited.id as audit_event_id
           from changed cross join audited
         union all
         select current.course_id, current.course_version, current.status, current.enrolled_at, current.completed_at,
                false as changed, null::bigint as audit_event_id
           from current
          where not exists (select 1 from changed)
         limit 1`,
        [externalSubject, courseId, String(courseVersion), status, completedAt, reason, JSON.stringify(academicSnapshot ?? {})]
      );
      const row = result.rows?.[0] ?? null;
      return {
        enrollment: enrollmentView(row),
        changed: Boolean(row?.changed),
        auditEventId: row?.audit_event_id == null ? null : Number(row.audit_event_id)
      };
    },
    async listEnrollmentAcademicHistory(externalSubject, { courseId } = {}) {
      if (!externalSubject || !courseId) throw new Error('subject and courseId required');
      const result = await queryOrUnavailable(
        query,
        `select event_type, metadata, created_at
           from audit_events
          where subject_type = 'learner'
            and subject_id = $1
            and event_type in ('course-enrollment-academic-completed','course-enrollment-academic-reopened')
            and metadata ->> 'courseId' = $2
          order by created_at asc, id asc`,
        [externalSubject, courseId]
      );
      return (result.rows ?? []).map(historyView);
    }
  };
}
