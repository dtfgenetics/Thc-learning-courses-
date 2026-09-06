import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServiceTokenAuthorizer, serviceTokensFromEnvironment, MIN_SERVICE_TOKEN_LENGTH } from './security.mjs';

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

  const adapterModule = required(env, 'THC_PERSISTENCE_ADAPTER_MODULE');
  const publicBaseUrl = required(env, 'THC_PUBLIC_BASE_URL');
  const adminToken = required(env, 'THC_API_ADMIN_TOKEN');

  let parsed;
  try { parsed = new URL(publicBaseUrl); } catch { throw new Error('THC_PUBLIC_BASE_URL must be a valid URL'); }
  if (parsed.protocol !== 'https:') throw new Error('Production THC_PUBLIC_BASE_URL must use https');
  if (adminToken.length < MIN_SERVICE_TOKEN_LENGTH) {
    throw new Error(`THC_API_ADMIN_TOKEN must be at least ${MIN_SERVICE_TOKEN_LENGTH} characters`);
  }

  return { mode: 'production', adapterModule, publicBaseUrl: parsed.toString() };
}

export async function loadProductionApiOptions(env = process.env) {
  const config = validateProductionEnvironment(env);
  if (config.mode !== 'production') return { env };

  const imported = await import(resolveModuleSpecifier(config.adapterModule));
  if (typeof imported.createPersistenceAdapters !== 'function') {
    throw new Error('Persistence adapter module must export createPersistenceAdapters({ env })');
  }

  const adapters = await imported.createPersistenceAdapters({ env });
  const credentialStore = adapters?.credentialStore;
  if (!credentialStore || typeof credentialStore.ping !== 'function' || typeof credentialStore.getByVerificationId !== 'function') {
    throw new Error('Production persistence adapter must provide credentialStore.ping() and credentialStore.getByVerificationId()');
  }

  return {
    env,
    credentialStore,
    credentialWriter: adapters.credentialWriter ?? null,
    authorize: createServiceTokenAuthorizer({ tokens: serviceTokensFromEnvironment(env) })
  };
}
