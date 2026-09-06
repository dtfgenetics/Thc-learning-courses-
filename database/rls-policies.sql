-- THC Academy PostgreSQL row-level-security policy candidate.
-- This file is intentionally NOT counted as deployed RLS readiness.
-- Apply only after staging role design, migrations, and live authorization tests exist.
-- Learner identity must be established by a trusted server before setting thc.learner_id.
-- End users must never receive direct database credentials.

create schema if not exists thc_app;

create or replace function thc_app.current_learner_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('thc.learner_id', true), '')::uuid
$$;

alter table learners enable row level security;
alter table learners force row level security;
alter table enrollments enable row level security;
alter table enrollments force row level security;
alter table lesson_progress enable row level security;
alter table lesson_progress force row level security;
alter table assessment_attempts enable row level security;
alter table assessment_attempts force row level security;
alter table assessment_attempt_items enable row level security;
alter table assessment_attempt_items force row level security;
alter table learner_competencies enable row level security;
alter table learner_competencies force row level security;

create policy learner_self_read on learners
  for select
  using (id = thc_app.current_learner_id());

create policy enrollment_self_read on enrollments
  for select
  using (learner_id = thc_app.current_learner_id());

create policy lesson_progress_self_read on lesson_progress
  for select
  using (learner_id = thc_app.current_learner_id());

create policy assessment_attempt_self_read on assessment_attempts
  for select
  using (learner_id = thc_app.current_learner_id());

create policy assessment_attempt_item_self_read on assessment_attempt_items
  for select
  using (
    exists (
      select 1
        from assessment_attempts a
       where a.id = assessment_attempt_items.attempt_id
         and a.learner_id = thc_app.current_learner_id()
    )
  );

create policy learner_competency_self_read on learner_competencies
  for select
  using (learner_id = thc_app.current_learner_id());

-- Deliberately no learner-facing INSERT/UPDATE/DELETE policies are defined here.
-- Progress, assessment scoring, mastery, and credential state changes are server-side operations.
-- Production service/admin database roles and privileges must be designed and tested separately.
