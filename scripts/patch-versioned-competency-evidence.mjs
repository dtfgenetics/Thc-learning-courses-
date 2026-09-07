import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const index = source.indexOf(before);
  if (index === -1) throw new Error(`patch target not found: ${label}`);
  if (source.indexOf(before, index + before.length) !== -1) throw new Error(`patch target is not unique: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
}

function replaceAll(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`patch target not found: ${label}`);
  return source.split(before).join(after);
}

const learnerPath = 'apps/api/src/postgres-learner-store.mjs';
let learner = fs.readFileSync(learnerPath, 'utf8');
learner = replaceOnce(
  learner,
  "import { PersistenceUnavailableError } from './persistence-errors.mjs';\n",
  "import { PersistenceUnavailableError } from './persistence-errors.mjs';\nimport { competencyResults } from '../../../packages/domain/assessment-runtime.mjs';\n",
  'learner competencyResults import'
);
learner = replaceOnce(
  learner,
  "      competency: item.competency_id,\n      response: item.response_json ?? null,",
  "      competency: item.competency_id,\n      competencyVersion: item.competency_version == null ? null : String(item.competency_version),\n      response: item.response_json ?? null,",
  'attempt row competency version'
);
learner = replaceOnce(
  learner,
  '`select position, item_id, item_version, competency_id, response_json, score, max_score\n',
  '`select position, item_id, item_version, competency_id, competency_version, response_json, score, max_score\n',
  'attempt item select competency version'
);
learner = replaceOnce(
  learner,
  "      if (!String(item.competency ?? '').trim()) throw new Error('competency required');\n",
  "      if (!String(item.competency ?? '').trim()) throw new Error('competency required');\n      if (!String(item.competencyVersion ?? '').trim()) throw new Error('competency version required');\n",
  'attempt create competency version validation'
);
learner = replaceOnce(
  learner,
  "          `insert into assessment_attempt_items (\n             attempt_id, position, item_id, item_version, competency_id, response_json, score, max_score\n           ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,\n          [attempt.id, Number(item.position), item.itemId, Number(item.itemVersion), item.competency, item.response == null ? null : JSON.stringify(item.response), item.score ?? null, Number(item.maxScore ?? 1)]",
  "          `insert into assessment_attempt_items (\n             attempt_id, position, item_id, item_version, competency_id, competency_version, response_json, score, max_score\n           ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,\n          [attempt.id, Number(item.position), item.itemId, Number(item.itemVersion), item.competency, String(item.competencyVersion), item.response == null ? null : JSON.stringify(item.response), item.score ?? null, Number(item.maxScore ?? 1)]",
  'attempt item insert competency version'
);
learner = replaceOnce(
  learner,
  "    if (typeof attempt.passed !== 'boolean') throw new Error('passed boolean required');\n    return requireTransaction()(async (runQuery) => {",
  "    if (typeof attempt.passed !== 'boolean') throw new Error('passed boolean required');\n    for (const item of attempt.items) {\n      if (!String(item.competencyVersion ?? '').trim()) throw new Error(`competency version required:${item.competency ?? item.itemId}`);\n    }\n    return requireTransaction()(async (runQuery) => {",
  'scored attempt competency version validation'
);
learner = replaceOnce(
  learner,
  "      if (parent.rowCount !== 1) throw new Error('assessment-attempt-transition-conflict');\n      return loadAssessmentAttempt(runQuery, externalSubject, attempt.id);\n    });\n  },\n    async recordPerformanceAssessmentResult",
  "      if (parent.rowCount !== 1) throw new Error('assessment-attempt-transition-conflict');\n      for (const mastery of competencyResults(attempt)) {\n        if (!mastery.competencyVersion) throw new Error(`competency version required:${mastery.competency}`);\n        await queryOrUnavailable(\n          runQuery,\n          `insert into learner_competencies (\n             learner_id, competency_id, curriculum_version, mastery_level, evidence_attempt_id, updated_at\n           ) values ($1, $2, $3, $4, $5, $6)\n           on conflict (learner_id, competency_id, curriculum_version)\n           do update set\n             mastery_level = excluded.mastery_level,\n             evidence_attempt_id = excluded.evidence_attempt_id,\n             updated_at = excluded.updated_at\n           where\n             (case excluded.mastery_level when 'demonstrated' then 2 when 'developing' then 1 else 0 end) >=\n             (case learner_competencies.mastery_level when 'demonstrated' then 2 when 'developing' then 1 else 0 end)`,\n          [learnerId, mastery.competency, String(mastery.competencyVersion), mastery.masteryLevel, attempt.id, attempt.scoredAt]\n        );\n      }\n      return loadAssessmentAttempt(runQuery, externalSubject, attempt.id);\n    });\n  },\n    async recordPerformanceAssessmentResult",
  'mastery upsert after scoring'
);
fs.writeFileSync(learnerPath, learner);

