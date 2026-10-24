import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import crypto from 'node:crypto';
import * as careSite from '../dist/care-site.js';
import * as careAdmin from '../dist/care-admin.js';
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const views=source.split('// Browser behavior')[0].replace(/^import .*;\r?\n/gm,'');
const template=await readFile(new URL('../shell.html',import.meta.url),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPage(path,posts,origin,providers=[]){
  const requestedPath=path;path=new URL(path,origin).pathname;
  const elements=new Map();
  const element=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',content:'',href:'',textContent:'',dataset:{},insertAdjacentHTML(){}});return elements.get(s);};
  providers=providers.filter(p=>p.active&&p.verified);
  const context={__POSTS__:posts,__PROVIDERS__:providers,careSite,careAdmin,cms:{administrator:null},crypto,URL,URLSearchParams,Date,location:new URL(requestedPath,origin),localStorage:{getItem(){return null}},matchMedia:()=>({matches:false}),document:{documentElement:{dataset:{}},querySelector:element,title:''}};
  vm.createContext(context);vm.runInContext(views+'\nrender();',context,{timeout:1000});
  const post=posts.find(p=>'/blog/'+p.slug===path),title=context.document.title,description=element('meta[name=description]').content;
  let html=template.replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/,`$1${esc(description)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/,`$1${esc(description)}`)
    .replace(/(<meta property="og:image" content=")[^"]*/,`$1${esc(new URL(post?.image||'/assets/hero.webp',origin).href)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/,`$1${esc(origin+path)}`)
    .replace('<div id="app"></div>',`<div id="app">${element('#app').innerHTML}</div>`)
    .replace('</head>',`<script type="application/json" id="initial-posts">${JSON.stringify(posts).replace(/</g,'\\u003c')}</script></head>`);
  html=html.replace('</head>',`<script type="application/json" id="initial-providers">${JSON.stringify(providers).replace(/</g,'\\u003c')}</script></head>`);
  if(path.startsWith('/admin'))html=html.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
  if(post){const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:post.title,description,datePublished:post.date,dateModified:post.updated_at,image:new URL(post.image,origin).href,author:{'@type':'Organization',name:'Stillwell'}};html=html.replace('</head>',`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`);}
  const pathname=new URL(path,origin).pathname;
  const known=['/','/about','/blog','/contact','/privacy',...careSite.routePaths,...providers.map(p=>'/therapists/'+p.slug)];
  return {html,status:known.includes(pathname)||pathname.startsWith('/admin')||post?200:404};
}
