#!/usr/bin/env node
'use strict';
/**
 * Generate icon assets from assets/icon.svg.
 *
 * Outputs:
 *   assets/icon.png          — 1024×1024 (electron-builder Linux/Win source)
 *   assets/icon@2x.png       — 512×512
 *   assets/trayIconTemplate.png — 16×16 (macOS menu bar, Template image)
 *   assets/icon.icns          — macOS app/dock icon (requires macOS + iconutil)
 *   assets/icon.ico           — Windows icon (16/32/48/256 via ico-endec)
 */

const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SVG = path.join(ROOT, 'assets', 'icon.svg');
const ASSETS = path.join(ROOT, 'assets');

async function makePng(size, outFile) {
  await sharp(SVG).resize(size, size).png().toFile(outFile);
  console.log(`  ✓ ${path.relative(ROOT, outFile)} (${size}×${size})`);
}

async function makeIcns() {
  if (process.platform !== 'darwin') {
    console.log('  ⚠  Skipping .icns — macOS only (iconutil not available)');
    return;
  }
  const iconset = path.join(ASSETS, 'icon.iconset');
  fs.mkdirSync(iconset, { recursive: true });

  const sizes = [16, 32, 128, 256, 512];
  for (const s of sizes) {
    await sharp(SVG).resize(s, s).png().toFile(path.join(iconset, `icon_${s}x${s}.png`));
    await sharp(SVG).resize(s * 2, s * 2).png().toFile(path.join(iconset, `icon_${s}x${s}@2x.png`));
  }

  execSync(`iconutil --convert icns --output "${path.join(ASSETS, 'icon.icns')}" "${iconset}"`);
  fs.rmSync(iconset, { recursive: true });
  console.log('  ✓ assets/icon.icns');
}

(async () => {
  console.log('Generating Orca icons…');
  await makePng(1024, path.join(ASSETS, 'icon.png'));
  await makePng(512,  path.join(ASSETS, 'icon@2x.png'));
  await makePng(16,   path.join(ASSETS, 'trayIconTemplate.png'));
  await makePng(32,   path.join(ASSETS, 'trayIconTemplate@2x.png'));
  await makeIcns();
  console.log('Done.');
})();
