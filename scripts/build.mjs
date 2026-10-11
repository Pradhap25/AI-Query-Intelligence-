/**
 * AI Query Intelligence - Extension Build Script using esbuild
 */

import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const isWatch = process.argv.includes('--watch');
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--minify');

const distDir = path.resolve('dist');

// Ensure dist and dist/icons exist
fs.mkdirSync(path.join(distDir, 'icons'), { recursive: true });

// Copy static assets
function copyStaticAssets() {
  fs.copyFileSync('extension/manifest.json', path.join(distDir, 'manifest.json'));
  fs.copyFileSync('extension/popup/popup.html', path.join(distDir, 'popup.html'));
  fs.copyFileSync('extension/options/options.html', path.join(distDir, 'options.html'));

  const iconFiles = fs.readdirSync('extension/icons');
  for (const file of iconFiles) {
    fs.copyFileSync(
      path.join('extension/icons', file),
      path.join(distDir, 'icons', file)
    );
  }
  console.log('[Build] Copied manifest, html, and icons to /dist.');
}

const buildConfigs = [
  // Background service worker (ESM)
  {
    entryPoints: ['extension/background/index.ts'],
    outfile: 'dist/background.js',
    bundle: true,
    format: 'esm',
    target: 'es2022',
    minify: isProd,
    sourcemap: !isProd ? 'inline' : false,
  },
  // Content script (IIFE for safe isolated execution in page)
  {
    entryPoints: ['extension/content/index.ts'],
    outfile: 'dist/content.js',
    bundle: true,
    format: 'iife',
    target: 'es2022',
    minify: isProd,
    sourcemap: !isProd ? 'inline' : false,
  },
  // Popup
  {
    entryPoints: ['extension/popup/popup.ts'],
    outfile: 'dist/popup.js',
    bundle: true,
    format: 'esm',
    target: 'es2022',
    minify: isProd,
    sourcemap: !isProd ? 'inline' : false,
  },
  // Options
  {
    entryPoints: ['extension/options/options.ts'],
    outfile: 'dist/options.js',
    bundle: true,
    format: 'esm',
    target: 'es2022',
    minify: isProd,
    sourcemap: !isProd ? 'inline' : false,
  },
];

async function runBuild() {
  copyStaticAssets();

  for (const config of buildConfigs) {
    if (isWatch) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
      console.log(`[Watch] Watching ${config.entryPoints[0]} -> ${config.outfile}`);
    } else {
      await esbuild.build(config);
      console.log(`[Build] Compiled ${config.entryPoints[0]} -> ${config.outfile}`);
    }
  }

  console.log('[Build] Extension successfully built into /dist!');
}

runBuild().catch((err) => {
  console.error('[Build Error]:', err);
  process.exit(1);
});
