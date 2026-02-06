#!/usr/bin/env node
const characters = require('../src/_data/characters');

const failures = [];
function fail(which, msg) {
  failures.push({ which, msg });
}

characters.forEach(ch => {
  const who = ch._slug || ch.name || '<unknown>';
  // Required fields
  if (!ch.name) fail(who, 'missing name');
  if (typeof ch.level === 'undefined' || ch.level === null) fail(who, 'missing level');
  if (!ch.class && !(ch.classes && ch.classes[0] && ch.classes[0].name)) fail(who, 'missing class');
  if (typeof ch.ac === 'undefined' && !(ch.armor && ch.armor.value)) fail(who, 'missing ac');
  if (typeof ch.hp === 'undefined' && !(ch.hit_points && typeof ch.hit_points.max !== 'undefined')) fail(who, 'missing hp');
  if (!ch._slug) fail(who, 'missing _slug');

  // Optional sanity checks
  if (ch.speed && typeof ch.speed !== 'string') fail(who, 'speed should be string');
  if (ch.languages && !Array.isArray(ch.languages)) fail(who, 'languages should be array');
  if ((!ch.combatActions || !Array.isArray(ch.combatActions) || ch.combatActions.length === 0) && (!ch.weapons || !Array.isArray(ch.weapons) || ch.weapons.length === 0)) {
    fail(who, 'no combatActions or weapons found');
  }
});

if (failures.length) {
  console.error('Character tests failed:');
  failures.forEach(f => console.error(` - ${f.which}: ${f.msg}`));
  process.exit(1);
}

console.log('All character tests passed ✅');
process.exit(0);
