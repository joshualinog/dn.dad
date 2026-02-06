const fs = require('fs');
const path = require('path');

const chars = require('../src/_data/characters');
const BASE = path.join(__dirname, '..', '_site', 'characters');
let ok = true;

chars.forEach(c => {
  const slug = c._slug;
  const out = path.join(BASE, slug, 'index.html');
  if (!fs.existsSync(out)) {
    console.error(`Missing built page for ${slug}: ${out}`);
    ok = false;
    return;
  }
  const html = fs.readFileSync(out, 'utf8');
  const expectedLevel = c.level;
  const needle = `<strong>Level:</strong> ${expectedLevel}`;
  if (!html.includes(needle)) {
    console.error(`Level mismatch for ${slug}: expected ${expectedLevel} not found in ${out}`);
    ok = false;
  }
});

if (!ok) process.exit(1);
console.log('Smoke tests passed: built pages exist and show expected level');
