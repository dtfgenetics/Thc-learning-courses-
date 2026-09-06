import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

  const authModule = await import(resolveModuleSpecifier(config.authAdapterModule));
  if (typeof authModule.createRequestAuthorizer !== 'function') throw new Error('Authentication adapter module must export createRequestAuthorizer({ env })');
  const authorize = await authModule.createRequestAuthorizer({ env });
  if (typeof authorize !== 'function') throw new Error('Authentication adapter must return an authorize(req, requiredScope) function');

  return {
    env,
    credentialStore,
    credentialWriter: adapters.credentialWriter ?? null,
    learnerStore: adapters.learnerStore ?? null,
    requiredSchemaVersion: config.requiredSchemaVersion,
    authorize
  };
}
