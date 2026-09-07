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

function performanceRow(row) {
  if (!row) return null;
  return {
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
  };
}

function assessmentAttemptRow(row, itemRows = [], externalSubject = null) {
  if (!row) return null;
  return {
    id: row.id,
    learnerId: externalSubject,
    assessmentId: row.assessment_id,
    assessmentVersion: String(row.assessment_version),
    formId: row.form_id,
    formHash: row.form_hash,
    status: row.status,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    scoredAt: row.scored_at ? new Date(row.scored_at).toISOString() : null,
    scorePercent: row.score_percent == null ? null : Number(row.score_percent),
    passed: row.passed == null ? null : Boolean(row.passed),
    items: itemRows.map((item) => ({
      position: Number(item.position),
      itemId: item.item_id,
      itemVersion: Number(item.item_version),
      competency: item.competency_id,
      response: item.response_json ?? null,
      score: item.score == null ? null : Number(item.score),
      maxScore: Number(item.max_score ?? 1)
    }))
  };
}

export function createPostgresLearnerStore({ query, withTransaction } = {}) {
  if (typeof query !== 'function') throw new Error('PostgreSQL learner store requires a query(text, params) function');
  function requireTransaction() {
  if (typeof withTransaction !== 'function') throw new Error('Assessment attempt writes require withTransaction(callback)');
  return withTransaction;
}

  async function ensureLearner(externalSubject, runQuery = query) {
    if (!externalSubject) throw new Error('externalSubject required');
    const learnerId = crypto.randomUUID();
    const result = await queryOrUnavailable(
      runQuery,
      `insert into learners (id, external_subject)
       values ($1, $2)
       on conflict (external_subject) do update set external_subject = excluded.external_subject
       returning id, external_subject`,
      [learnerId, externalSubject]
    );
    return result.rows?.[0] ?? null;
  }

  async function learnerIdForSubject(externalSubject, runQuery = query) {
    const result = await queryOrUnavailable(
      runQuery,
      `select id from learners where external_subject = $1 limit 1`,
      [externalSubject]
    );
    return result.rows?.[0]?.id ?? null;
  }


  async function loadAssessmentAttempt(runQuery, externalSubject, attemptId) {
    const attemptResult = await queryOrUnavailable(
      runQuery,
      `select a.id, a.assessment_id, a.assessment_version, a.form_id, a.form_hash, a.status,
              a.started_at, a.submitted_at, a.scored_at, a.score_percent, a.passed
         from learners l
         join assessment_attempts a on a.learner_id = l.id
        where l.external_subject = $1 and a.id = $2
        limit 1`,
      [externalSubject, attemptId]
    );
    const row = attemptResult.rows?.[0];
    if (!row) return null;
    const itemResult = await queryOrUnavailable(
      runQuery,
      `select position, item_id, item_version, competency_id, response_json, score, max_score
         from assessment_attempt_items
        where attempt_id = $1
        order by position asc`,
      [attemptId]
    );
    return assessmentAttemptRow(row, itemResult.rows ?? [], externalSubject);
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
    async createAssessmentAttempt(externalSubject, attempt = {}) {
    if (!externalSubject) throw new Error('externalSubject required');
    if (!attempt?.id || !attempt.assessmentId || !attempt.assessmentVersion || !attempt.formId || !attempt.formHash) throw new Error('assessment attempt identity required');
    if (attempt.status !== 'started') throw new Error('new assessment attempt must be started');
    if (!Array.isArray(attempt.items) || attempt.items.length === 0) throw new Error('assessment attempt items required');
    for (const item of attempt.items) {
      if (!item.itemId || item.itemVersion == null) throw new Error('assessment attempt item identity required');
      if (!String(item.competency ?? '').trim()) throw new Error('competency required');
    }
    return requireTransaction()(async (runQuery) => {
      const learner = await ensureLearner(externalSubject, runQuery);
      if (!learner?.id) throw new Error('learner-resolution-failed');
      await queryOrUnavailable(
        runQuery,
        `insert into assessment_attempts (
           id, learner_id, assessment_id, assessment_version, form_id, form_hash, status, started_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id, assessment_id, assessment_version, form_id, form_hash, status,
                   started_at, submitted_at, scored_at, score_percent, passed`,
        [attempt.id, learner.id, attempt.assessmentId, String(attempt.assessmentVersion), attempt.formId, attempt.formHash, 'started', attempt.startedAt ?? new Date().toISOString()]
      );
      for (const item of attempt.items) {
        await queryOrUnavailable(
          runQuery,
          `insert into assessment_attempt_items (
             attempt_id, position, item_id, item_version, competency_id, response_json, score, max_score
           ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
          [attempt.id, Number(item.position), item.itemId, Number(item.itemVersion), item.competency, item.response == null ? null : JSON.stringify(item.response), item.score ?? null, Number(item.maxScore ?? 1)]
        );
      }
      return loadAssessmentAttempt(runQuery, externalSubject, attempt.id);
    });
  },
  async getAssessmentAttempt(externalSubject, attemptId) {
    if (!externalSubject) throw new Error('externalSubject required');
    if (!attemptId) throw new Error('attemptId required');
    return loadAssessmentAttempt(query, externalSubject, attemptId);
  },
  async saveSubmittedAssessmentAttempt(externalSubject, attempt = {}) {
    if (!externalSubject) throw new Error('externalSubject required');
    if (!attempt?.id || attempt.status !== 'submitted' || !attempt.submittedAt) throw new Error('submitted assessment attempt required');
    if (!Array.isArray(attempt.items) || attempt.items.length === 0) throw new Error('assessment attempt items required');
    return requireTransaction()(async (runQuery) => {
      const learnerId = await learnerIdForSubject(externalSubject, runQuery);
      if (!learnerId) throw new Error('assessment-attempt-transition-conflict');
      const parent = await queryOrUnavailable(
        runQuery,
        `update assessment_attempts
            set status = 'submitted', submitted_at = $3
          where id = $1 and learner_id = $2 and status = 'started'
          returning id, assessment_id, assessment_version, form_id, form_hash, status,
                    started_at, submitted_at, scored_at, score_percent, passed`,
        [attempt.id, learnerId, attempt.submittedAt]
      );
      if (parent.rowCount !== 1) throw new Error('assessment-attempt-transition-conflict');
      for (const item of attempt.items) {
        const updated = await queryOrUnavailable(
          runQuery,
          `update assessment_attempt_items
              set response_json = $4::jsonb
            where attempt_id = $1 and item_id = $2 and item_version = $3`,
          [attempt.id, item.itemId, Number(item.itemVersion), item.response == null ? null : JSON.stringify(item.response)]
        );
        if (updated.rowCount !== 1) throw new Error(`assessment-attempt-item-mismatch:${item.itemId}@${item.itemVersion}`);
      }
      return loadAssessmentAttempt(runQuery, externalSubject, attempt.id);
    });
  },
  async saveScoredAssessmentAttempt(externalSubject, attempt = {}) {
    if (!externalSubject) throw new Error('externalSubject required');
    if (!attempt?.id || attempt.status !== 'scored' || !attempt.scoredAt) throw new Error('scored assessment attempt required');
    if (!Array.isArray(attempt.items) || attempt.items.length === 0) throw new Error('assessment attempt items required');
    const scorePercent = Number(attempt.scorePercent);
    if (!Number.isFinite(scorePercent) || scorePercent < 0 || scorePercent > 100) throw new Error('scorePercent must be between 0 and 100');
    if (typeof attempt.passed !== 'boolean') throw new Error('passed boolean required');
    return requireTransaction()(async (runQuery) => {
      const learnerId = await learnerIdForSubject(externalSubject, runQuery);
      if (!learnerId) throw new Error('assessment-attempt-transition-conflict');
      for (const item of attempt.items) {
        if (item.score == null || !Number.isFinite(Number(item.score))) throw new Error(`assessment item score required:${item.itemId}`);
        const updated = await queryOrUnavailable(
          runQuery,
          `update assessment_attempt_items
              set score = $4
            where attempt_id = $1 and item_id = $2 and item_version = $3`,
          [attempt.id, item.itemId, Number(item.itemVersion), Number(item.score)]
        );
        if (updated.rowCount !== 1) throw new Error(`assessment-attempt-item-mismatch:${item.itemId}@${item.itemVersion}`);
      }
      const parent = await queryOrUnavailable(
        runQuery,
        `update assessment_attempts
            set status = 'scored', scored_at = $3, score_percent = $4, passed = $5
          where id = $1 and learner_id = $2 and status = 'submitted'
          returning id, assessment_id, assessment_version, form_id, form_hash, status,
                    started_at, submitted_at, scored_at, score_percent, passed`,
        [attempt.id, learnerId, attempt.scoredAt, scorePercent, attempt.passed]
      );
      if (parent.rowCount !== 1) throw new Error('assessment-attempt-transition-conflict');
      return loadAssessmentAttempt(runQuery, externalSubject, attempt.id);
    });
  },
    async recordPerformanceAssessmentResult(externalSubject, record = {}) {
      if (!externalSubject) throw new Error('externalSubject required');
      for (const field of ['assessmentId', 'assessmentVersion', 'status', 'evaluatorId', 'rubricId', 'rubricVersion', 'deliveryMode']) {
        if (!String(record[field] ?? '').trim()) throw new Error(`${field} required`);
      }
      if (!['passed', 'failed'].includes(record.status)) throw new Error('performance result status must be passed or failed');
      const scorePercent = Number(record.scorePercent);
      const criticalErrorCount = Number(record.criticalErrorCount ?? 0);
      if (!Number.isFinite(scorePercent) || scorePercent < 0 || scorePercent > 100) throw new Error('scorePercent must be between 0 and 100');
      if (!Number.isInteger(criticalErrorCount) || criticalErrorCount < 0) throw new Error('criticalErrorCount must be a non-negative integer');
      const learner = await ensureLearner(externalSubject);
      if (!learner?.id) throw new Error('learner-resolution-failed');
      const evaluatedAt = record.evaluatedAt ?? new Date().toISOString();
      const evidence = record.evidence && typeof record.evidence === 'object' && !Array.isArray(record.evidence) ? record.evidence : {};
      const result = await queryOrUnavailable(
        query,
        `insert into performance_assessment_results (
           learner_id, assessment_id, assessment_version, status, score_percent, critical_error_count,
           evidence_json, evaluator_id, rubric_id, rubric_version, delivery_mode, evaluated_at
         ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)
         on conflict (learner_id, assessment_id, assessment_version)
         do update set
           status = excluded.status,
           score_percent = excluded.score_percent,
           critical_error_count = excluded.critical_error_count,
           evidence_json = excluded.evidence_json,
           evaluator_id = excluded.evaluator_id,
           rubric_id = excluded.rubric_id,
           rubric_version = excluded.rubric_version,
           delivery_mode = excluded.delivery_mode,
           evaluated_at = excluded.evaluated_at,
           updated_at = now()
         returning assessment_id, assessment_version, status, score_percent, critical_error_count,
                   evaluator_id, rubric_id, rubric_version, delivery_mode, evaluated_at, updated_at`,
        [
          learner.id,
          record.assessmentId,
          String(record.assessmentVersion),
          record.status,
          scorePercent,
          criticalErrorCount,
          JSON.stringify(evidence),
          record.evaluatorId,
          record.rubricId,
          String(record.rubricVersion),
          record.deliveryMode,
          evaluatedAt
        ]
      );
      return performanceRow(result.rows?.[0] ?? null);
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
      const performanceAssessments = (performanceResult.rows ?? []).map(performanceRow);

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
