#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv').default;

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');
const INPUT = path.join(__dirname, '..', 'src', '_data', 'characters', 'dahg.json');
const OUTPUT = path.join(__dirname, '..', 'src', '_data', 'characters', 'dahg.schema.json');

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
  // e.g., "1d8+3"
  if (!str) return null;
  const m = /(?:(\d+)d(\d+))(?:\s*\+\s*(\d+))?/.exec(str);
  if (!m) return null;
  return { count: parseInt(m[1], 10), sides: parseInt(m[2], 10), mod: m[3] ? parseInt(m[3], 10) : 0 };
}

function parseSpeed(str) {
  // "30 ft (swim 30 ft)" => { Walk: 30, Swim: 30 }
  const speeds = { Walk: 0, Swim: 0 };
  if (typeof str === 'object') return str;
  if (!str) return speeds;
  const walk = /([0-9]+)\s*ft(?!.*swim)/i.exec(str);
  const walkAlt = /([0-9]+)\s*ft(?=\s*\(|$)/i.exec(str);
  const s = str;
  const w = /([0-9]+)\s*ft(?!.*swim)/i.exec(s) || walkAlt;
  const sw = /swim\s*([0-9]+)\s*ft/i.exec(s);
  if (w) speeds.Walk = parseInt(w[1], 10);
  if (sw) speeds.Swim = parseInt(sw[1], 10);
  // fallback: if it just begins with number
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

  // player required by Character.schema
  out.player = { name: d.player && d.player.name ? d.player.name : 'Unknown (imported)' };

  // race
  out.race = { name: d.species || d.race || 'Unknown' };

  // classes
  out.classes = [{ name: d.class || 'Unknown', levels: d.level || 1, subclass: d.subclass }];

  // background
  if (d.background) out.background = { name: d.background };
  if (d.backgroundFeature && d.backgroundFeature.description) {
    out.background = out.background || { name: d.background || 'Custom' };
    out.background.description = d.backgroundFeature.description;
  }

  // speed
  out.speed = parseSpeed(d.speed);

  // hit points
  out.hit_points = { max: d.hp || (d.hit_points && d.hit_points.max) || 0 };

  // armor
  out.armor_class = { value: d.ac || 10 };
  if (d.specialAbilities) {
    const na = d.specialAbilities.find(s => /natural armor/i.test(s.name));
    if (na) out.armor_class.description = na.description;
  }

  // inspiration
  if (d.inspiration) out.inspiration = d.inspiration;

  // ability scores
  out.ability_scores = {
    str: d.strength && d.strength.score ? d.strength.score : undefined,
    dex: d.dexterity && d.dexterity.score ? d.dexterity.score : undefined,
    con: d.constitution && d.constitution.score ? d.constitution.score : undefined,
    int: d.intelligence && d.intelligence.score ? d.intelligence.score : undefined,
    wis: d.wisdom && d.wisdom.score ? d.wisdom.score : undefined,
    cha: d.charisma && d.charisma.score ? d.charisma.score : undefined
  };

  // saving throws
  out.saving_throws = {};
  ['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(key => {
    const s = d[key];
    if (s && s.savingThrow) {
      const short = key.slice(0,3);
      out.saving_throws[short] = parseMod(s.savingThrow);
    }
  });

  // skills
  out.skills = {};
  ['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(key => {
    const s = d[key];
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

  // languages
  if (d.languages) out.languages = d.languages;

  // treasure / coins
  out.treasure = { gp: (d.coins && d.coins.gold) ? d.coins.gold : 0 };

  // weapons and equipment
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

  // spells -> produce minimal Spell objects
  out.spells = [];
  if (d.spells) {
    if (Array.isArray(d.spells.cantrips)) d.spells.cantrips.forEach(n => out.spells.push({ name: n, level: 0 }));
    if (Array.isArray(d.spells.level1)) d.spells.level1.forEach(n => out.spells.push({ name: n, level: 1 }));
    if (Array.isArray(d.spells.optional)) d.spells.optional.forEach(n => out.spells.push({ name: n, level: 1 }));
  }

  // details/backstory
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

  const raw = fs.readFileSync(INPUT, 'utf8');
  const src = JSON.parse(raw);
  const converted = convert(src);

  const valid = characterSchema(converted);
  if (!valid) {
    console.error('Validation failed:');
    console.error(JSON.stringify(characterSchema.errors, null, 2));
    fs.writeFileSync(OUTPUT, JSON.stringify(converted, null, 2));
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(converted, null, 2));
  console.log('Converted and validated Dahg ->', path.relative(process.cwd(), OUTPUT));
}

main();
