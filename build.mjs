import {build} from 'esbuild';
import {rm} from 'node:fs/promises';
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',minify:true,outfile:'dist/vendor/supabase.js'});
await rm('dist/index.html',{force:true});
console.log('Built browser client. All pages use live server rendering.');
