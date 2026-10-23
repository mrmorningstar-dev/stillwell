import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import page from './api/page.js';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:4173');
 if(!path.extname(url.pathname)||['/robots.txt','/sitemap.xml'].includes(url.pathname)){
 const response=await page.fetch(new Request(url,{method:req.method}));res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(Buffer.from(await response.arrayBuffer()));}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 const data=await readFile(file),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
