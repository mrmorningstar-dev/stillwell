import {renderPage} from '../lib/render.mjs';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../dist/config.js';
export default {async fetch(request){
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const url=new URL(request.url);
  let path=url.searchParams.get('path')||url.pathname;
  if(!path.startsWith('/')||path.startsWith('//'))return new Response('Invalid path',{status:400});
  path=path.replace(/\/$/,'')||'/';
  const origin=process.env.SITE_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL:url.origin);
  const headers={'Cache-Control':'private, no-store','Content-Type':'text/html; charset=utf-8'};
  try{
    let posts=[];
    if(!path.startsWith('/admin')){
      const response=await fetch(SUPABASE_URL+'/rest/v1/posts?select=*&status=eq.published&order=date.desc,created_at.desc',{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('Journal unavailable');
      posts=(await response.json()).map(p=>({...p,imageAlt:p.image_alt,seoTitle:p.seo_title,seoDescription:p.seo_description}));
    }
    if(path==='/sitemap.xml'){
      const paths=['/','/about','/services','/contact','/blog','/privacy',...posts.map(p=>'/blog/'+p.slug)];
      return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>`<url><loc>${origin+p}</loc></url>`).join('')+'</urlset>',{headers:{...headers,'Content-Type':'application/xml'}});
    }
    if(path==='/robots.txt')return new Response(`User-agent: *\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`,{headers:{...headers,'Content-Type':'text/plain'}});
    const page=renderPage(path,posts,origin);
    return new Response(request.method==='HEAD'?null:page.html,{status:page.status,headers});
  }catch{
    return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Stillwell · Please try again</title><link rel="stylesheet" href="/style.css"><main class="wrap section"><h1>A brief pause.</h1><p>The journal is temporarily unavailable. Please try again shortly.</p><a href="/">Try again</a></main></html>',{status:503,headers:{...headers,'Retry-After':'30'}});
  }
}};
