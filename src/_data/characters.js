const fs = require("fs");
const path = require("path");

// Read all character JSON files in the characters directory
const charactersDir = path.join(__dirname, "characters");
const files = fs.readdirSync(charactersDir).filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"));

function formatSpeed(sp) {
  if (!sp) return undefined;
  const parts = [];
  if (sp.Walk) parts.push(`${sp.Walk} ft`);
  if (sp.Swim) parts.push(`(swim ${sp.Swim} ft)`);
  return parts.join(' ');
}

function weaponToAction(w) {
  const name = w.name || 'Weapon';
  let val = '';
  if (w.damage && w.damage.dice) {
    const d = w.damage.dice;
    val = `${d.count}d${d.sides}${d.mod ? '+' + d.mod : ''}`;
  }
  if (w.damage && w.damage.type) val = (val ? val + ' ' : '') + `(${w.damage.type})`;
  return { name, value: val, notes: '' };
}

module.exports = files.map((file) => {
  const filePath = path.join(charactersDir, file);
  const data = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(data);
  // add slug (basename) so templates can reference snapshot files (e.g., dahg.levels)
  parsed._slug = file.replace(/\.json$/, '');

  // If a schema-derived file exists, merge a few canonical fields for template compatibility
  const schemaPath = path.join(charactersDir, parsed._slug + '.schema.json');
  if (fs.existsSync(schemaPath)) {
    try {
      const raw = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(raw);
      // Basic fields (prefer schema when available)
      if (schema.name) parsed.name = schema.name;
      if (schema.background && schema.background.name) parsed.background = schema.background.name;
      if (schema.background && schema.background.description && !parsed.backgroundFeature) parsed.backgroundFeature = { description: schema.background.description };
      if (schema.race && schema.race.name) parsed.species = parsed.species || schema.race.name;
      if (schema.classes && schema.classes[0]) {
        parsed.class = parsed.class || schema.classes[0].name;
        parsed.subclass = parsed.subclass || schema.classes[0].subclass;
        parsed.level = parsed.level || schema.classes[0].levels;
      }
      if (schema.alignment) parsed.alignment = parsed.alignment || schema.alignment;
      if (schema.inspiration) parsed.inspiration = parsed.inspiration || schema.inspiration;
      if (schema.armor_class && schema.armor_class.value) parsed.ac = parsed.ac || schema.armor_class.value;
      if (schema.hit_points && typeof schema.hit_points.max !== 'undefined') parsed.hp = parsed.hp || schema.hit_points.max;
      if (schema.speed) parsed.speed = parsed.speed || formatSpeed(schema.speed);
      if (schema.languages) parsed.languages = parsed.languages || schema.languages;
      // coins/treasure -> coins.gold
      if (schema.treasure && typeof schema.treasure.gp !== 'undefined') {
        parsed.coins = parsed.coins || {};
        parsed.coins.gold = parsed.coins.gold || schema.treasure.gp;
      }
      // attach weapons -> combatActions if missing
      if ((!parsed.combatActions || parsed.combatActions.length === 0) && Array.isArray(schema.weapons)) {
        parsed.combatActions = schema.weapons.map(weaponToAction);
      }
    } catch (e) {
      console.warn('Failed reading schema for', parsed._slug, e.message);
    }
  }

  // Add pretty-printed raw JSON so templates can display the full character object for debugging/styling
  try {
    parsed._raw = JSON.stringify(parsed, null, 2);
  } catch (e) {
    parsed._raw = String(parsed);
  }

  return parsed;
});
