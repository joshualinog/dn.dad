const snapshotList = require('./snapshotList')();

module.exports = function() {
  const PAGE_SIZE = process.env.SNAPSHOT_PAGE_SIZE ? parseInt(process.env.SNAPSHOT_PAGE_SIZE, 10) : 5;
  const byChar = {};
  snapshotList.forEach(s => {
    if (!byChar[s.character]) byChar[s.character] = [];
    byChar[s.character].push(s);
  });
  // sort levels
  Object.keys(byChar).forEach(c => byChar[c].sort((a,b)=> a.level - b.level));

  const pages = [];
  Object.keys(byChar).forEach(character => {
    const arr = byChar[character];
    const totalPages = Math.max(1, Math.ceil(arr.length / PAGE_SIZE));
    for (let i=0;i<totalPages;i++) {
      const slice = arr.slice(i*PAGE_SIZE, (i+1)*PAGE_SIZE);
      pages.push({
        character,
        pageNumber: i+1,
        totalPages,
        snapshots: slice,
        levels: slice.map(s => s.level)
      });
    }
  });

  // stable sort by character
  pages.sort((a,b) => a.character.localeCompare(b.character) || a.pageNumber - b.pageNumber);
  return pages;
};