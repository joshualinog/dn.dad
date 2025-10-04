const fs = require("fs");
const path = require("path");

// Read all character JSON files in the characters directory
const charactersDir = path.join(__dirname, "characters");
const files = fs.readdirSync(charactersDir).filter((f) => f.endsWith(".json"));

module.exports = files.map((file) => {
  const data = fs.readFileSync(path.join(charactersDir, file), "utf-8");
  return JSON.parse(data);
});