const schemaPath = 'database/schema.sql';
let schema = fs.readFileSync(schemaPath, 'utf8');
schema = replaceOnce(
  schema,
  "  competency_id text not null,\n  response_json jsonb,",
  "  competency_id text not null,\n  competency_version text,\n  response_json jsonb,",
  'schema attempt item competency version'
);
schema += "\n\n-- Schema v5: immutable competency-version provenance for scored assessment evidence.\n-- Legacy attempt rows remain NULL because their historical competency version cannot be reconstructed safely.\nalter table assessment_attempt_items add column if not exists competency_version text;\n\ninsert into academy_schema_migrations (version, description)\nvalues ('5', 'Versioned competency evidence and mastery persistence')\non conflict (version) do nothing;\n";
fs.writeFileSync(schemaPath, schema);

const persistenceTestPath = 'scripts/test-assessment-attempt-persistence.mjs';
let persistenceTest = fs.readFileSync(persistenceTestPath, 'utf8');
persistenceTest = replaceOnce(
  persistenceTest,
  "    const [attemptId, position, itemId, itemVersion, competencyId, responseJson, score, maxScore] = params;",
  "    const [attemptId, position, itemId, itemVersion, competencyId, competencyVersion, responseJson, score, maxScore] = params;",
  'fake item insert params'
);
persistenceTest = replaceOnce(
  persistenceTest,
  "      competency_id: competencyId,\n      response_json: responseJson == null ? null : JSON.parse(responseJson),",
  "      competency_id: competencyId,\n      competency_version: competencyVersion,\n      response_json: responseJson == null ? null : JSON.parse(responseJson),",
  'fake item competency version row'
);
persistenceTest = replaceOnce(
  persistenceTest,
  "  if (sql.startsWith('select position, item_id, item_version, competency_id, response_json, score, max_score from assessment_attempt_items')) {",
  "  if (sql.startsWith('select position, item_id, item_version, competency_id, competency_version, response_json, score, max_score from assessment_attempt_items')) {",
  'fake item select with competency version'
);
persistenceTest = replaceOnce(
  persistenceTest,
  "  if (sql.startsWith('update assessment_attempts') && sql.includes(\"set status = 'scored'\")) {",
  "  if (sql.startsWith('insert into learner_competencies')) return { rowCount: 1, rows: [] };\n  if (sql.startsWith('update assessment_attempts') && sql.includes(\"set status = 'scored'\")) {",
  'fake mastery insert'
);
persistenceTest = replaceAll(
  persistenceTest,
  "competency: 'COMP-ENV-VPD-001', response:",
  "competency: 'COMP-ENV-VPD-001', competencyVersion: '1.0.0', response:",
  'environment fixture competency version'
);
persistenceTest = replaceAll(
  persistenceTest,
  "competency: 'COMP-WATER-001', response:",
  "competency: 'COMP-WATER-001', competencyVersion: '1.0.0', response:",
  'water fixture competency version'
);
persistenceTest = replaceOnce(
  persistenceTest,
  "assert.equal(stored.items[0].competency, 'COMP-ENV-VPD-001');",
  "assert.equal(stored.items[0].competency, 'COMP-ENV-VPD-001');\nassert.equal(stored.items[0].competencyVersion, '1.0.0');",
  'persisted competency version assertion'
);
fs.writeFileSync(persistenceTestPath, persistenceTest);

