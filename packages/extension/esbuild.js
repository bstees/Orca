const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/extension.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  sourcemap: false,
  minify: false,
}).catch(() => process.exit(1));
