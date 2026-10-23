import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import crypto from 'node:crypto';
const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const views=source.split('// Browser behavior')[0].replace(/^import .*;\r?\n/,'');
const template=await readFile(new URL('../shell.html',import.meta.url),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPage(path,posts,origin){
  const elements=new Map();
  const element=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',content:'',href:'',textContent:'',dataset:{},insertAdjacentHTML(){}});return elements.get(s);};
  const context={__POSTS__:posts,cms:{administrator:null},crypto,URL,URLSearchParams,Date,location:new URL(path,origin),localStorage:{getItem(){return null}},matchMedia:()=>({matches:false}),document:{documentElement:{dataset:{}},querySelector:element,title:''}};
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
  if(path.startsWith('/admin'))html=html.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
  if(post){const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:post.title,description,datePublished:post.date,dateModified:post.updated_at,image:new URL(post.image,origin).href,author:{'@type':'Organization',name:'Stillwell'}};html=html.replace('</head>',`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`);}
  const known=['/','/services','/about','/blog','/contact','/privacy'];
  return {html,status:known.includes(path)||path.startsWith('/admin')||post?200:404};
}
