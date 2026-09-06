-- THC Academy runtime schema (PostgreSQL)
-- Curriculum source files remain in Git; learner/runtime records belong in the database.

create table if not exists academy_schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now(),
  description text not null
);

create table if not exists learners (
  id uuid primary key,
  external_subject text not null unique,
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists enrollments (
  id uuid primary key,
  learner_id uuid not null references learners(id),
  course_id text not null,
  course_version text not null,
  status text not null check (status in ('active','completed','withdrawn')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (learner_id, course_id, course_version)
);

create table if not exists lesson_progress (
  learner_id uuid not null references learners(id),
  lesson_id text not null,
  lesson_version text not null,
  status text not null check (status in ('not-started','in-progress','completed')),
  completed_at timestamptz,
  primary key (learner_id, lesson_id, lesson_version)
);

create table if not exists assessment_attempts (
  id uuid primary key,
  learner_id uuid not null references learners(id),
  assessment_id text not null,
  assessment_version text not null,
  form_id text not null,
  form_hash text not null,
  status text not null check (status in ('started','submitted','scored','voided')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  scored_at timestamptz,
  score_percent numeric(5,2),
  passed boolean,
  unique (learner_id, assessment_id, form_id)
);

create table if not exists assessment_attempt_items (
  attempt_id uuid not null references assessment_attempts(id) on delete cascade,
  position integer not null,
  item_id text not null,
  item_version integer not null,
  competency_id text not null,
  response_json jsonb,
  score numeric(8,4),
  max_score numeric(8,4) not null default 1,
  primary key (attempt_id, position),
  unique (attempt_id, item_id, item_version)
);

create table if not exists learner_competencies (
  learner_id uuid not null references learners(id),
  competency_id text not null,
  curriculum_version text not null,
  mastery_level text not null check (mastery_level in ('not-demonstrated','developing','demonstrated')),
  evidence_attempt_id uuid references assessment_attempts(id),
  updated_at timestamptz not null default now(),
  primary key (learner_id, competency_id, curriculum_version)
);

create table if not exists performance_assessment_results (
  learner_id uuid not null references learners(id),
  assessment_id text not null,
  assessment_version text not null,
  status text not null check (status in ('in-progress','passed','failed','voided')),
  score_percent numeric(5,2),
  critical_error_count integer not null default 0 check (critical_error_count >= 0),
  evidence_json jsonb not null default '{}'::jsonb,
  evaluator_id text,
  rubric_id text,
  rubric_version text,
  delivery_mode text check (delivery_mode is null or delivery_mode in ('virtual-facility','supervised-lab','workplace-equivalent')),
  evaluated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (learner_id, assessment_id, assessment_version)
);

create table if not exists learner_portfolio_artifacts (
  learner_id uuid not null references learners(id),
  credential_definition_id text not null,
  artifact_id text not null,
  status text not null check (status in ('draft','submitted','accepted','verified','complete','rejected')),
  evidence_json jsonb not null default '{}'::jsonb,
  reviewer_id text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (learner_id, credential_definition_id, artifact_id)
);

create table if not exists credentials (
  id uuid primary key,
  verification_id text not null unique,
  subject_hash text not null,
  credential_definition_id text not null,
  credential_definition_version text not null,
  course_id text not null,
  course_version text not null,
  status text not null check (status in ('issued','valid','superseded','expired','revoked')),
  issued_at timestamptz not null,
  expires_at timestamptz,
  payload_json jsonb not null,
  payload_hash text not null
);

create table if not exists credential_status_events (
  id bigserial primary key,
  credential_id uuid not null references credentials(id),
  status text not null check (status in ('issued','valid','superseded','expired','revoked')),
  reason text,
  actor_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists review_records (
  id text primary key,
  object_id text not null,
  object_version text not null,
  review_type text not null,
  decision text not null,
  reviewer_id text not null,
  reviewed_at timestamptz not null,
  notes text,
  evidence_checked jsonb not null default '[]'::jsonb
);

create table if not exists audit_events (
  id bigserial primary key,
  event_type text not null,
  actor_id text not null,
  subject_type text not null,
  subject_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attempts_learner_assessment on assessment_attempts(learner_id, assessment_id, started_at desc);
create index if not exists idx_performance_learner_assessment on performance_assessment_results(learner_id, assessment_id, updated_at desc);
create index if not exists idx_portfolio_learner_credential on learner_portfolio_artifacts(learner_id, credential_definition_id, updated_at desc);
create index if not exists idx_credentials_subject on credentials(subject_hash, issued_at desc);
create index if not exists idx_audit_subject on audit_events(subject_type, subject_id, created_at desc);

insert into academy_schema_migrations (version, description)
values ('1', 'Initial THC Academy runtime schema')
on conflict (version) do nothing;

insert into academy_schema_migrations (version, description)
values ('2', 'Learner performance assessment and portfolio evidence')
on conflict (version) do nothing;

alter table performance_assessment_results add column if not exists rubric_id text;
alter table performance_assessment_results add column if not exists rubric_version text;
alter table performance_assessment_results add column if not exists delivery_mode text;

insert into academy_schema_migrations (version, description)
values ('3', 'Performance assessment evaluator, rubric, and delivery provenance')
on conflict (version) do nothing;
