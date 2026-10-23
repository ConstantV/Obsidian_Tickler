import esbuild from 'esbuild';
import fs from 'node:fs/promises';
await esbuild.build({entryPoints:['src/main.ts'],bundle:true,platform:'node',format:'cjs',target:'es2022',external:['obsidian','electron'],outfile:'main.js',minify:true,sourcemap:false});
await fs.copyFile('main.js','dist/main.js');
