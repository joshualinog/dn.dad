#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv').default;

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');
const CHAR_DIR = path.join(__dirname, '..', 'src', '_data', 'characters');

function loadSchemas(ajv) {
  const files = fs.readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.json') || f.endsWith('.js'));
  files.forEach(f => {
    const p = path.join(SCHEMAS_DIR, f);
    const raw = fs.readFileSync(p, 'utf8');
    try {
      const s = JSON.parse(raw);
      const id = s.$id || f;
      ajv.addSchema(s, id);
    } catch (e) {
      console.warn('Skipping schema', f, e.message);
    }
  });
}

function parseMod(mod) {
  if (typeof mod === 'number') return mod;
  if (!mod) return undefined;
  const cleaned = String(mod).replace(/[^0-9-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseDice(str) {
  if (!str) return null;
  const m = /(?:(\d+)d(\d+))(?:\s*\+\s*(\d+))?/.exec(str);
  if (!m) return null;
  return { count: parseInt(m[1], 10), sides: parseInt(m[2], 10), mod: m[3] ? parseInt(m[3], 10) : 0 };
}

function parseSpeed(str) {
  const speeds = { Walk: 0, Swim: 0 };
  if (typeof str === 'object') return str;
  if (!str) return speeds;
  const walkAlt = /([0-9]+)\s*ft(?=\s*\(|$)/i.exec(str);
  const w = /([0-9]+)\s*ft(?!.*swim)/i.exec(str) || walkAlt;
  const sw = /swim\s*([0-9]+)\s*ft/i.exec(str);
  if (w) speeds.Walk = parseInt(w[1], 10);
  if (sw) speeds.Swim = parseInt(sw[1], 10);
  if (!speeds.Walk) {
    const m = /^([0-9]+)/.exec(str);
    if (m) speeds.Walk = parseInt(m[1], 10);
  }
  return speeds;
}

const skillKeyMap = {
  'Athletics': 'Athletics',
  'Acrobatics': 'Acrobatics',
  'Sleight of Hand': 'SleightOfHand',
  'SleightOfHand': 'SleightOfHand',
  'Stealth': 'Stealth',
  'Arcana': 'Arcana',
  'History': 'History',
  'Investigation': 'Investigation',
  'Nature': 'Nature',
  'Religion': 'Religion',
  'Animal Handling': 'AnimalHandling',
  'AnimalHandling': 'AnimalHandling',
  'Insight': 'Insight',
  'Medicine': 'Medicine',
  'Perception': 'Perception',
  'Survival': 'Survival',
  'Deception': 'Deception',
  'Intimidation': 'Intimidation',
  'Performance': 'Performance',
  'Persuasion': 'Persuasion'
};

function convert(d) {
  const out = {};
  out.name = d.name;
  if (d.alignment) out.alignment = d.alignment;
  out.player = { name: d.player && d.player.name ? d.player.name : 'Unknown (imported)' };
  out.race = { name: d.species || d.race || 'Unknown' };
  out.classes = [{ name: d.class || 'Unknown', levels: d.level || 1, subclass: d.subclass }];
  if (d.background) out.background = { name: d.background };
  if (d.backgroundFeature && d.backgroundFeature.description) {
    out.background = out.background || { name: d.background || 'Custom' };
    out.background.description = d.backgroundFeature.description;
  }
  out.speed = parseSpeed(d.speed);
  out.hit_points = { max: d.hp || (d.hit_points && d.hit_points.max) || 0 };
  out.armor_class = { value: d.ac || 10 };
  if (d.specialAbilities) {
    const na = d.specialAbilities.find(s => /natural armor/i.test(s.name));
    if (na) out.armor_class.description = na.description;
  }
  if (d.inspiration) out.inspiration = d.inspiration;
  // Support both full-named and shorthand ability fields (e.g., 'd', 'i', 'ch')
  const abilities = {
    strength: d.strength || d.s || d.str,
    dexterity: d.dexterity || d.d || d.dex,
    constitution: d.constitution || d.c || d.con,
    intelligence: d.intelligence || d.i || d.int,
    wisdom: d.wisdom || d.w || d.wis,
    charisma: d.charisma || d.ch || d.cha
  };

  out.ability_scores = {
    str: abilities.strength && abilities.strength.score ? abilities.strength.score : undefined,
    dex: abilities.dexterity && abilities.dexterity.score ? abilities.dexterity.score : undefined,
    con: abilities.constitution && abilities.constitution.score ? abilities.constitution.score : undefined,
    int: abilities.intelligence && abilities.intelligence.score ? abilities.intelligence.score : undefined,
    wis: abilities.wisdom && abilities.wisdom.score ? abilities.wisdom.score : undefined,
    cha: abilities.charisma && abilities.charisma.score ? abilities.charisma.score : undefined
  };

  // saving throws
  out.saving_throws = {};
  Object.keys(abilities).forEach(key => {
    const s = abilities[key];
    if (s && s.savingThrow) {
      const short = key.slice(0,3);
      out.saving_throws[short] = parseMod(s.savingThrow);
    }
  });

  // skills
  out.skills = {};
  Object.keys(abilities).forEach(key => {
    const s = abilities[key];
    if (s && Array.isArray(s.skills)) {
      s.skills.forEach(skill => {
        const k = skill.name;
        const mapped = skillKeyMap[k];
        if (mapped) {
          out.skills[mapped] = parseMod(skill.mod);
        }
      });
    }
  });
  if (d.languages) out.languages = d.languages;
  out.treasure = { gp: (d.coins && d.coins.gold) ? d.coins.gold : 0 };
  out.weapons = [];
  out.equipment = [];
  if (d.combatActions && Array.isArray(d.combatActions)) {
    d.combatActions.forEach(a => {
      if (/rapier/i.test(a.name)) {
        const dice = parseDice(a.value);
        out.weapons.push({ name: 'Rapier', damage: { dice: dice || { count:1, sides:8, mod:0 }, type: 'Piercing' } });
      }
    });
  }
  if (d.equipment) {
    if (d.equipment.armor) out.equipment.push({ name: d.equipment.armor });
    if (d.equipment.weapons) out.equipment.push({ name: d.equipment.weapons });
    if (d.equipment.tools) out.equipment.push({ name: d.equipment.tools });
    if (d.equipment.packs) out.equipment.push({ name: d.equipment.packs });
  }
  out.spells = [];
  if (d.spells) {
    if (Array.isArray(d.spells.cantrips)) d.spells.cantrips.forEach(n => out.spells.push({ name: n, level: 0 }));
    if (Array.isArray(d.spells.level1)) d.spells.level1.forEach(n => out.spells.push({ name: n, level: 1 }));
    if (Array.isArray(d.spells.optional)) d.spells.optional.forEach(n => out.spells.push({ name: n, level: 1 }));
  }
  out.details = out.details || {};
  if (d.backgroundFeature && d.backgroundFeature.description) out.details.backstory = d.backgroundFeature.description;
  if (d.roleplayNotes) out.details.personality = (Array.isArray(d.roleplayNotes) ? d.roleplayNotes.join('\n') : d.roleplayNotes);
  return out;
}

function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  loadSchemas(ajv);
  const characterSchema = ajv.getSchema('Character.schema.json') || ajv.getSchema('Character.schema.json#');
  if (!characterSchema) {
    console.error('Could not find Character.schema.json in schemas dir. Make sure schemas were installed.');
    process.exit(2);
  }

  const files = fs.readdirSync(CHAR_DIR).filter(f => f.endsWith('.json') && !f.endsWith('.schema.json'));
  if (!files.length) {
    console.log('No character files found.');
    return;
  }

  let failed = 0;
  files.forEach(file => {
    try {
      const raw = fs.readFileSync(path.join(CHAR_DIR, file), 'utf8');
      const src = JSON.parse(raw);
      const converted = convert(src);
      const valid = characterSchema(converted);
      const outPath = path.join(CHAR_DIR, file.replace(/\.json$/, '.schema.json'));
      fs.writeFileSync(outPath, JSON.stringify(converted, null, 2));
      if (!valid) {
        failed++;
        console.error(`Validation failed for ${file}:`);
        console.error(JSON.stringify(characterSchema.errors, null, 2));
      } else {
        console.log(`Converted and validated ${file} -> ${path.relative(process.cwd(), outPath)}`);
      }
    } catch (e) {
      failed++;
      console.error(`Error processing ${file}: ${e.message}`);
    }
  });

  if (failed) {
    console.error(`${failed} file(s) failed validation or processing.`);
    process.exit(1);
  }
  console.log('All characters converted and validated successfully.');
}

main();
