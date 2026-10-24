import { createClient } from './vendor/supabase.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
export const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'stillwell-auth' }
});
export let administrator = null;
export function clearAdministrator(){administrator=null;}
export const fromRow = p => ({...p,imageAlt:p.image_alt,seoTitle:p.seo_title,seoDescription:p.seo_description});
const toRow = p => ({id:p.id,title:p.title,slug:p.slug,excerpt:p.excerpt||'',body:p.body,image:p.image,image_alt:p.imageAlt||'',category:p.category,tags:p.tags||[],date:p.date,status:p.status,seo_title:p.seoTitle||'',seo_description:p.seoDescription||''});
export async function verifyAdministrator() {
  administrator=null;
  const {data:{session}}=await client.auth.getSession();
  if(!session)return false;
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return false;
  const {data,error:membershipError}=await client.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(membershipError)throw new Error('Could not verify administrator access. Please try again.');
  if(data)administrator={id:user.id,email:user.email};
  return !!administrator;
}
export async function signIn(email,password){
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error)throw new Error(error.status===429?'Too many sign-in attempts. Please wait before trying again.':'Unable to sign in. Check your email and password.');
  if(!await verifyAdministrator()){await client.auth.signOut();throw new Error('This account does not have administrator access.');}
}
export async function signOut(){const {error}=await client.auth.signOut();if(error)throw new Error('Sign-out failed. Please try again.');administrator=null;}
export async function loadPosts(){
  let query=client.from('posts').select('*').order('date',{ascending:false}).order('created_at',{ascending:false});
  if(!administrator)query=query.eq('status','published');
  const {data,error}=await query;
  if(error)throw new Error('The journal could not be loaded. Please check your connection and try again.');
  return data.map(fromRow);
}
export async function savePost(post){
  let query=post.version?client.from('posts').update(toRow(post)).eq('id',post.id).eq('version',post.version):client.from('posts').insert(toRow(post));
  const {data,error}=await query.select('*').maybeSingle();
  if(error){if(error.code==='23505')throw new Error('That article URL is already in use. Choose another.');throw new Error('The story could not be saved. Check your connection and administrator session.');}
  if(!data)throw new Error('This story changed in another session. Copy your changes, reload, and try again.');
  return fromRow(data);
}
export async function deletePost(post){const {data,error}=await client.from('posts').delete().eq('id',post.id).eq('version',post.version).select('id');if(error)throw new Error('The story could not be deleted. Please try again.');if(!data.length)throw new Error('This story changed in another session. Refresh before deleting it.');}
export async function uploadImage(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2097152)throw new Error('Choose a JPG, PNG, or WebP image smaller than 2 MB.');
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
  const name=`${crypto.randomUUID()}.${ext}`;
  const {error}=await client.storage.from('blog-images').upload(name,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
  if(error)throw new Error('The image could not be uploaded. Check your connection and administrator session.');
  return client.storage.from('blog-images').getPublicUrl(name).data.publicUrl;
}
export async function removeUnusedImage(url){if(!url.startsWith(SUPABASE_URL+'/storage/v1/object/public/blog-images/'))return;const name=url.split('/').pop();const {data,error}=await client.from('posts').select('id').eq('image',url).limit(1);if(error||data.length)return;await client.storage.from('blog-images').remove([name]);}
export async function loadProviders(){let query=client.from('providers').select('*').order('name');if(!administrator)query=query.eq('active',true).eq('verified',true);const {data,error}=await query;if(error)throw new Error('The provider directory could not be loaded. Please try again.');return data;}
export async function saveProvider(provider){const {id,...values}=provider;const query=id?client.from('providers').update(values).eq('id',id):client.from('providers').insert(values);const {data,error}=await query.select('*').single();if(error)throw new Error(error.code==='23505'?'That profile URL already exists. Choose another.':'Could not save this provider. Check the fields and your administrator session.');return data;}
export async function loadRequests(){if(!administrator)return [];const {data,error}=await client.from('care_requests').select('*').order('created_at',{ascending:false}).limit(500);if(error)throw new Error('Enquiries could not be loaded. Please try again.');return data;}
export async function submitRequest(request){const {error}=await client.from('care_requests').insert(request);if(error)throw new Error('Your test enquiry could not be saved. Check your details and connection, then try again.');}
export async function updateRequest(id,status){const {data,error}=await client.from('care_requests').update({status}).eq('id',id).select('*').single();if(error)throw new Error('The status could not be saved. Please try again.');return data;}
