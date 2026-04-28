import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(__dirname, 'dist/index.js'),
  external: ['pg'],
  conditions: ['module', 'import', 'node-addons'],
  packages: 'external',
});

console.log('API built successfully');
