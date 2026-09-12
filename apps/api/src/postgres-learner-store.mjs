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

function assessmentAttemptRow(row) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    assessmentId: row.assessment_id,
    assessmentVersion: String(row.assessment_version),
    formId: row.form_id,
    formHash: row.form_hash ?? null,
    status: row.status,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    scoredAt: row.scored_at ? new Date(row.scored_at).toISOString() : null,
    scorePercent: row.score_percent == null ? null : Number(row.score_percent),
    passed: row.passed == null ? null : Boolean(row.passed)
  };
}

function performanceAssessmentRow(row) {
  if (!row) return null;
  return {
    assessmentId: row.assessment_id,
    assessmentVersion: String(row.assessment_version),
    status: row.status,
    scorePercent: row.score_percent == null ? null : Number(row.score_percent),
    criticalErrorCount: Number(row.critical_error_count ?? 0),
    evaluatedAt: row.evaluated_at ? new Date(row.evaluated_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

function responseValue(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function attemptItemRow(row) {
  return {
    position: Number(row.position),
    itemId: row.item_id,
    itemVersion: Number(row.item_version),
    competency: row.competency_id,
    response: responseValue(row.response_json),
    score: row.score == null ? null : Number(row.score),
    maxScore: Number(row.max_score ?? 1)
  };
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

  async function itemRows(attemptId) {
    const result = await queryOrUnavailable(
      query,
      `select position, item_id, item_version, competency_id, response_json, score, max_score
         from assessment_attempt_items
        where attempt_id = $1
        order by position`,
      [attemptId]
    );
    return (result.rows ?? []).map(attemptItemRow);
  }

  async function attemptForSubject(externalSubject, attemptId) {
    const result = await queryOrUnavailable(
      query,
      `select a.id, a.assessment_id, a.assessment_version, a.form_id, a.form_hash, a.status,
              a.started_at, a.submitted_at, a.scored_at, a.score_percent, a.passed
         from learners l
         join assessment_attempts a on a.learner_id = l.id
        where l.external_subject = $1 and a.id = $2
        limit 1`,
      [externalSubject, attemptId]
    );
    const attempt = assessmentAttemptRow(result.rows?.[0]);
    if (!attempt) return null;
    return { ...attempt, learnerId: externalSubject, items: await itemRows(attempt.id) };
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
    async findOpenAssessmentAttempt(externalSubject, { assessmentId } = {}) {
      if (!assessmentId) throw new Error('assessmentId required');
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) return null;
      const result = await queryOrUnavailable(
        query,
        `select id, assessment_id, assessment_version, form_id, form_hash, status,
                started_at, submitted_at, scored_at, score_percent, passed
           from assessment_attempts
          where learner_id = $1 and assessment_id = $2 and status in ('started','submitted')
          order by started_at desc
          limit 1`,
        [learnerId, assessmentId]
      );
      const attempt = assessmentAttemptRow(result.rows?.[0]);
      if (!attempt) return null;
      return { ...attempt, learnerId: externalSubject, items: await itemRows(attempt.id) };
    },
    async getAssessmentAttempt(externalSubject, { attemptId } = {}) {
      if (!attemptId) throw new Error('attemptId required');
      return attemptForSubject(externalSubject, attemptId);
    },
    async createAssessmentAttempt(externalSubject, { attempt } = {}) {
      if (!attempt?.id || !attempt.assessmentId || !attempt.formId || !Array.isArray(attempt.items) || !attempt.items.length) throw new Error('attempt required');
      const learner = await ensureLearner(externalSubject);
      if (!learner?.id) throw new Error('learner-resolution-failed');
      const input = attempt.items.map((row) => ({
        position: Number(row.position),
        item_id: row.itemId,
        item_version: Number(row.itemVersion),
        competency_id: row.competency,
        response_json: row.response ?? null,
        score: row.score ?? null,
        max_score: Number(row.maxScore ?? 1)
      }));
      const result = await queryOrUnavailable(
        query,
        `with inserted as (
           insert into assessment_attempts
             (id, learner_id, assessment_id, assessment_version, form_id, form_hash, status, started_at, submitted_at, scored_at, score_percent, passed)
           values ($1, $2, $3, $4, $5, $6, 'started', $7, null, null, null, null)
           returning id
         ), input as (
           select * from jsonb_to_recordset($8::jsonb) as x(
             position integer, item_id text, item_version integer, competency_id text,
             response_json jsonb, score numeric, max_score numeric
           )
         )
         insert into assessment_attempt_items
           (attempt_id, position, item_id, item_version, competency_id, response_json, score, max_score)
         select inserted.id, input.position, input.item_id, input.item_version, input.competency_id,
                input.response_json, input.score, input.max_score
           from inserted cross join input
         returning attempt_id`,
        [attempt.id, learner.id, attempt.assessmentId, String(attempt.assessmentVersion), attempt.formId, attempt.formHash, attempt.startedAt, JSON.stringify(input)]
      );
      if ((result.rows ?? []).length !== input.length) throw new Error('assessment-attempt-item-write-mismatch');
      return { ...attempt, learnerId: externalSubject };
    },
    async saveAssessmentResponses(externalSubject, { attemptId, responses } = {}) {
      if (!attemptId || !Array.isArray(responses) || !responses.length) throw new Error('attemptId and responses required');
      const input = responses.map((row) => ({ item_id: row.itemId, item_version: Number(row.itemVersion), response_json: row.response }));
      const result = await queryOrUnavailable(
        query,
        `with owned as (
           select a.id
             from assessment_attempts a
             join learners l on l.id = a.learner_id
            where a.id = $1 and l.external_subject = $2 and a.status = 'started'
         ), input as (
           select * from jsonb_to_recordset($3::jsonb) as x(item_id text, item_version integer, response_json jsonb)
         ), updated as (
           update assessment_attempt_items ai
              set response_json = input.response_json
             from input, owned
            where ai.attempt_id = owned.id
              and ai.item_id = input.item_id
              and ai.item_version = input.item_version
           returning ai.item_id
         )
         select count(*)::integer as count from updated`,
        [attemptId, externalSubject, JSON.stringify(input)]
      );
      const count = Number(result.rows?.[0]?.count ?? 0);
      if (count !== input.length) throw new Error('assessment-response-write-mismatch');
      return { attemptId, saved: count };
    },
    async saveAssessmentScore(externalSubject, { attempt } = {}) {
      if (!attempt?.id || attempt.status !== 'scored' || !Array.isArray(attempt.items) || !attempt.items.length) throw new Error('scored attempt required');
      const input = attempt.items.map((row) => ({
        position: Number(row.position),
        item_id: row.itemId,
        item_version: Number(row.itemVersion),
        competency_id: row.competency,
        response_json: row.response,
        score: Number(row.score ?? 0),
        max_score: Number(row.maxScore ?? 1)
      }));
      const result = await queryOrUnavailable(
        query,
        `with owned as (
           select a.id
             from assessment_attempts a
             join learners l on l.id = a.learner_id
            where a.id = $1 and l.external_subject = $2 and a.status = 'started'
         ), input as (
           select * from jsonb_to_recordset($3::jsonb) as x(
             position integer, item_id text, item_version integer, competency_id text,
             response_json jsonb, score numeric, max_score numeric
           )
         ), updated_items as (
           update assessment_attempt_items ai
              set response_json = input.response_json,
                  score = input.score,
                  competency_id = input.competency_id,
                  max_score = input.max_score
             from input, owned
            where ai.attempt_id = owned.id
              and ai.position = input.position
              and ai.item_id = input.item_id
              and ai.item_version = input.item_version
           returning ai.position
         ), finalized as (
           update assessment_attempts a
              set status = 'scored', submitted_at = $4, scored_at = $5, score_percent = $6, passed = $7
             from owned
            where a.id = owned.id and (select count(*) from updated_items) = $8
           returning a.id, a.assessment_id, a.assessment_version, a.form_id, a.form_hash, a.status,
                     a.started_at, a.submitted_at, a.scored_at, a.score_percent, a.passed
         )
         select * from finalized`,
        [attempt.id, externalSubject, JSON.stringify(input), attempt.submittedAt, attempt.scoredAt, Number(attempt.scorePercent), Boolean(attempt.passed), input.length]
      );
      const saved = assessmentAttemptRow(result.rows?.[0]);
      if (!saved) throw new Error('assessment-score-write-conflict');
      return { ...saved, learnerId: externalSubject, items: attempt.items };
    },
    async listCourseEvidence(externalSubject, { assessmentId, performanceAssessmentId = null } = {}) {
      if (!assessmentId) throw new Error('assessmentId required');
      const learnerId = await learnerIdForSubject(externalSubject);
      if (!learnerId) {
        return { learnerId: externalSubject, assessmentAttempts: [], performanceAssessment: null };
      }

      const attemptsResult = await queryOrUnavailable(
        query,
        `select assessment_id, assessment_version, form_id, status, started_at, submitted_at, scored_at, score_percent, passed
           from assessment_attempts
          where learner_id = $1 and assessment_id = $2
          order by started_at desc`,
        [learnerId, assessmentId]
      );
      const assessmentAttempts = (attemptsResult.rows ?? []).map(assessmentAttemptRow);

      let performanceAssessment = null;
      if (performanceAssessmentId) {
        const performanceResult = await queryOrUnavailable(
          query,
          `select assessment_id, assessment_version, status, score_percent, critical_error_count, evaluated_at, updated_at
             from performance_assessment_results
            where learner_id = $1 and assessment_id = $2
            order by updated_at desc
            limit 1`,
          [learnerId, performanceAssessmentId]
        );
        performanceAssessment = performanceAssessmentRow(performanceResult.rows?.[0] ?? null);
      }

      return { learnerId: externalSubject, assessmentAttempts, performanceAssessment };
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
      const assessmentAttempts = (attemptsResult.rows ?? []).map(assessmentAttemptRow);
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
        `select assessment_id, assessment_version, status, score_percent, critical_error_count, evaluated_at, updated_at
           from performance_assessment_results
          where learner_id = $1
          order by assessment_id, updated_at desc`,
        [learnerId]
      );
      const performanceAssessments = (performanceResult.rows ?? []).map(performanceAssessmentRow);

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