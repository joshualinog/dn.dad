const snapshotList = require('./snapshotList')();

module.exports = function() {
  const idx = {};
  snapshotList.forEach(s => {
    if (!idx[s.character]) idx[s.character] = [];
    idx[s.character].push(s.level);
  });
  const arr = Object.keys(idx).map(k => ({ character: k, levels: idx[k].sort((a,b)=>a-b), total: idx[k].length }));
  arr.sort((a,b)=>a.character.localeCompare(b.character));
  return arr;
};