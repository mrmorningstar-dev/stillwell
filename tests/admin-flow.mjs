// Receives the administrator password on stdin; never prints or stores credentials.
import {createClient} from '@supabase/supabase-js';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../dist/config.js';
process.stdout.write('Administrator password (hidden): ');
const password=await new Promise(resolve=>{let value='';if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.resume();const receive=chunk=>{value+=chunk.toString();if(/[\r\n]/.test(value)){process.stdin.off('data',receive);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value.split(/[\r\n]/)[0]);}};process.stdin.on('data',receive);});
const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:auth,error:loginError}=await client.auth.signInWithPassword({email:'testadmin@stillwell.com',password});
assert.equal(loginError,null,'Administrator sign-in must succeed');
const {data:member,error:membershipError}=await client.from('site_admins').select('user_id').eq('user_id',auth.user.id).single();
assert.equal(membershipError,null,'Account must have administrator membership');assert.ok(member);
console.log('PASS: Email/password sign-in and administrator membership');
const id='qa-'+crypto.randomUUID(),slug=id,imagePath=id+'.jpg';let inserted=false,uploaded=false;
const origin=process.env.SITE_URL||'https://stillwell-theta.vercel.app';
const check=async(status,phrase)=>{const r=await fetch(origin+'/blog/'+slug);assert.equal(r.status,status);const html=await r.text();if(phrase)assert.ok(html.includes(phrase));};
try{
  const image=await readFile(new URL('../dist/assets/slow.jpg',import.meta.url));
  const {error:uploadError}=await client.storage.from('blog-images').upload(imagePath,image,{contentType:'image/jpeg'});assert.equal(uploadError,null);uploaded=true;
  const imageUrl=client.storage.from('blog-images').getPublicUrl(imagePath).data.publicUrl;
  assert.equal((await fetch(imageUrl)).status,200);console.log('PASS: Featured image upload and public delivery');
  const draft={id,slug,title:'Temporary publishing verification',body:'## Test heading\n\n**Bold text** and *italic text*.',excerpt:'Temporary automated test. Removed when verification finishes.',image:imageUrl,image_alt:'Test landscape',category:'Everyday wellbeing',status:'draft',tags:['verification'],seo_title:'Publishing verification title',seo_description:'Publishing verification description'};
  let result=await client.from('posts').insert(draft).select().single();assert.equal(result.error,null);inserted=true;let post=result.data;
  await check(404);console.log('PASS: Draft created and hidden from public website');
  result=await client.from('posts').update({status:'published'}).eq('id',id).eq('version',post.version).select().single();assert.equal(result.error,null);post=result.data;
  await check(200,'<strong>Bold text</strong>');assert.ok((await(await fetch(origin+'/sitemap.xml')).text()).includes('/blog/'+slug));console.log('PASS: Publish renders formatted content and updates sitemap');
  result=await client.from('posts').update({title:'Updated verification story'}).eq('id',id).eq('version',post.version).select().single();assert.equal(result.error,null);const previousVersion=post.version;post=result.data;
  await check(200,'Updated verification story');
  const stale=await client.from('posts').update({title:'Must not overwrite'}).eq('id',id).eq('version',previousVersion).select();assert.deepEqual(stale.data,[]);console.log('PASS: Edit persists and stale edits cannot overwrite it');
  result=await client.from('posts').update({status:'draft'}).eq('id',id).eq('version',post.version).select().single();assert.equal(result.error,null);post=result.data;
  await check(404);assert.ok(!(await(await fetch(origin+'/sitemap.xml')).text()).includes('/blog/'+slug));console.log('PASS: Unpublish removes article and sitemap entry');
  result=await client.from('posts').delete().eq('id',id).eq('version',post.version).select();assert.equal(result.error,null);assert.equal(result.data.length,1);inserted=false;console.log('PASS: Delete removes the story');
}finally{
  if(inserted){const {error}=await client.from('posts').delete().eq('id',id);if(error)console.error('Test story cleanup failed:',id);}
  if(uploaded){const {error}=await client.storage.from('blog-images').remove([imagePath]);assert.equal(error,null,'Test image cleanup must succeed');}
  await client.auth.signOut();
}