const schemaTestPath = 'scripts/test-database-schema-readiness.mjs';
let schemaTest = fs.readFileSync(schemaTestPath, 'utf8');
schemaTest = replaceOnce(
  schemaTest,
  "  \"values ('4', 'Credential suspension and lifecycle history support')\"\n])",
  "  \"values ('4', 'Credential suspension and lifecycle history support')\",\n  'competency_version text',\n  \"values ('5', 'Versioned competency evidence and mastery persistence')\"\n])",
  'schema v5 fragments'
);
schemaTest = replaceAll(schemaTest, "schema v4 contract fragment", "schema v5 contract fragment", 'schema test message');
schemaTest = replaceAll(schemaTest, "requiredSchemaVersion: '4'", "requiredSchemaVersion: '5'", 'readiness required schema version');
schemaTest = replaceOnce(schemaTest, "const matching = await requestReadiness('4');", "const matching = await requestReadiness('5');", 'readiness matching version');
schemaTest = replaceOnce(schemaTest, "assert.equal(matching.body.schemaVersion, '4');", "assert.equal(matching.body.schemaVersion, '5');", 'readiness response version');
schemaTest = replaceOnce(schemaTest, "const stale = await requestReadiness('3');", "const stale = await requestReadiness('4');", 'readiness stale version');
schemaTest = replaceOnce(schemaTest, "assert.equal(stale.body.requiredSchemaVersion, '4');", "assert.equal(stale.body.requiredSchemaVersion, '5');", 'stale required version');
schemaTest = replaceOnce(schemaTest, "assert.equal(stale.body.actualSchemaVersion, '3');", "assert.equal(stale.body.actualSchemaVersion, '4');", 'stale actual version');
schemaTest = replaceOnce(schemaTest, "console.log('Database schema v4 lifecycle and readiness gate passed.');", "console.log('Database schema v5 competency evidence and readiness gate passed.');", 'schema test completion');
fs.writeFileSync(schemaTestPath, schemaTest);

const bootstrapTestPath = 'scripts/test-production-bootstrap.mjs';
let bootstrapTest = fs.readFileSync(bootstrapTestPath, 'utf8');
bootstrapTest = replaceAll(bootstrapTest, "THC_REQUIRED_SCHEMA_VERSION: '4'", "THC_REQUIRED_SCHEMA_VERSION: '5'", 'bootstrap schema env');
bootstrapTest = replaceOnce(bootstrapTest, "assert.equal(await options.credentialStore.schemaVersion(), '4');", "assert.equal(await options.credentialStore.schemaVersion(), '5');", 'bootstrap store version');
bootstrapTest = replaceOnce(bootstrapTest, "assert.equal(options.requiredSchemaVersion, '4');", "assert.equal(options.requiredSchemaVersion, '5');", 'bootstrap required version');
bootstrapTest = replaceOnce(bootstrapTest, "Production schema v4 persistence", "Production schema v5 persistence", 'bootstrap message');
fs.writeFileSync(bootstrapTestPath, bootstrapTest);

const fixturePath = 'scripts/fixtures/test-persistence-adapter.mjs';
let fixture = fs.readFileSync(fixturePath, 'utf8');
fixture = replaceOnce(fixture, "async schemaVersion() { return '4'; }", "async schemaVersion() { return '5'; }", 'fixture schema version');
fs.writeFileSync(fixturePath, fixture);

const prodPersistencePath = 'scripts/test-production-persistence-adapter.mjs';
let prodPersistence = fs.readFileSync(prodPersistencePath, 'utf8');
prodPersistence = replaceOnce(prodPersistence, "return { rows: [{ version: '4' }] };", "return { rows: [{ version: '5' }] };", 'production persistence fake schema');
prodPersistence = replaceOnce(prodPersistence, "assert.equal(await adapters.credentialStore.schemaVersion(), '4');", "assert.equal(await adapters.credentialStore.schemaVersion(), '5');", 'production persistence expected schema');
fs.writeFileSync(prodPersistencePath, prodPersistence);

const packagePath = 'package.json';
let pkg = fs.readFileSync(packagePath, 'utf8');
pkg = replaceOnce(
  pkg,
  '    "assessment:delivery:test": "node scripts/test-assessment-delivery-service.mjs",\n    "assessment:policy:test": "node scripts/test-assessment-attempt-policy.mjs",',
  '    "assessment:delivery:test": "node scripts/test-assessment-delivery-service.mjs",\n    "assessment:competency-version:test": "node scripts/test-versioned-competency-evidence.mjs",\n    "assessment:competency-persistence:test": "node scripts/test-competency-mastery-persistence.mjs",\n    "assessment:policy:test": "node scripts/test-assessment-attempt-policy.mjs",',
  'package competency evidence scripts'
);
pkg = replaceOnce(
  pkg,
  'npm run assessment:persistence:test && npm run assessment:delivery:test && npm run assessment:policy:test',
  'npm run assessment:persistence:test && npm run assessment:delivery:test && npm run assessment:competency-version:test && npm run assessment:competency-persistence:test && npm run assessment:policy:test',
  'package competency evidence full test chain'
);
fs.writeFileSync(packagePath, pkg);

console.log('Versioned competency evidence patch applied.');
