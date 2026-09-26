import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { addAutomaticEnrollmentCompletion } from './enrollment-completion-adapter.mjs';
import { loadProductionCredentialSigner } from './credential-signing-adapter.mjs';

function required(env, name) {
  const value = String(env[name] ?? '').trim();
  if (!value) throw new Error(`Production configuration requires ${name}`);
  return value;
}

function resolveModuleSpecifier(value) {
  if (value.startsWith('.') || value.startsWith('/')) return pathToFileURL(path.resolve(process.cwd(), value)).href;
  return value;
}

export function validateProductionEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'production') return { mode: 'development' };
  const persistenceAdapterModule = required(env, 'THC_PERSISTENCE_ADAPTER_MODULE');
  const authAdapterModule = required(env, 'THC_AUTH_ADAPTER_MODULE');
  const publicBaseUrl = required(env, 'THC_PUBLIC_BASE_URL');
  const requiredSchemaVersion = required(env, 'THC_REQUIRED_SCHEMA_VERSION');
  let parsed;
  try { parsed = new URL(publicBaseUrl); } catch { throw new Error('THC_PUBLIC_BASE_URL must be a valid URL'); }
  if (parsed.protocol !== 'https:') throw new Error('Production THC_PUBLIC_BASE_URL must use https');
  return { mode: 'production', persistenceAdapterModule, authAdapterModule, publicBaseUrl: parsed.toString(), requiredSchemaVersion };
}

export function enforceProductionAuthAssurance(authorize) {
  if (typeof authorize !== 'function') throw new Error('Production authorizer must be a function');
  return function authorizeWithAssurance(req, requiredScope) {
    const result = authorize(req, requiredScope);
    if (!result?.ok) return result;
    if (String(requiredScope ?? '').startsWith('admin:') && result.mfaVerified !== true) {
      return { ok: false, status: 403, error: 'admin-mfa-required' };
    }
    return result;
  };
}

export async function loadProductionApiOptions(env = process.env) {
  const config = validateProductionEnvironment(env);
  if (config.mode !== 'production') return { env };

  const persistenceModule = await import(resolveModuleSpecifier(config.persistenceAdapterModule));
  if (typeof persistenceModule.createPersistenceAdapters !== 'function') throw new Error('Persistence adapter module must export createPersistenceAdapters({ env })');
  const adapters = await persistenceModule.createPersistenceAdapters({ env });
  const credentialStore = adapters?.credentialStore;
  if (!credentialStore || typeof credentialStore.ping !== 'function' || typeof credentialStore.schemaVersion !== 'function' || typeof credentialStore.getByVerificationId !== 'function') {
    throw new Error('Production persistence adapter must provide credentialStore.ping(), schemaVersion(), and getByVerificationId()');
  }
  const rawLearnerStore = adapters?.learnerStore;
  const requiredLearnerMethods = [
    'listProgress', 'setLessonProgress', 'listEnrollments', 'enroll',
    'listCredentialEvidence', 'listCourseEvidence', 'getPracticalSubmission', 'savePracticalSubmission',
    'findOpenAssessmentAttempt', 'getAssessmentAttempt', 'createAssessmentAttempt',
    'saveAssessmentResponses', 'saveAssessmentScore'
  ];
  if (!rawLearnerStore || requiredLearnerMethods.some((method) => typeof rawLearnerStore[method] !== 'function')) {
    throw new Error('Production persistence adapter must provide learnerStore progress, enrollment, course/credential evidence, and assessment attempt methods');
  }
  const rawPracticalEvaluatorStore = adapters?.practicalEvaluatorStore;
  const requiredPracticalEvaluatorMethods = [
    'listCourseLearners', 'listCourseReportRows', 'getEvaluation', 'saveEvaluation',
    'claimEvaluator', 'releaseEvaluator', 'setEvaluatorAssignment'
  ];
  if (!rawPracticalEvaluatorStore || requiredPracticalEvaluatorMethods.some((method) => typeof rawPracticalEvaluatorStore[method] !== 'function')) {
    throw new Error('Production persistence adapter must provide practical evaluator queue, assignment, reporting, read, and write methods');
  }
  const completionStore = adapters?.enrollmentCompletionStore;
  const requiredCompletionMethods = ['setEnrollmentAcademicStatus', 'listEnrollmentAcademicHistory'];
  if (!completionStore || requiredCompletionMethods.some((method) => typeof completionStore[method] !== 'function')) {
    throw new Error('Production persistence adapter must provide audited enrollment completion synchronization methods');
  }
  const wrapped = addAutomaticEnrollmentCompletion({
    learnerStore: rawLearnerStore,
    practicalEvaluatorStore: rawPracticalEvaluatorStore,
    completionStore
  });

  const credentialWriter = adapters.credentialWriter ?? null;
  if (credentialWriter && (typeof credentialWriter.issueCredential !== 'function' || typeof credentialWriter.transitionById !== 'function')) {
    throw new Error('Production credentialWriter must provide issueCredential() and transitionById()');
  }
  const credentialSigner = env.THC_CREDENTIAL_SIGNER_MODULE
    ? await loadProductionCredentialSigner(env)
    : null;

  const authModule = await import(resolveModuleSpecifier(config.authAdapterModule));
  if (typeof authModule.createRequestAuthorizer !== 'function') throw new Error('Authentication adapter module must export createRequestAuthorizer({ env })');
  const rawAuthorize = await authModule.createRequestAuthorizer({ env });
  if (typeof rawAuthorize !== 'function') throw new Error('Authentication adapter must return an authorize(req, requiredScope) function');
  const authorize = enforceProductionAuthAssurance(rawAuthorize);

  return {
    env,
    credentialStore,
    credentialWriter,
    credentialSigner,
    learnerStore: wrapped.learnerStore,
    practicalEvaluatorStore: wrapped.practicalEvaluatorStore,
    enrollmentCompletionStore: completionStore,
    requiredSchemaVersion: config.requiredSchemaVersion,
    authorize
  };
}
