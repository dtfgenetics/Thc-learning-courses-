import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function required(env,name){
  const value=String(env?.[name]??'').trim();
  if(!value) throw new Error(`Credential signing integration requires ${name}`);
  return value;
}
function resolveModuleSpecifier(value){
  if(value.startsWith('.')||value.startsWith('/')) return pathToFileURL(path.resolve(process.cwd(),value)).href;
  return value;
}
function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.keys(value).sort().map((key)=>[key,stable(value[key])]));
  }
  return value;
}
export function credentialPayloadDigest(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)) throw new Error('credential payload object required');
  const canonical=JSON.stringify(stable(payload));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
export function validateIssuerIdentity(identity){
  if(!identity||typeof identity!=='object') throw new Error('credential signer issuer identity required');
  for(const field of ['issuerId','name']) if(!String(identity[field]??'').trim()) throw new Error(`credential signer issuer identity requires ${field}`);
  if(identity.url){
    const parsed=new URL(identity.url);
    if(parsed.protocol!=='https:') throw new Error('credential issuer URL must use https');
  }
  return {issuerId:String(identity.issuerId),name:String(identity.name),url:identity.url?String(identity.url):null};
}
export function validateSignatureEnvelope(envelope){
  if(!envelope||typeof envelope!=='object') throw new Error('credential signature envelope required');
  for(const field of ['algorithm','keyId','signature']) if(!String(envelope[field]??'').trim()) throw new Error(`credential signature envelope requires ${field}`);
  const forbidden=['privateKey','private_key','secret','seed','pem','keyMaterial'];
  for(const field of forbidden) if(field in envelope) throw new Error(`credential signature envelope must not expose ${field}`);
  return {algorithm:String(envelope.algorithm),keyId:String(envelope.keyId),signature:String(envelope.signature)};
}
export function wrapCredentialSigner(rawSigner,{issuerIdentity}={}){
  if(!rawSigner||typeof rawSigner.signDigest!=='function') throw new Error('credential signer must provide signDigest({ digest, context })');
  const issuer=validateIssuerIdentity(issuerIdentity);
  return {
    kind:'managed-external-signer',
    issuer,
    async signCredentialPayload(payload,{credentialId=null,verificationId=null}={}){
      const digest=credentialPayloadDigest(payload);
      const envelope=validateSignatureEnvelope(await rawSigner.signDigest({
        digest,
        context:{credentialId,verificationId,issuerId:issuer.issuerId}
      }));
      return {digest,...envelope,issuer};
    }
  };
}
export async function loadProductionCredentialSigner(env=process.env){
  if(env.NODE_ENV!=='production') throw new Error('Production credential signer loader requires NODE_ENV=production');
  const modulePath=required(env,'THC_CREDENTIAL_SIGNER_MODULE');
  const provider=await import(resolveModuleSpecifier(modulePath));
  if(typeof provider.createCredentialSigner!=='function') throw new Error('THC_CREDENTIAL_SIGNER_MODULE must export createCredentialSigner({ env })');
  const rawSigner=await provider.createCredentialSigner({env});
  if(!rawSigner||typeof rawSigner.getIssuerIdentity!=='function') throw new Error('credential signer must provide getIssuerIdentity()');
  const issuerIdentity=await rawSigner.getIssuerIdentity();
  return wrapCredentialSigner(rawSigner,{issuerIdentity});
}
