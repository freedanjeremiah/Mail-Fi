const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['scripts/nexus-umd-entry.js'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'NexusUMD',
    target: ['es2018'],
    outfile: 'public/nexus-umd.js',
    sourcemap: true,
  })
  .then(() => {
    console.log('Built public/nexus-umd.js');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
