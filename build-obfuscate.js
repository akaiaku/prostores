#!/usr/bin/env node
/**
 * Obfuscates inline <script> blocks in HTML files.
 * Source:  original/<rel>
 * Output:  <rel>  (overwrites root files)
 * Usage:   node build-obfuscate.js
 */

const fs   = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const TARGETS = [
    'index.html',
    'privacy.html',
    'terms.html',
    'games/index.html',
    'games/flappy-bird/index.html',
    'games/bau-cua/index.html',
    'games/gold-miner/index.html',
    'games/tai-xiu-la/index.html',
    'games/plants-vs-zombies/index.html'
];

const JS_TARGETS = [
    'games/game-sound.js',
    'games/game-ui.js',
];

const OPTIONS = {
    compact:                          true,
    controlFlowFlattening:            true,
    controlFlowFlatteningThreshold:   0.5,
    deadCodeInjection:                true,
    deadCodeInjectionThreshold:       0.3,
    debugProtection:                  true,
    debugProtectionInterval:          4000,
    disableConsoleOutput:             true,
    identifierNamesGenerator:         'hexadecimal',
    log:                              false,
    numbersToExpressions:             true,
    renameGlobals:                    false,
    selfDefending:                    true,
    simplify:                         true,
    splitStrings:                     true,
    splitStringsChunkLength:          8,
    stringArray:                      true,
    stringArrayCallsTransform:        true,
    stringArrayEncoding:              ['base64'],
    stringArrayIndexShift:            true,
    stringArrayRotate:                true,
    stringArrayShuffle:               true,
    stringArrayWrappersCount:         2,
    stringArrayWrappersChainedCalls:  true,
    stringArrayThreshold:             0.75,
    transformObjectKeys:              false,
    unicodeEscapeSequence:            false,
};

const SCRIPT_RE = /(<script(?:\s[^>]*)?>)([\s\S]*?)(<\/script>)/gi;

function obfuscateHtml(src) {
    return src.replace(SCRIPT_RE, (_, open, code, close) => {
        const trimmed = code.trim();
        if (!trimmed) return open + code + close;
        try {
            const result = JavaScriptObfuscator.obfuscate(trimmed, OPTIONS);
            return open + '\n' + result.getObfuscatedCode() + '\n' + close;
        } catch (e) {
            console.warn('  [skip] obfuscation failed for a block:', e.message);
            return open + code + close;
        }
    });
}

const root        = __dirname;
const originalDir = path.join(root, 'original');

for (const rel of TARGETS) {
    const src  = path.join(originalDir, rel);
    const dest = path.join(root, rel);

    if (!fs.existsSync(src)) {
        console.warn(`[skip] not found: original/${rel}`);
        continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const html       = fs.readFileSync(src, 'utf8');
    const obfuscated = obfuscateHtml(html);
    fs.writeFileSync(dest, obfuscated, 'utf8');
    console.log(`[ok]   original/${rel}  →  ${rel}`);
}

for (const rel of JS_TARGETS) {
    const src  = path.join(originalDir, rel);
    const dest = path.join(root, rel);

    if (!fs.existsSync(src)) {
        console.warn(`[skip] not found: original/${rel}`);
        continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const code = fs.readFileSync(src, 'utf8');
    try {
        const result = JavaScriptObfuscator.obfuscate(code, OPTIONS);
        fs.writeFileSync(dest, result.getObfuscatedCode(), 'utf8');
        console.log(`[ok]   original/${rel}  →  ${rel}`);
    } catch (e) {
        console.warn(`  [skip] obfuscation failed for ${rel}:`, e.message);
        fs.writeFileSync(dest, code, 'utf8');
    }
}

console.log('\nDone.');
