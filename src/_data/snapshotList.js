const fs = require('fs');
const path = require('path');

module.exports = function() {
  const CHAR_DIR = path.join(__dirname, 'characters');
  const snapshots = [];
  if (!fs.existsSync(CHAR_DIR)) return snapshots;
  const entries = fs.readdirSync(CHAR_DIR);
  entries.forEach(entry => {
    if (!entry.endsWith('.levels')) return;
    const base = entry.replace(/\.levels$/, '');
    const dir = path.join(CHAR_DIR, entry);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.schema.json'));
    files.forEach(f => {
      const level = parseInt(f.replace(/\.schema\.json$/, ''), 10);
      let raw = '{}';
      try { raw = fs.readFileSync(path.join(dir, f), 'utf8'); } catch (e) {}
      let data = {};
      try { data = JSON.parse(raw); } catch (e) {}
      snapshots.push({ character: base, level, data });
    });
  });
  // sort snapshots for stable output
  snapshots.sort((a,b)=> a.character.localeCompare(b.character) || a.level - b.level);
  return snapshots;
};