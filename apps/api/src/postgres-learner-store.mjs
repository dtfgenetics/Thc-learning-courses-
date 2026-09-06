import crypto from 'node:crypto';
import { PersistenceUnavailableError } from './persistence-errors.mjs';

async function queryOrUnavailable(query, text, params) {
  try { return await query(text, params); }
  catch (error) { throw new PersistenceUnavailableError('persistence-unavailable', { cause: error }); }
}

function enrollmentRow(row) {
  if (!row) return null;
  return {
    courseId: row.course_id,
    courseVersion: String(row.course_version),
    status: row.status,
    enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null
  };
}

function performanceEvidenceVerified(row) {
  return Boolean(
    String(row?.evaluator_id ?? '').trim() &&
    row?.evaluated_at &&
    String(row?.rubric_id ?? '').trim() &&
    String(row?.rubric_version ?? '').trim() &&
    ['virtual-facility', 'supervised-lab', 'workplace-equivalent'].includes(String(row?.delivery_mode ?? ''))
  );
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

  async function learnerIdForSubject(externalSubject) {
    const result = await queryOrUnavailable(
      query,
      `select id from learners where external_subject = $1 limit 1`,
      [externalSubject]
    );
    return result.rows?.[0]?.id ?? null;
  }

  return {
    kind: 'postgres-learner-runtime',
    async listEnrollments(externalSubject) {
      const result = await queryOrUnavailable(
        query,
        `select e.course_id, e.course_version, e.status, e.enrolled_at, e.completed_at
           from learners l
           join enrollments e on e.learner_id = l.id
          where l.external_subject = $1
          order by e.enrolled_at desc, e.course_id, e.course_version`,
        [externalSubject]
      );
      return (result.rows ?? []).map(enrollmentRow);
    },
    async enroll(externalSubject, { courseId, courseVersion } = {}) {
      if (!courseId) throw new Error('courseId required');
      if (!courseVersion) throw new Error('courseVersion required');
      const learner = await ensureLearner(externalSubject);
      if (!learner?.id) throw new Error('learner-resolution-failed');
      const enrollmentId = crypto.randomUUID();
      const result = await queryOrUnavailable(
        query,
        `insert into enrollments (id, learner_id, course_id, course_version, status)
         values ($1, $2, $3, $4, 'active')
         on conflict (learner_id, course_id, course_version)
         do update set course_id = excluded.course_id
         returning course_id, course_version, status, enrolled_at, completed_at`,
        [enrollmentId, learner.id, courseId, String(courseVersion)]
      );
      return enrollmentRow(result.rows?.[0] ?? null);
    },
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
    },
    async listCredentialEvidence(externalSubject, { credentialDefinitionId } = {}) {
      if (!credentialDefinitionId) throw new Error('credentialDefinitionId required');
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) {
        return { learnerId: externalSubject, assessmentAttempts: [], assessments: [], competencies: [], performanceAssessments: [], portfolioArtifacts: [] };
      }

      const attemptsResult = await queryOrUnavailable(
        query,
        `select assessment_id, assessment_version, form_id, status, started_at, submitted_at, scored_at, score_percent, passed
           from assessment_attempts
          where learner_id = $1
          order by started_at desc`,
        [learnerId]
      );
      const assessmentAttempts = (attemptsResult.rows ?? []).map((row) => ({
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
      const bestByAssessment = new Map();
      for (const attempt of assessmentAttempts) {
        if (attempt.status !== 'scored') continue;
        const current = bestByAssessment.get(attempt.assessmentId);
        if (!current || Number(attempt.scorePercent ?? -1) > Number(current.scorePercent ?? -1)) bestByAssessment.set(attempt.assessmentId, attempt);
      }
      const assessments = [...bestByAssessment.values()].map((attempt) => ({
        assessmentId: attempt.assessmentId,
        status: attempt.passed ? 'passed' : 'failed',
        scorePercent: attempt.scorePercent
      }));

      const competencyResult = await queryOrUnavailable(
        query,
        `select competency_id, curriculum_version, mastery_level, evidence_attempt_id, updated_at
           from learner_competencies
          where learner_id = $1
          order by competency_id, curriculum_version desc`,
        [learnerId]
      );
      const competencies = (competencyResult.rows ?? []).map((row) => ({
        competencyId: row.competency_id,
        curriculumVersion: String(row.curriculum_version),
        masteryLevel: row.mastery_level,
        evidenceAttemptId: row.evidence_attempt_id ?? null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
      }));

      const performanceResult = await queryOrUnavailable(
        query,
        `select assessment_id, assessment_version, status, score_percent, critical_error_count,
                evaluator_id, rubric_id, rubric_version, delivery_mode, evaluated_at, updated_at
           from performance_assessment_results
          where learner_id = $1
          order by assessment_id, updated_at desc`,
        [learnerId]
      );
      const performanceAssessments = (performanceResult.rows ?? []).map((row) => ({
        assessmentId: row.assessment_id,
        assessmentVersion: String(row.assessment_version),
        status: row.status,
        scorePercent: row.score_percent == null ? null : Number(row.score_percent),
        criticalErrorCount: Number(row.critical_error_count ?? 0),
        evidenceVerified: performanceEvidenceVerified(row),
        rubricId: row.rubric_id ?? null,
        rubricVersion: row.rubric_version == null ? null : String(row.rubric_version),
        deliveryMode: row.delivery_mode ?? null,
        evaluatedAt: row.evaluated_at ? new Date(row.evaluated_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
      }));

      const portfolioResult = await queryOrUnavailable(
        query,
        `select artifact_id, status, reviewed_at, updated_at
           from learner_portfolio_artifacts
          where learner_id = $1 and credential_definition_id = $2
          order by artifact_id`,
        [learnerId, credentialDefinitionId]
      );
      const portfolioArtifacts = (portfolioResult.rows ?? []).map((row) => ({
        artifactId: row.artifact_id,
        status: row.status,
        reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
      }));

      return { learnerId: externalSubject, assessmentAttempts, assessments, competencies, performanceAssessments, portfolioArtifacts };
    }
  };
}
