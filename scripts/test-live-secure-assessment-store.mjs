import assert from 'node:assert/strict';
import { verifySecureAssessmentStore } from './verify-live-secure-assessment-store.mjs';

const env={
  THC_VERIFY_ADMIN_MFA_TOKEN:'admin-mfa-secret-token',
  THC_VERIFY_SECURE_BANK_VERSION:'BANK-2026-001'
};
const goodFetch=async(url,options)=>{
  assert.equal(options.headers.authorization,`Bearer ${env.THC_VERIFY_ADMIN_MFA_TOKEN}`);
  assert.equal(new URL(url).pathname,'/api/v1/admin/secure-assessment/banks/BANK-2026-001');
  return new Response(JSON.stringify({
    bank:{
      bankVersion:'BANK-2026-001',
      credentialProgramId:'CREDPROG-CULT-TECH-I-001',
      status:'approved-operational',
      counts:{items:25,draft:0,pilot:0,approvedOperational:25,quarantined:0,retired:0},
      activatedAt:'2026-10-05T12:00:00.000Z',
      retiredAt:null
    }
  }),{status:200,headers:{'content-type':'application/json'}});
};

const report=await verifySecureAssessmentStore({baseUrl:'https://academy.dtfseeds.com',env,fetchImpl:goodFetch,timeoutMs:500});
assert.equal(report.passed,true);
assert.equal(report.counts.approvedOperational,25);
assert.equal(report.secretsIncluded,false);
assert.equal(JSON.stringify(report).includes(env.THC_VERIFY_ADMIN_MFA_TOKEN),false);

const leakingFetch=async()=>new Response(JSON.stringify({
  bank:{
    bankVersion:'BANK-2026-001',
    status:'approved-operational',
    counts:{items:1,approvedOperational:1},
    prompt:'protected',
    scoringKey:2
  }
}),{status:200,headers:{'content-type':'application/json'}});
const leaking=await verifySecureAssessmentStore({baseUrl:'https://academy.dtfseeds.com',env,fetchImpl:leakingFetch,timeoutMs:500});
assert.equal(leaking.passed,false);
assert.equal(leaking.checks.find(x=>x.name==='no-protected-item-material-returned')?.passed,false);

console.log('Live secure assessment store verifier: PASS');
