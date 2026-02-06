const snapshotList = require('../src/_data/snapshotList')();
const snapshotsIndex = require('../src/_data/snapshotsIndex')();

const byChar = {};
snapshotList.forEach(s => {
  if (!byChar[s.character]) byChar[s.character] = [];
  byChar[s.character].push(s.level);
});

let ok = true;
Object.keys(byChar).forEach(c => {
  const list = byChar[c].slice().sort((a,b)=>a-b);
  const idx = (snapshotsIndex[c] || []).slice().sort((a,b)=>a-b);
  if (list.length !== idx.length || list.some((v,i)=>v !== idx[i])) {
    console.error(`Mismatch for ${c}: list=${JSON.stringify(list)} idx=${JSON.stringify(idx)}`);
    ok = false;
  }
});

if (!ok) {
  console.error('Snapshot index mismatch');
  process.exit(1);
}
console.log('Snapshot index OK');
