import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../lib/render.mjs';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../dist/config.js';
const post={id:'test',title:'A <script> title',slug:'test-story',body:'## A heading\n\n**Bold** and *italic* <img src=x onerror=alert(1)>',image:'/assets/slow.jpg',excerpt:'A test introduction',category:'Everyday wellbeing',date:'2026-10-23',status:'published',seoTitle:'Custom search title',seoDescription:'Custom search description'};
test('Articles render readable content and SEO without executing editor HTML',()=>{
  const {html,status}=renderPage('/blog/test-story',[post],'https://stillwell-theta.vercel.app');
  assert.equal(status,200);assert.match(html,/<title>Custom search title \| Stillwell<\/title>/);
  assert.match(html,/<strong>Bold<\/strong>/);assert.match(html,/&lt;img src=x/);assert.doesNotMatch(html,/<img src=x/);
  assert.match(html,/application\/ld\+json/);assert.match(html,/Custom search description/);
});
test('Unpublished or missing articles return a real 404',()=>{
  assert.equal(renderPage('/blog/test-story',[],'https://stillwell-theta.vercel.app').status,404);
});
test('Heading formatting does not swallow the paragraph on the next line',()=>{
  const {html}=renderPage('/blog/test-story',[{...post,body:'## Heading\nA regular paragraph.'}],'https://stillwell-theta.vercel.app');
  assert.match(html,/<h2>Heading<\/h2><p>A regular paragraph\.<\/p>/);
});
test('Administrator page requires sign-in and is excluded from indexing',()=>{
  const {html}=renderPage('/admin',[],'https://stillwell-theta.vercel.app');
  assert.match(html,/id="login-form"/);assert.match(html,/noindex,nofollow/);assert.doesNotMatch(html,/Open demo workspace/);
});
test('Live database does not expose drafts or allow anonymous writes',async()=>{
  const headers={apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'};
  const read=await fetch(SUPABASE_URL+'/rest/v1/posts?select=id,status',{headers});
  assert.equal(read.status,200);assert.ok((await read.json()).every(p=>p.status==='published'));
  const draft=await fetch(SUPABASE_URL+'/rest/v1/posts?select=id&status=eq.draft',{headers});
  assert.deepEqual(await draft.json(),[]);
  const create=await fetch(SUPABASE_URL+'/rest/v1/posts',{method:'POST',headers,body:JSON.stringify({id:'anonymous-security-check',title:'Unauthorized',slug:'anonymous-security-check',body:'Must not save',category:'Everyday wellbeing'})});
  assert.ok([401,403].includes(create.status));
  const membership=await fetch(SUPABASE_URL+'/rest/v1/site_admins?select=user_id',{headers});
  assert.ok([401,403].includes(membership.status));
});
