import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPostgresCredentialStore } from './postgres-credential-store.mjs';
import { createPostgresCredentialWriter } from './postgres-credential-writer.mjs';
import { createPostgresLearnerStore } from './postgres-learner-store.mjs';
import { createPostgresPracticalEvaluatorStore } from './postgres-practical-evaluator-store.mjs';
import { createPostgresEnrollmentCompletionStore } from './postgres-enrollment-completion-store.mjs';

function required(env,name){
  const value=String(env?.[name]??'').trim();
  if(!value) throw new Error(`Production PostgreSQL adapter requires ${name}`);
  return value;
}
function resolveModuleSpecifier(value){
  if(value.startsWith('.')||value.startsWith('/')) return pathToFileURL(path.resolve(process.cwd(),value)).href;
  return value;
}
export function createTransactionRunner(pool){
  if(!pool||typeof pool.connect!=='function') throw new Error('PostgreSQL pool must provide connect() for transactional credential writes');
  return async function withTransaction(callback){
    const client=await pool.connect();
    if(!client||typeof client.query!=='function') throw new Error('PostgreSQL client must provide query(text, params)');
    try{
      await client.query('begin');
      const result=await callback((text,params=[])=>client.query(text,params));
      await client.query('commit');
      return result;
    }catch(error){
      try{ await client.query('rollback'); }catch{}
      throw error;
    }finally{
      if(typeof client.release==='function') client.release();
    }
  };
}
export function createPersistenceAdaptersFromPool({pool}={}){
  if(!pool||typeof pool.query!=='function') throw new Error('PostgreSQL pool must provide query(text, params)');
  const query=(text,params=[])=>pool.query(text,params);
  const withTransaction=createTransactionRunner(pool);
  return {
    credentialStore:createPostgresCredentialStore({query}),
    credentialWriter:createPostgresCredentialWriter({withTransaction}),
    learnerStore:createPostgresLearnerStore({query}),
    practicalEvaluatorStore:createPostgresPracticalEvaluatorStore({query}),
    enrollmentCompletionStore:createPostgresEnrollmentCompletionStore({query})
  };
}
export async function createPersistenceAdapters({env=process.env}={}){
  const poolModulePath=required(env,'THC_POSTGRES_POOL_MODULE');
  const provider=await import(resolveModuleSpecifier(poolModulePath));
  if(typeof provider.createPostgresPool!=='function'){
    throw new Error('THC_POSTGRES_POOL_MODULE must export createPostgresPool({ env })');
  }
  const pool=await provider.createPostgresPool({env});
  return createPersistenceAdaptersFromPool({pool});
}
