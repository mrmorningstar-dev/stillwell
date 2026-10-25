import test from 'node:test';
import assert from 'node:assert/strict';
import {routePaths,renderCare} from '../dist/care-site.js';
import {services,conditions,medications,professionalPages} from '../dist/care-data.js';
import {renderPage} from '../lib/render.mjs';

test('Every care route contains a developed guide with working section links',()=>{
  for(const path of routePaths){
    const {html}=renderCare(path);
    const words=html.replace(/<[^>]*>/g,' ').trim().split(/\s+/).length;
    assert.ok(words>=250,`${path}: only ${words} words`);
    assert.ok((html.match(/<h2[ >]/g)||[]).length>=3,path);
    assert.doesNotMatch(html,/undefined|\[object Object\]/,path);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,path+' duplicate IDs');
    for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),path+' broken section '+m[1]);
  }
});
test('Care guides retain distinct topic information and clinical source links',()=>{
  for(const item of [...services,...conditions,...medications]){
    const html=renderCare(item.path).html;
    assert.ok((html.match(/<details>/g)||[]).length>=3,item.path+' FAQs');
    assert.ok(html.includes(item.name.replace(/&/g,'&amp;')),item.path);
  }
  for(const item of [...conditions,...medications]){
    assert.match(renderCare(item.path).html,/class="wrap guide-sources"/);
    assert.match(renderCare(item.path).html,/https:\/\/(www.nimh.nih.gov|www.nhs.uk|medlineplus.gov)/);
  }
});
test('Professional content keeps the original form and all three review steps',()=>{
  for(const page of professionalPages){const {html}=renderCare(page.path);
    assert.equal((html.match(/id="care-request-form"/g)||[]).length,1,page.path);
    assert.equal((html.match(/data-form-step=/g)||[]).length,3,page.path);
    assert.match(html,/type="checkbox"[^>]*name="consent"|name="consent"[^>]*type="checkbox"/);
  }
});
test('Supporting pages include their new content in server-rendered output',()=>{
  for(const path of ['/about','/contact','/blog','/privacy']){
    const {html,status}=renderPage(path,[],'https://stillwell-theta.vercel.app');
    assert.equal(status,200);assert.match(html,/guide-section/);
    assert.match(html,/href="\/content.css"/);
  }
});
