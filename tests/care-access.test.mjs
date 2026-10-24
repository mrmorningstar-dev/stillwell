import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../dist/config.js';
const headers={apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'};
test('Anonymous clients see only published verified providers and cannot read enquiries',async()=>{const res=await fetch(SUPABASE_URL+'/rest/v1/providers?select=active,verified',{headers});assert.equal(res.status,200);assert.ok((await res.json()).every(p=>p.active&&p.verified));const privateRes=await fetch(SUPABASE_URL+'/rest/v1/care_requests?select=id',{headers});assert.ok([401,403].includes(privateRes.status));});
test('Anonymous clients cannot create providers or control enquiry status',async()=>{const res=await fetch(SUPABASE_URL+'/rest/v1/providers',{method:'POST',headers,body:JSON.stringify({name:'Forbidden'})});assert.ok([401,403].includes(res.status));const forge=await fetch(SUPABASE_URL+'/rest/v1/care_requests',{method:'POST',headers,body:JSON.stringify({status:'closed',is_test:false})});assert.ok([401,403].includes(forge.status));});
