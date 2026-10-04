-- THC Academy private operational assessment store schema (PostgreSQL)
-- Apply only to the isolated secure-assessment database/role. Do not expose this database
-- to learner-facing clients and do not seed operational item content from public Git.

create table if not exists secure_assessment_banks (
  bank_version text primary key,
  credential_program_id text not null,
  status text not null check (status in ('draft','pilot','approved-operational','retired')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  retired_at timestamptz
);

create table if not exists secure_assessment_items (
  secure_item_id text not null check (secure_item_id ~ '^SECITEM-[A-Za-z0-9-]+$'),
  revision integer not null check (revision > 0),
  bank_version text not null references secure_assessment_banks(bank_version),
  competency_id text not null,
  status text not null check (status in ('draft','pilot','approved-operational','quarantined','retired')),
  source_class text not null check (source_class = 'private-operational'),
  prompt text not null,
  choices_json jsonb,
  scoring_key_json jsonb not null,
  rationale text,
  presentation_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  quarantine_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (secure_item_id, revision)
);

create table if not exists secure_assessment_forms (
  form_id text not null,
  form_revision text not null,
  credential_program_id text not null,
  blueprint_version text not null,
  bank_version text not null references secure_assessment_banks(bank_version),
  private_manifest jsonb not null,
  status text not null check (status in ('active','retired','quarantined')),
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  primary key (form_id, form_revision)
);

create table if not exists secure_assessment_exposures (
  id bigserial primary key,
  candidate_ref_hash text not null,
  form_id text not null,
  form_revision text not null,
  item_assignments jsonb not null,
  exposed_at timestamptz not null default now(),
  foreign key (form_id, form_revision) references secure_assessment_forms(form_id, form_revision)
);

create index if not exists idx_secure_bank_program_status
  on secure_assessment_banks(credential_program_id, status, activated_at desc);
create index if not exists idx_secure_items_bank_status
  on secure_assessment_items(bank_version, status, competency_id);
create index if not exists idx_secure_exposure_candidate
  on secure_assessment_exposures(candidate_ref_hash, exposed_at desc);


create table if not exists secure_assessment_admin_audit (
  id bigserial primary key,
  actor_id text not null,
  event_type text not null,
  subject_type text not null,
  subject_id text not null,
  evidence_ref text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_secure_admin_audit_subject
  on secure_assessment_admin_audit(subject_type, subject_id, created_at desc);
create index if not exists idx_secure_admin_audit_actor
  on secure_assessment_admin_audit(actor_id, created_at desc);
