/**
 * AI Query Intelligence - Extension Packaging Script
 * Produces a store-ready ZIP archive for Chrome Web Store & Edge Add-ons
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('[Package] Starting release build...');

// 1. Run production build
execSync('node scripts/build.mjs --minify', { stdio: 'inherit' });

// 2. Validate release bundle
const distDir = path.resolve('dist');
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

for (const req of requiredFiles) {
  const fullPath = path.join(distDir, req);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[Package Error] Missing required bundle file: ${req}`);
  }
}

// 3. Read manifest and verify version
const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
const version = manifest.version || '1.0.0';
const zipName = `ai-query-intelligence-v${version}.zip`;
const zipPath = path.resolve(zipName);

// Remove existing zip if any
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 4. Archive dist directory
console.log(`[Package] Creating archive ${zipName}...`);
try {
  // Use PowerShell Compress-Archive
  execSync(`powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`, {
    stdio: 'inherit',
  });
} catch (err) {
  console.error('[Package Error] PowerShell Compress-Archive failed:', err);
  process.exit(1);
}

const stats = fs.statSync(zipPath);
const sizeKb = (stats.size / 1024).toFixed(1);

console.log(`\n======================================================`);
console.log(` Package Created Successfully!`);
console.log(` Archive:  ${zipName} (${sizeKb} KB)`);
console.log(` Version:  ${version}`);
console.log(` Platform: Chrome Web Store & Microsoft Edge Add-ons`);
console.log(` Status:   Production Ready`);
console.log(`======================================================\n`);
