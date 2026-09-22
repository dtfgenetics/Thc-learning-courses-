import path from 'node:path';
import { pathToFileURL } from 'node:url';

function required(env,name){
  const value=String(env?.[name]??'').trim();
  if(!value) throw new Error(`Secure assessment integration requires ${name}`);
  return value;
}
function resolveModuleSpecifier(value){
  if(value.startsWith('.')||value.startsWith('/')) return pathToFileURL(path.resolve(process.cwd(),value)).href;
  return value;
}
const requiredMethods=['ping','bankVersion','selectOperationalItems','recordForm','recordExposure','quarantineItem'];
export function validateSecureAssessmentStore(store){
  if(!store||typeof store!=='object') throw new Error('secure assessment store required');
  for(const method of requiredMethods){
    if(typeof store[method]!=='function') throw new Error(`secure assessment store must provide ${method}()`);
  }
  if(store.kind==='public-repository'||store.kind==='development-public-bank') throw new Error('public/development assessment stores are prohibited for operational credential delivery');
  return store;
}
export async function loadSecureAssessmentStore(env=process.env){
  if(env.NODE_ENV!=='production') throw new Error('Secure operational assessment store loader requires NODE_ENV=production');
  const modulePath=required(env,'THC_SECURE_ASSESSMENT_STORE_MODULE');
  const provider=await import(resolveModuleSpecifier(modulePath));
  if(typeof provider.createSecureAssessmentStore!=='function') throw new Error('THC_SECURE_ASSESSMENT_STORE_MODULE must export createSecureAssessmentStore({ env })');
  return validateSecureAssessmentStore(await provider.createSecureAssessmentStore({env}));
}
