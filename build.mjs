import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
import {renderPage} from './lib/render.mjs';
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',minify:true,outfile:'dist/vendor/supabase.js'});
await writeFile('dist/index.html',renderPage('/',[],process.env.SITE_URL||'http://localhost:4173').html);
console.log('Built browser client and server-rendered page shell.');
