import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const adminUrl = String(process.env.DATABASE_URL ?? '').trim();
if (!adminUrl) throw new Error('DATABASE_URL is required');

const admin = new Pool({ connectionString: adminUrl, ssl: false });
const roleName = 'thc_rls_reader_test';
const rolePassword = 'thc_rls_reader_test_password';
const learnerA = crypto.randomUUID();
const learnerB = crypto.randomUUID();
const enrollmentA = crypto.randomUUID();
const enrollmentB = crypto.randomUUID();

try {
  await admin.query(`drop role if exists ${roleName}`);
  await admin.query(`create role ${roleName} login password '${rolePassword}' nobypassrls`);
  await admin.query(`grant usage on schema public, thc_app to ${roleName}`);
  await admin.query(`grant execute on function thc_app.current_learner_id() to ${roleName}`);
  for (const table of [
    'learners', 'enrollments', 'lesson_progress', 'assessment_attempts',
    'assessment_attempt_items', 'learner_competencies',
    'performance_assessment_results', 'learner_portfolio_artifacts'
  ]) {
    await admin.query(`grant select on ${table} to ${roleName}`);
  }

  await admin.query('insert into learners (id, external_subject) values ($1, $2), ($3, $4)', [
    learnerA, 'rls-learner-a', learnerB, 'rls-learner-b'
  ]);
  await admin.query(
    `insert into enrollments (id, learner_id, course_id, course_version, status)
     values ($1, $2, 'COURSE-CULT-FOUNDATIONS-001', '1.0.0', 'active'),
            ($3, $4, 'COURSE-CULT-FOUNDATIONS-001', '1.0.0', 'active')`,
    [enrollmentA, learnerA, enrollmentB, learnerB]
  );
  await admin.query(
    `insert into lesson_progress (learner_id, lesson_id, lesson_version, status)
     values ($1, 'LESSON-PLANT-BIO-001', '1.0.0', 'completed'),
            ($2, 'LESSON-ENV-VPD-001', '1.0.0', 'completed')`,
    [learnerA, learnerB]
  );

  const parsed = new URL(adminUrl);
  parsed.username = roleName;
  parsed.password = rolePassword;
  const reader = new Pool({ connectionString: parsed.toString(), ssl: false });
  try {
    let result = await reader.query('select id from learners order by id');
    assert.equal(result.rowCount, 0, 'no learner context must expose zero learner rows');
    result = await reader.query('select learner_id from enrollments');
    assert.equal(result.rowCount, 0, 'no learner context must expose zero enrollment rows');

    await reader.query("select set_config('thc.learner_id', $1, false)", [learnerA]);
    result = await reader.query('select id, external_subject from learners');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].id, learnerA);
    assert.equal(result.rows[0].external_subject, 'rls-learner-a');
    result = await reader.query('select learner_id, course_id from enrollments');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].learner_id, learnerA);
    result = await reader.query('select learner_id, lesson_id from lesson_progress');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].learner_id, learnerA);
    assert.equal(result.rows[0].lesson_id, 'LESSON-PLANT-BIO-001');

    await reader.query("select set_config('thc.learner_id', $1, false)", [learnerB]);
    result = await reader.query('select id, external_subject from learners');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].id, learnerB);
    result = await reader.query('select learner_id, lesson_id from lesson_progress');
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].learner_id, learnerB);
    assert.equal(result.rows[0].lesson_id, 'LESSON-ENV-VPD-001');

    await assert.rejects(
      () => reader.query(
        `insert into enrollments (id, learner_id, course_id, course_version, status)
         values ($1, $2, 'COURSE-CULT-FOUNDATIONS-001', '1.0.0', 'active')`,
        [crypto.randomUUID(), learnerB]
      ),
      /permission denied|row-level security/i,
      'learner read role must not gain write access'
    );
  } finally {
    await reader.end();
  }

  console.log('Live PostgreSQL RLS learner-isolation policy test passed.');
} finally {
  await admin.query('delete from lesson_progress where learner_id = any($1::uuid[])', [[learnerA, learnerB]]).catch(() => {});
  await admin.query('delete from enrollments where learner_id = any($1::uuid[])', [[learnerA, learnerB]]).catch(() => {});
  await admin.query('delete from learners where id = any($1::uuid[])', [[learnerA, learnerB]]).catch(() => {});
  await admin.query(`drop role if exists ${roleName}`).catch(() => {});
  await admin.end();
}
