/**
 * Copy the static site into dist/ so Netlify does not publish node_modules.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, 'dist');
const skip = new Set([
  'node_modules',
  'dist',
  '.git',
  '.insforge',
  '.env',
  '.env.local',
  'functions',
  'migrations',
  'netlify',
]);

function copyDir(src, out) {
  fs.mkdirSync(out, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name) || entry.name.startsWith('.')) continue;
    const from = path.join(src, entry.name);
    const to = path.join(out, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(root, dest);
console.log('Prepared', dest);
