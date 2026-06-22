#!/usr/bin/env node
/**
 * Zips each game directory into its own package.
 * Source:  games/<name>/
 * Output:  dist/<name>.zip
 * Usage:   node build-zip.js
 */

const fs       = require('fs');
const path     = require('path');
const { ZipArchive } = require('archiver');

const EXCLUDE_DIRS = new Set(['assets']);

// Shared files referenced as "../<file>" from each game's index.html
const SHARED_FILES = ['game-sound.js', 'game-ui.js'];

const root     = __dirname;
const gamesDir = path.join(root, 'games');
const distDir  = path.join(root, 'dist');

fs.mkdirSync(distDir, { recursive: true });

const games = fs.readdirSync(gamesDir).filter(name => {
    if (EXCLUDE_DIRS.has(name)) return false;
    return fs.statSync(path.join(gamesDir, name)).isDirectory();
});

if (games.length === 0) {
    console.warn('[warn] No game directories found in games/');
    process.exit(0);
}

function zipGame(name) {
    return new Promise((resolve, reject) => {
        const src  = path.join(gamesDir, name);
        const dest = path.join(distDir, `${name}.zip`);
        const output  = fs.createWriteStream(dest);
        const archive = new ZipArchive({ zlib: { level: 9 } });

        output.on('close', () => {
            const kb = (archive.pointer() / 1024).toFixed(1);
            console.log(`[ok]   games/${name}/  →  dist/${name}.zip  (${kb} KB)`);
            resolve();
        });
        archive.on('error', reject);

        archive.pipe(output);
        // Game folder: extracts to <name>/index.html (path matches "../" references)
        archive.directory(src, name);
        // Shared JS at zip root so "../game-sound.js" resolves correctly after extract
        for (const file of SHARED_FILES) {
            const filePath = path.join(gamesDir, file);
            if (fs.existsSync(filePath)) archive.file(filePath, { name: file });
        }
        archive.finalize();
    });
}

(async () => {
    for (const name of games) {
        try {
            await zipGame(name);
        } catch (e) {
            console.error(`[fail] ${name}: ${e.message}`);
        }
    }
    console.log(`\nDone. (${games.length} game(s) → dist/)`);
})();
