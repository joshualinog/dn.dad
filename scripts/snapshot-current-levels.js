#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { convert } = require('./character-utils');

const CHAR_DIR = path.join(__dirname, '..', 'src', '_data', 'characters');

const args = process.argv.slice(2);
const force = args.includes('--force');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeSnapshot(baseName, level, obj) {
  const dir = path.join(CHAR_DIR, `${baseName}.levels`);
  ensureDir(dir);
  const outPath = path.join(dir, `${level}.schema.json`);
  if (fs.existsSync(outPath) && !force) {
    console.log(`Skipping existing snapshot: ${path.relative(process.cwd(), outPath)}`);
    return false;
  }
  const toWrite = Object.assign({ level, snapshot_at: new Date().toISOString() }, obj);
  fs.writeFileSync(outPath, JSON.stringify(toWrite, null, 2));
  console.log(`${fs.existsSync(outPath) ? 'Wrote' : 'Created'} snapshot ${path.relative(process.cwd(), outPath)}`);
  return true;
}

function main() {
  const files = fs.readdirSync(CHAR_DIR).filter(f => f.endsWith('.json') && !f.endsWith('.schema.json'));
  if (!files.length) {
    console.log('No characters found.');
    return;
  }
  let created = 0;
  files.forEach(file => {
    const raw = fs.readFileSync(path.join(CHAR_DIR, file), 'utf8');
    const src = JSON.parse(raw);
    const converted = convert(src);
    const base = path.basename(file).replace(/\.json$/, '');
    const level = src.level || (converted.classes && converted.classes[0] && converted.classes[0].levels) || 1;
    const wrote = writeSnapshot(base, level, converted);
    if (wrote) created++;
  });
  console.log(`Snapshots created: ${created}`);
}

main();
