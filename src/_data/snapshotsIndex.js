module.exports = function() {
  // Re-calculate the snapshot list each time so Eleventy picks up new snapshots
  // during incremental/serve builds instead of using the stale list captured at
  // module load time.
  const snapshotList = require('./snapshotList')();
  const idx = {};
  snapshotList.forEach(s => {
    if (!idx[s.character]) idx[s.character] = [];
    idx[s.character].push(s.level);
  });
  // sort levels
  Object.keys(idx).forEach(k => idx[k].sort((a,b)=>a-b));
  return idx;
};