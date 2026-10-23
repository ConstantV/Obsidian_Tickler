import esbuild from 'esbuild';
await esbuild.build({entryPoints:['src/view.ts'],bundle:true,platform:'browser',format:'iife',globalName:'TicklerHarness',outfile:'dist/view-harness.js'});
