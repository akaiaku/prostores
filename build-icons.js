#!/usr/bin/env node
/**
 * Converts SVG icons to PNG.
 * Source:  original/games/assets/icons/*.svg
 * Output:  games/assets/icons/<name>.png
 * Usage:   node build-icons.js [--size 256]
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = process.argv.slice(2);
const sizeArg = args.indexOf('--size');
const SIZE = sizeArg !== -1 ? parseInt(args[sizeArg + 1], 10) : 256;

const root      = __dirname;
const srcDir    = path.join(root, 'original', 'games', 'assets', 'icons');
const destDir   = path.join(root, 'games', 'assets', 'icons');

fs.mkdirSync(destDir, { recursive: true });

const svgFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

if (svgFiles.length === 0) {
    console.warn('[warn] No SVG files found in', srcDir);
    process.exit(0);
}

(async () => {
    for (const file of svgFiles) {
        const src  = path.join(srcDir, file);
        const dest = path.join(destDir, file.replace(/\.svg$/, '.png'));
        try {
            await sharp(src)
                .resize(SIZE, SIZE)
                .png()
                .toFile(dest);
            console.log(`[ok]   ${path.relative(root, src)}  →  ${path.relative(root, dest)}`);
        } catch (e) {
            console.error(`[fail] ${file}: ${e.message}`);
        }
    }
    console.log(`\nDone. (${svgFiles.length} file(s), ${SIZE}×${SIZE}px)`);
})();
